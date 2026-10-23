-- Tentativas: cada conta vê só as próprias; só o servidor grava; somem com o personagem.
begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

delete from auth.users;

insert into auth.users (id, email, aud, role) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local', 'authenticated', 'authenticated');

insert into public.characters (id, user_id, source, region, realm_slug, name) values
  ('cccccccc-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'blizzard_api', 'us', 'test', 'Amage'),
  ('cccccccc-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'blizzard_api', 'us', 'test', 'Bwarrior');

insert into public.encounter_kills (user_id, character_id, journal_encounter_id, difficulty, completed_count) values
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-0000-4000-8000-000000000001', 1234, 'HEROIC', 7),
  ('22222222-2222-4222-8222-222222222222', 'cccccccc-0000-4000-8000-000000000002', 1234, 'HEROIC', 3);

select throws_ok(
  $$ insert into public.encounter_kills (user_id, character_id, journal_encounter_id, difficulty, completed_count)
     values ('11111111-1111-4111-8111-111111111111', 'cccccccc-0000-4000-8000-000000000002', 1, 'HEROIC', 1) $$,
  '23503', null, 'não liga contagem ao personagem de outra conta'
);

create function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

select pg_temp.login_as('11111111-1111-4111-8111-111111111111');
select is((select sum(completed_count)::int from public.encounter_kills), 7, 'A vê só as próprias mortes de chefe');
select throws_ok(
  $$ insert into public.encounter_kills (user_id, character_id, journal_encounter_id, difficulty, completed_count)
     values ('11111111-1111-4111-8111-111111111111', 'cccccccc-0000-4000-8000-000000000001', 99, 'MYTHIC', 500) $$,
  '42501', null, 'A não grava tentativas pelo navegador'
);
reset role;

delete from public.characters where id = 'cccccccc-0000-4000-8000-000000000001';
select is(
  (select count(*) from public.encounter_kills where user_id = '11111111-1111-4111-8111-111111111111'),
  0::bigint, 'tentativas somem com o personagem'
);

set local role anon;
select throws_ok($$ select count(*) from public.encounter_kills $$, '42501', null, 'anon não lê tentativas');
reset role;

select * from finish();
rollback;
