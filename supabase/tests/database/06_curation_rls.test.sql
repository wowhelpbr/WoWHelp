-- Curadoria: só o servidor grava; o público só vê o que foi aprovado.
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

delete from auth.users;
delete from public.collectible_guides;

insert into auth.users (id, email, aud, role) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated');

insert into public.collectible_guides (kind, external_item_id, drop_chance_percent, source_url, status, reviewed_at)
values
  ('mount', '6', 1, 'https://example.com/fonte', 'approved', now()),
  ('mount', '7', null, null, 'draft', null);

select throws_ok(
  $$ insert into public.collectible_guides (kind, external_item_id, drop_chance_percent) values ('mount', '8', 2) $$,
  '23514', null, 'chance de drop exige fonte'
);
select throws_ok(
  $$ insert into public.collectible_guides (kind, external_item_id, status) values ('mount', '9', 'approved') $$,
  '23514', null, 'aprovado exige data de revisão'
);
select throws_ok(
  $$ insert into public.collectible_guides (kind, external_item_id, source_url) values ('mount', '10', 'javascript:alert(1)') $$,
  '23514', null, 'fonte só em https'
);

set local role anon;
select is((select count(*) from public.collectible_guides), 1::bigint, 'visitante vê só o aprovado');
reset role;

create function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

select pg_temp.login_as('11111111-1111-4111-8111-111111111111');
select is((select count(*) from public.collectible_guides), 1::bigint, 'usuário vê só o aprovado');
select throws_ok(
  $$ insert into public.collectible_guides (kind, external_item_id) values ('mount', '11') $$,
  '42501', null, 'usuário não grava curadoria'
);
select throws_ok(
  $$ update public.collectible_guides set drop_chance_percent = 50 $$,
  '42501', null, 'usuário não altera curadoria'
);
select throws_ok($$ select count(*) from public.app_admins $$, '42501', null, 'usuário não lê a lista de administradores');
reset role;

select * from finish();
rollback;
