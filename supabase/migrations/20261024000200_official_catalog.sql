-- WoWHelp | Fase 3: catálogo oficial de montarias (Game Data API da Blizzard).
--
-- O catálogo vem da API oficial (fonte 'blizzard_api'), é público para leitura,
-- creditado à Blizzard e renovado por uma tarefa agendada. Como todo dado da
-- API, some se não for renovado em 30 dias. Conteúdo editorial próprio (passos,
-- dicas) continua com fonte 'editorial' e revisão manual.

alter table public.collectibles
  add column source text not null default 'editorial' check (source in ('editorial', 'blizzard_api')),
  add column fetched_at timestamptz,
  add column source_type text check (source_type ~ '^[A-Z_]{1,32}$'),
  add column faction text check (faction in ('ALLIANCE', 'HORDE')),
  add column hidden_until_collected boolean not null default false,
  add column creature_display_id integer;

alter table public.collectible_translations
  add column source_name text check (char_length(source_name) <= 120);

create index collectibles_source_type_idx on public.collectibles (kind, source_type);
create index collectible_translations_name_idx on public.collectible_translations (locale, lower(name));

-- A limpeza diária passa a incluir o catálogo vindo da API.
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
  delete from public.game_connections
    where coalesce(characters_synced_at, created_at) < now() - interval '30 days';
  delete from public.collectibles
    where source = 'blizzard_api' and fetched_at < now() - interval '30 days';
end;
$$;

-- A marcação manual usa upsert (insert ... on conflict do update), que exige
-- privilégio de UPDATE em todas as colunas enviadas. A política de RLS continua
-- restringindo a linhas próprias com source = 'manual'.
grant update (kind, external_item_id, source) on public.collection_states to authenticated;
