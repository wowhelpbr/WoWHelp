-- WoWHelp exploratory schema v0.1, reviewed migration required before execution.
-- Do not apply to any existing or production Supabase project without approval.
-- Supabase Auth users are the authority for user_id. Server-owned sync writes must
-- verify the authenticated user before using privileged credentials.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'en-US' check (locale in ('en-US', 'pt-BR')),
  preferred_game_region text check (preferred_game_region in ('us','eu','kr','tw','cn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider = 'battlenet'),
  region text not null check (region in ('us','eu','kr','tw','cn')),
  external_account_ref text not null,
  granted_scopes text[] not null default '{}'::text[],
  status text not null default 'connected' check (status in ('connected','needs_reauth','disconnected')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, provider, region, external_account_ref)
);
-- IMPORTANT: no raw OAuth tokens in exposed tables. Store encrypted credentials
-- in a restricted server-only system (e.g. vetted Vault approach), not here.

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.game_connections(id) on delete set null,
  region text not null check (region in ('us','eu','kr','tw','cn')),
  realm_slug text not null,
  external_character_id text,
  display_name text not null,
  class_id integer,
  level integer check (level >= 1),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index if not exists characters_official_identity
  on public.characters(user_id, region, realm_slug, external_character_id)
  where external_character_id is not null;

create table if not exists public.collectibles (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('mount','pet','toy','transmog','housing')),
  external_item_id text not null,
  expansion text,
  source_url text,
  review_status text not null default 'draft'
    check (review_status in ('draft','needs_review','approved','retired')),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (kind, external_item_id)
);

create table if not exists public.collectible_translations (
  id uuid primary key default gen_random_uuid(),
  collectible_id uuid not null references public.collectibles(id) on delete cascade,
  locale text not null check (locale in ('en-US','pt-BR')),
  name text not null,
  summary text,
  requirements text,
  instructions text,
  unique (collectible_id, locale)
);

create table if not exists public.collection_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid,
  collectible_id uuid not null references public.collectibles(id) on delete cascade,
  status text not null check (status in ('collected','not_collected','unknown')),
  source text not null check (source in ('blizzard_api','addon_import','manual')),
  observed_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  foreign key (character_id, user_id) references public.characters(id, user_id) on delete cascade
);
create unique index if not exists collection_account_state_unique
  on public.collection_states (user_id, collectible_id)
  where character_id is null;
create unique index if not exists collection_character_state_unique
  on public.collection_states (user_id, character_id, collectible_id)
  where character_id is not null;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collectible_id uuid references public.collectibles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  status text not null default 'active'
    check (status in ('active','paused','completed')),
  priority integer not null default 3 check (priority between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,user_id)
);

create table if not exists public.goal_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null,
  label text not null check (char_length(label) between 1 and 240),
  sort_order integer not null default 0,
  completed_at timestamptz,
  foreign key (goal_id, user_id) references public.goals(id,user_id) on delete cascade
);

create table if not exists public.activity_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_pt text,
  scope text not null default 'character' check (scope in ('account','character')),
  cycle text not null default 'evergreen' check (cycle in ('evergreen','daily','weekly','event')),
  estimated_minutes integer check (estimated_minutes between 1 and 1440),
  game_region text check (game_region in ('us','eu','kr','tw','cn')),
  source_url text,
  review_status text not null default 'draft'
    check (review_status in ('draft','needs_review','approved','retired')),
  last_reviewed_at timestamptz
);

create table if not exists public.activity_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid,
  activity_id uuid not null references public.activity_templates(id) on delete cascade,
  cycle_key text not null,
  completed_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual','addon_import','blizzard_api')),
  foreign key (character_id, user_id) references public.characters(id, user_id) on delete cascade
);
create unique index if not exists activity_progress_dedup
  on public.activity_progress(user_id, activity_id, cycle_key, character_id) nulls not distinct;

create table if not exists public.addon_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schema_version integer not null check (schema_version > 0),
  addon_version text not null,
  observed_at timestamptz,
  imported_at timestamptz not null default now(),
  record_count integer not null default 0 check (record_count >= 0),
  payload_sha256 text,
  status text not null check (status in ('accepted','partially_accepted','rejected'))
);

create index if not exists idx_characters_user on public.characters(user_id);
create index if not exists idx_collection_user on public.collection_states(user_id, collectible_id);
create index if not exists idx_goals_user on public.goals(user_id, status);
create index if not exists idx_steps_goal on public.goal_steps(goal_id, sort_order);
create index if not exists idx_progress_user on public.activity_progress(user_id, cycle_key);
create index if not exists idx_imports_user on public.addon_imports(user_id, imported_at desc);

alter table public.profiles enable row level security;
alter table public.game_connections enable row level security;
alter table public.characters enable row level security;
alter table public.collectibles enable row level security;
alter table public.collectible_translations enable row level security;
alter table public.collection_states enable row level security;
alter table public.goals enable row level security;
alter table public.goal_steps enable row level security;
alter table public.activity_templates enable row level security;
alter table public.activity_progress enable row level security;
alter table public.addon_imports enable row level security;

-- Data API privileges are independent of RLS. Grant only required capabilities.
revoke all on public.profiles, public.game_connections, public.characters,
  public.collectibles, public.collectible_translations, public.collection_states,
  public.goals, public.goal_steps, public.activity_templates,
  public.activity_progress, public.addon_imports from anon, authenticated;

grant select on public.collectibles, public.collectible_translations,
  public.activity_templates to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.goals,
  public.goal_steps to authenticated;
grant select on public.game_connections, public.characters,
  public.collection_states, public.activity_progress, public.addon_imports
  to authenticated;
-- Manual activity progress should be mutated through validated server routes,
-- not direct browser writes. The backend verifies owner and scope.

create policy profiles_read_self on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy profiles_delete_self on public.profiles for delete to authenticated
  using (id = (select auth.uid()));

create policy game_connections_read_self on public.game_connections for select to authenticated
  using (user_id = (select auth.uid()));
create policy characters_read_self on public.characters for select to authenticated
  using (user_id = (select auth.uid()));
create policy collection_states_read_self on public.collection_states for select to authenticated
  using (user_id = (select auth.uid()));

create policy collectibles_read_published on public.collectibles for select to anon, authenticated
  using (review_status = 'approved');
create policy collectibles_translations_read_published on public.collectible_translations for select to anon, authenticated
  using (exists (select 1 from public.collectibles c
    where c.id = collectible_id and c.review_status = 'approved'));
create policy activity_templates_read_published on public.activity_templates for select to anon, authenticated
  using (review_status = 'approved');

create policy goals_read_self on public.goals for select to authenticated
  using (user_id = (select auth.uid()));
create policy goals_insert_self on public.goals for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy goals_update_self on public.goals for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy goals_delete_self on public.goals for delete to authenticated
  using (user_id = (select auth.uid()));

create policy goal_steps_read_self on public.goal_steps for select to authenticated
  using (user_id = (select auth.uid()));
create policy goal_steps_insert_self on public.goal_steps for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy goal_steps_update_self on public.goal_steps for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy goal_steps_delete_self on public.goal_steps for delete to authenticated
  using (user_id = (select auth.uid()));

create policy activity_progress_read_self on public.activity_progress for select to authenticated
  using (user_id = (select auth.uid()));
create policy addon_imports_read_self on public.addon_imports for select to authenticated
  using (user_id = (select auth.uid()));

-- Sensitive sync/auth and editorial writes are restricted to trusted services.
-- IMPORTANT: using a privileged key bypasses RLS; backend must authenticate,
-- authorize, limit and validate every request. A separate role or RPC surface
-- may be preferable after security review. Explicitly test in staging.
