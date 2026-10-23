-- Fase 4: tarefas recorrentes e conclusões por ciclo, isoladas por conta.
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

-- Começa do zero (tudo volta no rollback do fim): o teste não depende do que
-- já existe no banco local, como contas e catálogo criados pelos testes E2E.
delete from auth.users;
delete from public.collectibles;

insert into auth.users (id, email, aud, role) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local', 'authenticated', 'authenticated');

create function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

select pg_temp.login_as('11111111-1111-4111-8111-111111111111');
select lives_ok(
  $$ insert into public.recurring_tasks (title, cadence, estimated_minutes) values ('Abrir o cofre', 'weekly', 5) $$,
  'A cria tarefa recorrente'
);
select lives_ok(
  $$ insert into public.task_completions (task_id, cycle_key)
     select id, 'us-w-2026-10-20' from public.recurring_tasks $$,
  'A conclui a tarefa no ciclo'
);
select throws_ok(
  $$ insert into public.task_completions (task_id, cycle_key)
     select id, 'us-w-2026-10-20' from public.recurring_tasks $$,
  '23505', null, 'mesma tarefa não conclui duas vezes no mesmo ciclo'
);
select throws_ok(
  $$ insert into public.task_completions (task_id, cycle_key)
     select id, 'qualquer-coisa' from public.recurring_tasks $$,
  '23514', null, 'ciclo fora do formato é recusado'
);
reset role;

create temp table a_task as select id from public.recurring_tasks;
grant select on a_task to authenticated;

select pg_temp.login_as('22222222-2222-4222-8222-222222222222');
select is((select count(*) from public.recurring_tasks), 0::bigint, 'B não vê tarefas de A');
select is((select count(*) from public.task_completions), 0::bigint, 'B não vê conclusões de A');
select throws_ok(
  format($$ insert into public.task_completions (task_id, cycle_key) values (%L, 'us-w-2026-10-27') $$, (select id from a_task)),
  '23503', null, 'B não conclui tarefa de A mesmo sabendo o id'
);
reset role;

set local role anon;
select throws_ok($$ select count(*) from public.recurring_tasks $$, '42501', null, 'anon não lê tarefas');
reset role;

select * from finish();
rollback;
