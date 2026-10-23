-- Fase 5: histórico de importações do addon. Só o servidor grava; cada conta
-- vê e apaga só o próprio histórico.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email, aud, role) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local', 'authenticated', 'authenticated');

-- Gravação feita pelo servidor (service role não passa por RLS).
insert into public.addon_imports
  (user_id, schema_version, addon_version, region, characters_count, mounts_count, categories, payload_sha256)
values
  ('11111111-1111-4111-8111-111111111111', 1, '0.1.0', 'us', 1, 2, array['characters', 'mounts'], repeat('a', 64)),
  ('22222222-2222-4222-8222-222222222222', 1, '0.1.0', 'eu', 2, null, array['characters'], repeat('b', 64));

select throws_ok(
  $$ insert into public.addon_imports (user_id, schema_version, addon_version, categories, payload_sha256)
     values ('11111111-1111-4111-8111-111111111111', 1, '0.1.0', array['characters'], repeat('a', 64)) $$,
  '23505', null, 'o mesmo arquivo não é importado duas vezes'
);
select throws_ok(
  $$ insert into public.addon_imports (user_id, schema_version, addon_version, categories, payload_sha256)
     values ('11111111-1111-4111-8111-111111111111', 1, '0.1.0', array['senhas'], repeat('c', 64)) $$,
  '23514', null, 'categoria fora da lista é recusada'
);

create function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

select pg_temp.login_as('11111111-1111-4111-8111-111111111111');
select is((select count(*) from public.addon_imports), 1::bigint, 'A vê só a própria importação');
select is((select region from public.addon_imports), 'us', 'A vê a própria região');
select throws_ok(
  $$ insert into public.addon_imports (schema_version, addon_version, categories, payload_sha256)
     values (1, '0.1.0', array['mounts'], repeat('d', 64)) $$,
  '42501', null, 'A não grava histórico direto pelo navegador'
);
select throws_ok(
  $$ update public.addon_imports set mounts_count = 5000 $$,
  '42501', null, 'A não altera o histórico'
);
delete from public.addon_imports where region = 'eu';
reset role;
select is(
  (select count(*) from public.addon_imports where user_id = '22222222-2222-4222-8222-222222222222'),
  1::bigint, 'A não apaga o histórico de B'
);

select pg_temp.login_as('11111111-1111-4111-8111-111111111111');
delete from public.addon_imports;
reset role;
select is(
  (select count(*) from public.addon_imports where user_id = '11111111-1111-4111-8111-111111111111'),
  0::bigint, 'A apaga o próprio histórico'
);

set local role anon;
select throws_ok($$ select count(*) from public.addon_imports $$, '42501', null, 'anon não lê importações');
reset role;

select * from finish();
rollback;
