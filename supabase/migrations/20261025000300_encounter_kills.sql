-- WoWHelp | Tentativas: quantas vezes cada personagem matou cada chefe.
--
-- Vem da Profile API da Blizzard (encounters/raids e encounters/dungeons),
-- buscada pelo servidor depois da conexão com a Battle.net. Como todo dado da
-- API, some em 30 dias sem renovação; e some junto com o personagem.

create table public.encounter_kills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id uuid not null,
  journal_encounter_id integer not null check (journal_encounter_id > 0),
  difficulty text not null check (difficulty ~ '^[A-Z0-9_]{2,40}$'),
  completed_count integer not null check (completed_count between 0 and 1000000),
  last_kill_at timestamptz,
  fetched_at timestamptz not null default now(),
  unique (character_id, journal_encounter_id, difficulty),
  foreign key (character_id, user_id) references public.characters (id, user_id) on delete cascade
);

create index encounter_kills_lookup_idx on public.encounter_kills (user_id, journal_encounter_id);

alter table public.encounter_kills enable row level security;
revoke all on public.encounter_kills from anon, authenticated;
grant select on public.encounter_kills to authenticated;

create policy encounter_kills_select_own on public.encounter_kills
  for select to authenticated using (user_id = (select auth.uid()));

-- Dificuldade em que o item cai (vazio = qualquer uma).
alter table public.collectible_guides
  add column encounter_difficulty text check (encounter_difficulty ~ '^[A-Z0-9_]{2,40}$');

create or replace function private.purge_expired_api_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.collection_states
    where source = 'blizzard_api' and fetched_at < now() - interval '30 days';
  delete from public.encounter_kills
    where fetched_at < now() - interval '30 days';
  delete from public.characters
    where source = 'blizzard_api' and fetched_at < now() - interval '30 days';
  delete from public.game_connections
    where coalesce(characters_synced_at, created_at) < now() - interval '30 days';
  delete from public.collectibles
    where source = 'blizzard_api' and fetched_at < now() - interval '30 days';
  update public.collectibles
    set media_path = null, media_status = null
    where media_fetched_at < now() - interval '30 days' and media_path is not null;
end;
$$;
