-- WoWHelp | Fase 1: catálogo editorial de colecionáveis (estrutura).
-- Só itens com review_status = 'approved' ficam visíveis ao público.
-- Escritas editoriais acontecem por migration/seed revisado ou service role,
-- nunca pelo navegador. O conteúdo (30 montarias) entra na Fase 3, depois da
-- validação de fontes; esta migration não insere nenhum dado.

create table public.collectibles (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('mount', 'pet', 'toy', 'transmog', 'housing')),
  -- ID oficial da Blizzard (Game Data API), guardado como texto para não
  -- presumir o formato de cada tipo de coleção.
  external_item_id text not null,
  expansion text,
  source_url text check (source_url ~ '^https://'),
  review_status text not null default 'draft'
    check (review_status in ('draft', 'needs_review', 'approved', 'retired')),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, external_item_id)
);

create trigger collectibles_set_updated_at
  before update on public.collectibles
  for each row execute function private.set_updated_at();

create table public.collectible_translations (
  id uuid primary key default gen_random_uuid(),
  collectible_id uuid not null references public.collectibles (id) on delete cascade,
  locale text not null check (locale in ('en-US', 'pt-BR')),
  name text not null check (char_length(name) between 1 and 160),
  summary text,
  requirements text,
  instructions text,
  reviewed_at timestamptz,
  unique (collectible_id, locale)
);

create index collectibles_kind_status_idx on public.collectibles (kind, review_status);

alter table public.goals
  add constraint goals_collectible_fk
  foreign key (collectible_id) references public.collectibles (id) on delete set null;

alter table public.collectibles enable row level security;
alter table public.collectible_translations enable row level security;

revoke all on public.collectibles, public.collectible_translations from anon, authenticated;
grant select on public.collectibles, public.collectible_translations to anon, authenticated;

create policy collectibles_select_approved on public.collectibles
  for select to anon, authenticated
  using (review_status = 'approved');

create policy collectible_translations_select_approved on public.collectible_translations
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.collectibles c
      where c.id = collectible_id and c.review_status = 'approved'
    )
  );
