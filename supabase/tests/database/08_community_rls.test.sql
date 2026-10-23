-- Comunidade BR: público vê só criador publicado; pedidos são privados e limitados.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

delete from auth.users;
delete from public.creators;

insert into auth.users (id, email, aud, role) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local', 'authenticated', 'authenticated');

insert into public.creators (id, slug, display_name, status) values
  ('dddddddd-0000-4000-8000-000000000001', 'publicado', 'Publicado', 'published'),
  ('dddddddd-0000-4000-8000-000000000002', 'rascunho', 'Rascunho', 'draft');
insert into public.creator_channels (creator_id, platform, handle, url) values
  ('dddddddd-0000-4000-8000-000000000001', 'twitch', 'publicado', 'https://www.twitch.tv/publicado'),
  ('dddddddd-0000-4000-8000-000000000002', 'youtube', '@rascunho', 'https://www.youtube.com/@rascunho');

select throws_ok(
  $$ insert into public.creator_channels (creator_id, platform, handle, url)
     values ('dddddddd-0000-4000-8000-000000000001', 'twitch', 'PUBLICADO', 'https://www.twitch.tv/x') $$,
  '23505', null, 'o mesmo canal não entra duas vezes (maiúsculas não importam)'
);
select throws_ok(
  $$ insert into public.creator_channels (creator_id, platform, handle, url)
     values ('dddddddd-0000-4000-8000-000000000001', 'twitch', 'x y', 'javascript:alert(1)') $$,
  '23514', null, 'canal e link fora do formato são recusados'
);

set local role anon;
select is((select count(*) from public.creators), 1::bigint, 'visitante vê só criador publicado');
select is((select count(*) from public.creator_channels), 1::bigint, 'visitante vê só canais de criador publicado');
select throws_ok($$ select count(*) from public.creator_requests $$, '42501', null, 'visitante não vê pedidos');
reset role;

create function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

select pg_temp.login_as('11111111-1111-4111-8111-111111111111');
select throws_ok(
  $$ insert into public.creators (slug, display_name, status) values ('eu', 'Eu', 'published') $$,
  '42501', null, 'usuário não cria criador pelo navegador'
);
select lives_ok(
  $$ insert into public.creator_requests (display_name, links) values ('Eu Mesmo', 'https://www.twitch.tv/eumesmo') $$,
  'usuário pede para ser listado'
);
insert into public.creator_requests (display_name, links) values ('Eu Mesmo', 'https://www.twitch.tv/eumesmo2');
insert into public.creator_requests (display_name, links) values ('Eu Mesmo', 'https://www.twitch.tv/eumesmo3');
select throws_ok(
  $$ insert into public.creator_requests (display_name, links) values ('Eu Mesmo', 'https://www.twitch.tv/eumesmo4') $$,
  'P0001', null, 'no máximo 3 pedidos em aberto'
);
reset role;

select pg_temp.login_as('22222222-2222-4222-8222-222222222222');
select is((select count(*) from public.creator_requests), 0::bigint, 'B não vê os pedidos de A');
select throws_ok(
  $$ insert into public.creator_requests (display_name, links, status) values ('B', 'https://kick.com/b', 'approved') $$,
  '42501', null, 'B não aprova o próprio pedido'
);
reset role;

select * from finish();
rollback;
