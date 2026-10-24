-- Configurações do site: só o servidor lê e grava; privado exige senha.
begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

select is((select count(*) from public.site_settings), 1::bigint, 'existe uma linha só');
select throws_ok(
  $$ insert into public.site_settings (id) values (false) $$,
  '23514', null, 'não dá para criar outra linha'
);
select throws_ok(
  $$ update public.site_settings set private = true, password_hash = null $$,
  '23514', null, 'site privado exige senha'
);

set local role anon;
select throws_ok($$ select private from public.site_settings $$, '42501', null, 'visitante não lê as configurações');
reset role;

select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
set local role authenticated;
select throws_ok($$ select password_hash from public.site_settings $$, '42501', null, 'usuário logado não lê o hash da senha');
reset role;

select * from finish();
rollback;
