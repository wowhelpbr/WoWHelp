-- WoWHelp | Fase 2: vínculo Battle.net, personagens e coleção.
--
-- Regras que moldam este esquema:
-- * Termos da API da Blizzard (01/10/2019): nenhum dado obtido pela API pode
--   ficar guardado mais de 30 dias ("maximum 30-day TTL") e tudo do usuário
--   precisa ser apagado quando ele desvincula a conta.
-- * Não guardamos token da Battle.net: a sincronização acontece logo depois da
--   autorização e o token é descartado. Sincronizar de novo = autorizar de novo.
-- * Dados vindos da Blizzard só são gravados pelo servidor (service role), depois
--   de validar a sessão do usuário. O navegador só lê e apaga os próprios dados.
-- * Status de coleção é tri-state; ausência de registro nunca vira "não obtido"
--   por si só (ver packages/shared/src/domain/collection.ts).

-- ---------------------------------------------------------------------------
-- game_connections: uma conta Battle.net vinculada por região.
-- ---------------------------------------------------------------------------
create table public.game_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'battlenet' check (provider = 'battlenet'),
  region text not null check (region in ('us', 'eu', 'kr', 'tw')),
  -- Identificador da conta Battle.net devolvido pelo /userinfo.
  external_account_ref text not null check (char_length(external_account_ref) between 1 and 64),
  battletag text check (char_length(battletag) <= 64),
  granted_scopes text[] not null default '{}'::text[],
  status text not null default 'connected' check (status in ('connected', 'sync_failed')),
  last_sync_error text check (char_length(last_sync_error) <= 64),
  -- Momento da última sincronização bem-sucedida de personagens e de montarias.
  characters_synced_at timestamptz,
  mounts_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, region),
  unique (id, user_id)
);

create trigger game_connections_set_updated_at
  before update on public.game_connections
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- characters: personagens vindos da Battle.net (Fase 2) ou do addon (Fase 5).
-- ---------------------------------------------------------------------------
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connection_id uuid,
  source text not null check (source in ('blizzard_api', 'addon_import')),
  region text not null check (region in ('us', 'eu', 'kr', 'tw')),
  realm_slug text not null check (char_length(realm_slug) between 1 and 64),
  realm_name text check (char_length(realm_name) <= 64),
  -- ID oficial do personagem quando a fonte informa (nome pode mudar).
  external_character_id text check (char_length(external_character_id) <= 32),
  name text not null check (char_length(name) between 1 and 48),
  level integer check (level between 1 and 200),
  class_id integer,
  class_name text check (char_length(class_name) <= 48),
  race_id integer,
  race_name text check (char_length(race_name) <= 48),
  faction text check (faction in ('ALLIANCE', 'HORDE', 'NEUTRAL')),
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (connection_id, user_id) references public.game_connections (id, user_id) on delete cascade
);

create unique index characters_official_identity
  on public.characters (user_id, source, region, external_character_id)
  where external_character_id is not null;
create unique index characters_name_identity
  on public.characters (user_id, source, region, realm_slug, lower(name))
  where external_character_id is null;
create index characters_user_idx on public.characters (user_id, region, realm_slug);

-- ---------------------------------------------------------------------------
-- collection_states: o que cada fonte observou sobre um colecionável.
-- Uma linha por (usuário, tipo, item, fonte) no nível da conta.
-- ---------------------------------------------------------------------------
create table public.collection_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('mount', 'pet', 'toy', 'transmog', 'housing')),
  -- ID oficial da Blizzard (ex.: mountID). Não é FK: o catálogo pode ainda não ter o item.
  external_item_id text not null check (char_length(external_item_id) between 1 and 32),
  status text not null check (status in ('collected', 'not_collected', 'unknown')),
  source text not null check (source in ('blizzard_api', 'addon_import', 'manual')),
  observed_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  unique (user_id, kind, external_item_id, source)
);

create index collection_states_user_idx on public.collection_states (user_id, kind);

-- ---------------------------------------------------------------------------
-- Privilégios e RLS. Leitura e exclusão dos próprios dados pelo navegador;
-- marcação manual de coleção (source = 'manual') também pelo navegador;
-- todo o resto só pelo servidor com service role.
-- ---------------------------------------------------------------------------
alter table public.game_connections enable row level security;
alter table public.characters enable row level security;
alter table public.collection_states enable row level security;

revoke all on public.game_connections, public.characters, public.collection_states from anon, authenticated;

grant select, delete on public.game_connections to authenticated;
grant select, delete on public.characters to authenticated;
grant select, delete on public.collection_states to authenticated;
grant insert (kind, external_item_id, status, source, observed_at) on public.collection_states to authenticated;
grant update (status, observed_at) on public.collection_states to authenticated;

create policy game_connections_select_own on public.game_connections
  for select to authenticated using (user_id = (select auth.uid()));
create policy game_connections_delete_own on public.game_connections
  for delete to authenticated using (user_id = (select auth.uid()));

create policy characters_select_own on public.characters
  for select to authenticated using (user_id = (select auth.uid()));
create policy characters_delete_own on public.characters
  for delete to authenticated using (user_id = (select auth.uid()));

create policy collection_states_select_own on public.collection_states
  for select to authenticated using (user_id = (select auth.uid()));
create policy collection_states_delete_own on public.collection_states
  for delete to authenticated using (user_id = (select auth.uid()));
-- O navegador só cria/edita marcações manuais, nunca algo "vindo da Blizzard".
create policy collection_states_insert_manual on public.collection_states
  for insert to authenticated
  with check (user_id = (select auth.uid()) and source = 'manual');
create policy collection_states_update_manual on public.collection_states
  for update to authenticated
  using (user_id = (select auth.uid()) and source = 'manual')
  with check (user_id = (select auth.uid()) and source = 'manual');

-- user_id das marcações manuais vem da sessão.
alter table public.collection_states alter column user_id set default auth.uid();

-- ---------------------------------------------------------------------------
-- Limpeza de 30 dias (Termos da API). Roda todo dia pelo pg_cron.
-- ---------------------------------------------------------------------------
create or replace function private.purge_expired_api_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.collection_states
    where source = 'blizzard_api' and fetched_at < now() - interval '30 days';
  delete from public.characters
    where source = 'blizzard_api' and fetched_at < now() - interval '30 days';
  -- A própria conexão (id da conta e BattleTag) também veio da API.
  delete from public.game_connections
    where coalesce(characters_synced_at, created_at) < now() - interval '30 days';
end;
$$;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'wowhelp-purge-expired-api-data',
  '17 4 * * *',
  $$select private.purge_expired_api_data()$$
);
