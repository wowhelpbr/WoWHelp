-- WoWHelp | Fase 5: importação do arquivo do addon WoWHelp Companion.
--
-- O arquivo é lido no servidor sem executar Lua (packages/shared/src/addon) e
-- só os campos permitidos são gravados, pelo servidor, depois de validar a
-- sessão. O mesmo arquivo (mesmo hash) não é importado duas vezes.

create table public.addon_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  schema_version integer not null check (schema_version between 1 and 100),
  addon_version text not null check (addon_version ~ '^\d{1,3}\.\d{1,3}\.\d{1,3}$'),
  observed_at timestamptz,
  imported_at timestamptz not null default now(),
  region text check (region in ('us', 'eu', 'kr', 'tw')),
  characters_count integer not null default 0 check (characters_count between 0 and 60),
  -- null = o addon não conseguiu ler a coleção (desconhecido).
  mounts_count integer check (mounts_count between 0 and 6000),
  mounts_observed_at timestamptz,
  categories text[] not null default '{}'::text[] check (categories <@ array['characters', 'mounts']::text[]),
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  unique (user_id, payload_sha256)
);

create index addon_imports_user_idx on public.addon_imports (user_id, imported_at desc);

alter table public.addon_imports enable row level security;
revoke all on public.addon_imports from anon, authenticated;
grant select, delete on public.addon_imports to authenticated;

create policy addon_imports_select_own on public.addon_imports
  for select to authenticated using (user_id = (select auth.uid()));
create policy addon_imports_delete_own on public.addon_imports
  for delete to authenticated using (user_id = (select auth.uid()));
