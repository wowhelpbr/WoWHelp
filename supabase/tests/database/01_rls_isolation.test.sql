-- Isolamento entre contas (gate da Fase 1): o usuário A cria e lê seus objetivos;
-- o usuário B e visitantes anônimos não conseguem ler, alterar nem apagar.
-- Rodar com: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(27);

-- Usuários de teste (o trigger on_auth_user_created cria os perfis).
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values
  ('11111111-1111-4111-8111-111111111111', 'alice@test.local',
   '{"locale":"pt-BR","focus_areas":["weekly","mounts","hacking","mounts"]}', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'bruno@test.local',
   '{"locale":"xx-XX","focus_areas":"mounts"}', 'authenticated', 'authenticated');

select is(
  (select focus_areas from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  array['mounts', 'weekly'],
  'trigger filtra e deduplica áreas de foco do cadastro'
);
select is(
  (select focus_areas from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  '{}'::text[],
  'focus_areas que não é lista não quebra o cadastro'
);

select is(
  (select locale from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'pt-BR',
  'trigger cria perfil com locale válido do cadastro'
);
select is(
  (select locale from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  'en-US',
  'locale inválido no cadastro vira en-US'
);

-- Helper local: autentica como um usuário.
create function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ---------------------------------------------------------------- usuário A
select pg_temp.login_as('11111111-1111-4111-8111-111111111111');

select lives_ok(
  $$ insert into public.goals (title, priority) values ('Obter a montaria X', 2) $$,
  'A cria um objetivo sem informar user_id'
);
select is(
  (select user_id from public.goals where title = 'Obter a montaria X'),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'user_id do objetivo vem da sessão, não do cliente'
);
select throws_ok(
  $$ insert into public.goals (user_id, title) values ('22222222-2222-4222-8222-222222222222', 'forjado') $$,
  '42501',
  null,
  'A não consegue gravar objetivo em nome de B'
);
select lives_ok(
  $$ insert into public.goal_steps (goal_id, label)
     select id, 'Ir até o vendedor' from public.goals where title = 'Obter a montaria X' $$,
  'A adiciona etapa ao próprio objetivo'
);
select is((select count(*) from public.goals), 1::bigint, 'A vê o próprio objetivo');
select is((select count(*) from public.goal_steps), 1::bigint, 'A vê a própria etapa');
select throws_ok(
  $$ update public.profiles set id = gen_random_uuid() $$,
  '42501',
  null,
  'A não pode trocar o id do perfil'
);
select lives_ok(
  $$ update public.profiles set focus_areas = array['mounts','weekly'] $$,
  'A atualiza as próprias áreas de foco'
);
select throws_ok(
  $$ update public.profiles set focus_areas = array['hacking'] $$,
  '23514',
  null,
  'área de foco fora da lista é rejeitada'
);

-- ---------------------------------------------------------------- usuário B
reset role;
select pg_temp.login_as('22222222-2222-4222-8222-222222222222');

select is((select count(*) from public.goals), 0::bigint, 'B não lê objetivos de A');
select is((select count(*) from public.goal_steps), 0::bigint, 'B não lê etapas de A');
select is((select count(*) from public.profiles), 1::bigint, 'B só lê o próprio perfil');

update public.goals set title = 'invadido';
delete from public.goals;
reset role;
select is(
  (select title from public.goals where user_id = '11111111-1111-4111-8111-111111111111'),
  'Obter a montaria X',
  'update de B não afeta objetivo de A'
);
select is(
  (select count(*) from public.goals where user_id = '11111111-1111-4111-8111-111111111111'),
  1::bigint,
  'delete de B não apaga objetivo de A'
);

-- B descobre o id do objetivo de A (pior caso) e tenta pendurar uma etapa nele.
create temp table a_goal as
  select id from public.goals where user_id = '11111111-1111-4111-8111-111111111111';
grant select on a_goal to authenticated;

select pg_temp.login_as('22222222-2222-4222-8222-222222222222');
select throws_ok(
  format(
    $$ insert into public.goal_steps (goal_id, label) values (%L, 'etapa intrusa') $$,
    (select id from a_goal)
  ),
  '23503',
  null,
  'FK composta barra etapa de B no objetivo de A mesmo sabendo o id'
);
reset role;

-- ---------------------------------------------------------------- anônimo
set local role anon;
select throws_ok($$ select count(*) from public.goals $$, '42501', null, 'anon não acessa goals');
select throws_ok($$ select count(*) from public.goal_steps $$, '42501', null, 'anon não acessa goal_steps');
select throws_ok($$ select count(*) from public.profiles $$, '42501', null, 'anon não acessa profiles');
reset role;

-- ---------------------------------------------------------------- catálogo
insert into public.collectibles (id, kind, external_item_id, review_status)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'mount', 'test-approved', 'approved'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'mount', 'test-draft', 'draft');
insert into public.collectible_translations (collectible_id, locale, name)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'en-US', 'Approved test mount'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'en-US', 'Draft test mount');

set local role anon;
select is((select count(*) from public.collectibles), 1::bigint, 'anon só vê itens aprovados');
select is((select count(*) from public.collectible_translations), 1::bigint, 'anon só vê traduções de itens aprovados');
select throws_ok(
  $$ insert into public.collectibles (kind, external_item_id) values ('mount', 'x') $$,
  '42501',
  null,
  'anon não escreve no catálogo'
);
reset role;

select pg_temp.login_as('11111111-1111-4111-8111-111111111111');
select throws_ok(
  $$ update public.collectibles set review_status = 'approved' $$,
  '42501',
  null,
  'usuário logado não aprova conteúdo editorial'
);
select is((select count(*) from public.collectibles), 1::bigint, 'usuário logado só vê itens aprovados');
reset role;

select * from finish();
rollback;
