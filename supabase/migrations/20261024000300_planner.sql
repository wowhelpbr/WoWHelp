-- WoWHelp | Fase 4: planejador semanal e de sessão.
--
-- Tarefas recorrentes são do próprio jogador (ele sabe o que faz toda semana);
-- não inventamos lista editorial de atividades do patch atual sem revisão.
-- O ciclo (semana/dia) é calculado no servidor a partir do calendário de reset
-- por região (packages/shared/src/domain/resets.ts) e gravado como texto
-- (cycle_key), para a conclusão "vencer" sozinha no reset seguinte.

create table public.recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  cadence text not null default 'weekly' check (cadence in ('weekly', 'daily')),
  estimated_minutes integer check (estimated_minutes between 1 and 600),
  priority smallint not null default 3 check (priority between 1 and 5),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index recurring_tasks_user_idx on public.recurring_tasks (user_id, active);

create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid not null,
  cycle_key text not null check (cycle_key ~ '^(us|eu|kr|tw)-(w|d)-\d{4}-\d{2}-\d{2}$'),
  completed_at timestamptz not null default now(),
  unique (task_id, cycle_key),
  foreign key (task_id, user_id) references public.recurring_tasks (id, user_id) on delete cascade
);

create index task_completions_user_idx on public.task_completions (user_id, cycle_key);

-- Tempo estimado por passo de objetivo (alimenta o planejador de sessão).
alter table public.goal_steps
  add column estimated_minutes integer check (estimated_minutes between 1 and 600);
grant insert (estimated_minutes) on public.goal_steps to authenticated;
grant update (estimated_minutes) on public.goal_steps to authenticated;

-- Limite por conta.
create or replace function private.enforce_task_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.recurring_tasks where user_id = new.user_id) >= 100 then
    raise exception 'task_quota_exceeded' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger recurring_tasks_enforce_quota
  before insert on public.recurring_tasks
  for each row execute function private.enforce_task_quota();

alter table public.recurring_tasks enable row level security;
alter table public.task_completions enable row level security;

revoke all on public.recurring_tasks, public.task_completions from anon, authenticated;

grant select, delete on public.recurring_tasks to authenticated;
grant insert (title, cadence, estimated_minutes, priority) on public.recurring_tasks to authenticated;
grant update (title, cadence, estimated_minutes, priority, active) on public.recurring_tasks to authenticated;

grant select, delete on public.task_completions to authenticated;
grant insert (task_id, cycle_key) on public.task_completions to authenticated;

create policy recurring_tasks_select_own on public.recurring_tasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy recurring_tasks_insert_own on public.recurring_tasks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy recurring_tasks_update_own on public.recurring_tasks
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy recurring_tasks_delete_own on public.recurring_tasks
  for delete to authenticated using (user_id = (select auth.uid()));

create policy task_completions_select_own on public.task_completions
  for select to authenticated using (user_id = (select auth.uid()));
create policy task_completions_insert_own on public.task_completions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy task_completions_delete_own on public.task_completions
  for delete to authenticated using (user_id = (select auth.uid()));
