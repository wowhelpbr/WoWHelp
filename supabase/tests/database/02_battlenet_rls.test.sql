-- Fase 2: dados da Battle.net só são gravados pelo servidor; cada conta só vê
-- os próprios; marcação manual de coleção é permitida; limpeza de 30 dias.
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

-- Começa do zero (tudo volta no rollback do fim): o teste não depende do que
-- já existe no banco local, como contas e catálogo criados pelos testes E2E.
delete from auth.users;
delete from public.collectibles;

insert into auth.users (id, email, aud, role) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local', 'authenticated', 'authenticated');

-- Como o servidor (service role / dono da tabela) grava dados da Blizzard para A.
insert into public.game_connections (id, user_id, region, external_account_ref, battletag, characters_synced_at)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111', 'us', '424242', 'Tester#1234', now());
insert into public.characters (user_id, connection_id, source, region, realm_slug, external_character_id, name, fetched_at)
values
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'blizzard_api', 'us', 'test-realm', '9001', 'Atual', now()),
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'blizzard_api', 'us', 'test-realm', '9002', 'Velho', now() - interval '31 days');
insert into public.collection_states (user_id, kind, external_item_id, status, source, observed_at, fetched_at)
values
  ('11111111-1111-4111-8111-111111111111', 'mount', '6', 'collected', 'blizzard_api', now(), now()),
  ('11111111-1111-4111-8111-111111111111', 'mount', '7', 'collected', 'blizzard_api', now() - interval '40 days', now() - interval '40 days');

create function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- Usuário A
select pg_temp.login_as('11111111-1111-4111-8111-111111111111');
select is((select count(*) from public.characters), 2::bigint, 'A vê os próprios personagens');
select is((select count(*) from public.game_connections), 1::bigint, 'A vê a própria conexão');
select throws_ok(
  $$ insert into public.characters (user_id, source, region, realm_slug, name)
     values ('11111111-1111-4111-8111-111111111111', 'blizzard_api', 'us', 'x', 'Forjado') $$,
  '42501', null, 'navegador não grava personagem'
);
select throws_ok(
  $$ insert into public.game_connections (user_id, region, external_account_ref)
     values ('11111111-1111-4111-8111-111111111111', 'eu', '1') $$,
  '42501', null, 'navegador não grava conexão'
);
select throws_ok(
  $$ insert into public.collection_states (kind, external_item_id, status, source, observed_at)
     values ('mount', '99', 'collected', 'blizzard_api', now()) $$,
  '42501', null, 'navegador não finge dado vindo da Blizzard'
);
select lives_ok(
  $$ insert into public.collection_states (kind, external_item_id, status, source, observed_at)
     values ('mount', '99', 'collected', 'manual', now()) $$,
  'navegador marca coleção manualmente'
);
select is(
  (select user_id from public.collection_states where source = 'manual'),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'marcação manual fica com o user_id da sessão'
);

-- Usuário B
reset role;
select pg_temp.login_as('22222222-2222-4222-8222-222222222222');
select is((select count(*) from public.characters), 0::bigint, 'B não vê personagens de A');
select is((select count(*) from public.collection_states), 0::bigint, 'B não vê coleção de A');
delete from public.characters;
reset role;
select is((select count(*) from public.characters), 2::bigint, 'B não apaga personagens de A');

-- Anônimo
set local role anon;
select throws_ok($$ select count(*) from public.characters $$, '42501', null, 'anon não lê personagens');
reset role;

-- Limpeza de 30 dias
select private.purge_expired_api_data();
select is((select array_agg(name) from public.characters), array['Atual'], 'limpeza apaga personagem com mais de 30 dias');
select is(
  (select array_agg(external_item_id order by external_item_id) from public.collection_states),
  array['6', '99'],
  'limpeza apaga coleção vencida da Blizzard e mantém a manual'
);
select is((select count(*) from cron.job where jobname = 'wowhelp-purge-expired-api-data'), 1::bigint, 'limpeza agendada no pg_cron');

select * from finish();
rollback;
