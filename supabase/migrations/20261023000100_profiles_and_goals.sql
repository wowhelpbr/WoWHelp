-- WoWHelp | Fase 1: perfis, objetivos e etapas.
-- Adaptado e revisado de planning/technical/001_schema_initial.sql.
-- Mudanças em relação ao rascunho: perfil criado por trigger, focus_areas do
-- onboarding, grants por coluna (o cliente nunca escolhe user_id nem id),
-- limites de quantidade por usuário e funções auxiliares em schema privado.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: uma linha por usuário do Supabase Auth.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'en-US' check (locale in ('en-US', 'pt-BR')),
  preferred_game_region text check (preferred_game_region in ('us', 'eu', 'kr', 'tw', 'cn')),
  focus_areas text[] not null default '{}'::text[]
    check (
      focus_areas <@ array['gear', 'mounts', 'achievements', 'weekly', 'alts', 'class', 'sessions', 'housing']::text[]
      and cardinality(focus_areas) <= 8
    ),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Cria o perfil quando o usuário se cadastra. locale e focus_areas vêm do
-- metadata do cadastro (controlado pelo cliente), então são filtrados aqui:
-- locale inválido vira en-US; áreas fora da lista são descartadas.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  areas text[] := '{}'::text[];
begin
  if jsonb_typeof(meta -> 'focus_areas') = 'array' then
    select coalesce(array_agg(distinct v order by v), '{}'::text[])
      into areas
      from jsonb_array_elements_text(meta -> 'focus_areas') as v
      where v in ('gear', 'mounts', 'achievements', 'weekly', 'alts', 'class', 'sessions', 'housing');
  end if;

  insert into public.profiles (id, locale, focus_areas, onboarded_at)
  values (
    new.id,
    case when meta ->> 'locale' in ('en-US', 'pt-BR') then meta ->> 'locale' else 'en-US' end,
    areas,
    case when cardinality(areas) > 0 then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- goals: objetivos pessoais (manuais na Fase 1; ligados a montarias na Fase 3).
-- ---------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null default 'custom' check (kind in ('custom', 'mount')),
  collectible_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  notes text check (char_length(notes) <= 2000),
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  priority smallint not null default 3 check (priority between 1 and 5),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index goals_user_status_idx on public.goals (user_id, status);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- goal_steps: checklist de cada objetivo. A FK composta (goal_id, user_id)
-- impede pendurar uma etapa no objetivo de outra conta.
-- ---------------------------------------------------------------------------
create table public.goal_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null,
  label text not null check (char_length(btrim(label)) between 1 and 240),
  sort_order integer not null default 0 check (sort_order >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade
);

create index goal_steps_goal_idx on public.goal_steps (goal_id, sort_order);
create index goal_steps_user_idx on public.goal_steps (user_id);

-- ---------------------------------------------------------------------------
-- Limites por conta (evita crescimento descontrolado por abuso ou bug).
-- ---------------------------------------------------------------------------
create or replace function private.enforce_goal_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.goals where user_id = new.user_id) >= 200 then
    raise exception 'goal_quota_exceeded' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger goals_enforce_quota
  before insert on public.goals
  for each row execute function private.enforce_goal_quota();

create or replace function private.enforce_step_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.goal_steps where goal_id = new.goal_id) >= 50 then
    raise exception 'step_quota_exceeded' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger goal_steps_enforce_quota
  before insert on public.goal_steps
  for each row execute function private.enforce_step_quota();

-- ---------------------------------------------------------------------------
-- RLS e privilégios. Privilégios da Data API são independentes da RLS:
-- revogamos tudo e concedemos só o necessário, por coluna quando faz sentido.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.goal_steps enable row level security;

revoke all on public.profiles, public.goals, public.goal_steps from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (locale, preferred_game_region, focus_areas, onboarded_at) on public.profiles to authenticated;

grant select, delete on public.goals to authenticated;
grant insert (kind, collectible_id, title, notes, status, priority) on public.goals to authenticated;
grant update (kind, collectible_id, title, notes, status, priority, completed_at) on public.goals to authenticated;

grant select, delete on public.goal_steps to authenticated;
grant insert (goal_id, label, sort_order) on public.goal_steps to authenticated;
grant update (label, sort_order, completed_at) on public.goal_steps to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy goals_select_own on public.goals
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy goals_insert_own on public.goals
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy goals_update_own on public.goals
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy goals_delete_own on public.goals
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy goal_steps_select_own on public.goal_steps
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy goal_steps_insert_own on public.goal_steps
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy goal_steps_update_own on public.goal_steps
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy goal_steps_delete_own on public.goal_steps
  for delete to authenticated
  using (user_id = (select auth.uid()));
