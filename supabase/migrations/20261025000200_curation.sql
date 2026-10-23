-- WoWHelp | Curadoria editorial feita à mão pelo Bruno.
--
-- app_admins: quem pode curar (inserido à mão no banco, nunca pelo site).
-- collectible_guides: o que a API da Blizzard não tem (chance de drop, local,
-- passo a passo). Só aparece no site quando aprovado, e chance de drop só com
-- fonte. A chave é (kind, external_item_id), sem ligação com a linha do
-- catálogo, para a curadoria não sumir quando o catálogo da API é renovado.

create table public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;

create table public.collectible_guides (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('mount', 'pet', 'toy', 'transmog', 'housing')),
  external_item_id text not null check (external_item_id ~ '^[0-9]{1,20}$'),
  drop_chance_percent numeric(7, 4) check (drop_chance_percent > 0 and drop_chance_percent <= 100),
  chance_note_en text check (char_length(chance_note_en) <= 200),
  chance_note_pt text check (char_length(chance_note_pt) <= 200),
  location_en text check (char_length(location_en) <= 300),
  location_pt text check (char_length(location_pt) <= 300),
  how_en text check (char_length(how_en) <= 2000),
  how_pt text check (char_length(how_pt) <= 2000),
  -- Chefe do Diário de Aventura que solta o item (para contar tentativas pela Battle.net).
  journal_encounter_id integer check (journal_encounter_id > 0),
  source_url text check (source_url ~ '^https://[^[:space:]]+$' and char_length(source_url) <= 500),
  source_label text check (char_length(source_label) <= 120),
  status text not null default 'draft' check (status in ('draft', 'approved')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, external_item_id),
  constraint guides_approved_has_review check (status = 'draft' or reviewed_at is not null),
  constraint guides_chance_has_source check (drop_chance_percent is null or source_url is not null)
);

create trigger collectible_guides_set_updated_at
  before update on public.collectible_guides
  for each row execute function private.set_updated_at();

alter table public.collectible_guides enable row level security;
revoke all on public.collectible_guides from anon, authenticated;
grant select on public.collectible_guides to anon, authenticated;

create policy collectible_guides_select_approved on public.collectible_guides
  for select to anon, authenticated
  using (status = 'approved');
