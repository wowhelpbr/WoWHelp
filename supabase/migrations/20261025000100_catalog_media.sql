-- WoWHelp | Montarias com imagem oficial.
--
-- A imagem vem do documento de mídia da Blizzard (creature-display, asset
-- "zoom"). Seguindo a recomendação da Blizzard, guardamos uma cópia própria no
-- Storage (bucket público catalog-media), convertida para WebP. Como todo dado
-- da API, a cópia é renovada antes de 30 dias e deixa de aparecer depois disso.

alter table public.collectibles
  add column media_path text check (media_path ~ '^[a-z]+/[0-9]{1,20}\.webp$'),
  add column media_fetched_at timestamptz,
  -- 'missing' = a Blizzard não tem imagem para este modelo (não tenta de novo antes da renovação).
  add column media_status text check (media_status in ('ok', 'missing'));

create index collectibles_media_refresh_idx on public.collectibles (kind, media_fetched_at nulls first);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-media', 'catalog-media', true, 1048576, array['image/webp'])
on conflict (id) do nothing;

-- Imagem com mais de 30 dias some da tela (o arquivo é apagado pela tarefa de mídia).
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
  update public.collectibles
    set media_path = null, media_status = null
    where media_fetched_at < now() - interval '30 days' and media_path is not null;
end;
$$;
