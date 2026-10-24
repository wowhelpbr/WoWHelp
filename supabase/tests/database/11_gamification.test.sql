-- Gamificação: my_progress() soma só o que é da conta logada.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

delete from auth.users;
insert into auth.users (id, email, aud, role) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local', 'authenticated', 'authenticated');

-- Dados de A (gravados como servidor) e um pouco de B, que A nunca pode somar.
insert into public.goals (id, user_id, title, status, completed_at) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Cinzas de Al''ar', 'completed', now()),
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Subir o alt', 'active', null),
  ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Objetivo de B', 'completed', now());
insert into public.goal_steps (user_id, goal_id, label, completed_at) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000001', 'Passo 1', now()),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000001', 'Passo 2', now()),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000002', 'Passo aberto', null),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-000000000001', 'Passo de B', now());
insert into public.recurring_tasks (id, user_id, title, cadence) values
  ('cccccccc-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Cofre', 'weekly'),
  ('cccccccc-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Diária', 'daily');
insert into public.task_completions (user_id, task_id, cycle_key) values
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-0000-4000-8000-000000000001', 'us-w-2026-10-20'),
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-0000-4000-8000-000000000001', 'us-w-2026-10-13'),
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-0000-4000-8000-000000000002', 'us-d-2026-10-24');
insert into public.collection_states (user_id, kind, external_item_id, status, source, observed_at) values
  ('11111111-1111-4111-8111-111111111111', 'mount', '6', 'collected', 'blizzard_api', now()),
  ('11111111-1111-4111-8111-111111111111', 'mount', '7', 'collected', 'manual', now()),
  ('11111111-1111-4111-8111-111111111111', 'mount', '8', 'not_collected', 'manual', now()),
  ('11111111-1111-4111-8111-111111111111', 'pet', '39', 'collected', 'blizzard_api', now()),
  ('22222222-2222-4222-8222-222222222222', 'mount', '6', 'collected', 'manual', now());

create function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

select pg_temp.login_as('11111111-1111-4111-8111-111111111111');
select is((public.my_progress() ->> 'steps_done')::int, 2, 'A soma só os próprios passos concluídos');
select is((public.my_progress() ->> 'goals_done')::int, 1, 'A soma só os próprios objetivos concluídos');
select is((public.my_progress() ->> 'weekly_done')::int, 2, 'semanais feitas de A');
select is((public.my_progress() ->> 'daily_done')::int, 1, 'diárias feitas de A');
select is(public.my_progress() -> 'weekly_cycles', '["2026-10-20", "2026-10-13"]'::jsonb, 'semanas com semanal, da mais recente');
select is((public.my_progress() ->> 'mounts')::int, 2, 'montarias coletadas (Battle.net e marcação), sem as que faltam');
select is((public.my_progress() ->> 'manual_marks')::int, 1, 'marcações "já tenho" de A');
select is((public.my_progress() ->> 'battlenet')::boolean, false, 'A ainda não conectou a Battle.net');
reset role;

set local role anon;
select throws_ok($$ select public.my_progress() $$, '42501', null, 'visitante não chama o progresso');
reset role;

select * from finish();
rollback;
