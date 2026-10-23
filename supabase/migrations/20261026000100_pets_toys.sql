-- WoWHelp | Mascotes e brinquedos no catálogo oficial (Game Data API).
--
-- Mesma regra das montarias: dado da Blizzard, renovado antes de 30 dias,
-- coleção do jogador só "não obtida" com lista completa recente.

alter table public.collectibles
  -- Tipo do item (mascote: BEAST, CRITTER...).
  add column category text check (category ~ '^[A-Z_]{1,32}$'),
  -- Brinquedo: id do documento de mídia do item (ícone oficial).
  add column media_ref integer check (media_ref > 0);

alter table public.collectible_translations
  add column category_name text check (char_length(category_name) <= 60);

-- Última leitura completa de cada coleção da conta Battle.net.
alter table public.game_connections
  add column pets_synced_at timestamptz,
  add column toys_synced_at timestamptz;

-- Objetivo criado a partir de mascote ou brinquedo.
alter table public.goals drop constraint goals_kind_check;
alter table public.goals add constraint goals_kind_check check (kind in ('custom', 'mount', 'pet', 'toy'));

create index collectibles_kind_category_idx on public.collectibles (kind, category);
