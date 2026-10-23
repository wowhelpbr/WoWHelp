-- WoWHelp | Comunidade BR: criadores de conteúdo de WoW do Brasil, curados à mão.
--
-- creators e creator_channels: só o curador cria e edita (pelo servidor); o
-- público vê só quem foi publicado. O status ao vivo e o último vídeo vêm das
-- APIs oficiais da Twitch e do YouTube, gravados pela tarefa agendada.
-- creator_requests: pedidos de "quero ser listado" ou "quero sair", feitos por
-- quem está logado; cada conta vê só os próprios pedidos.

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  bio_pt text check (char_length(bio_pt) <= 400),
  bio_en text check (char_length(bio_en) <= 400),
  tags text[] not null default '{}'::text[]
    check (
      tags <@ array['raide', 'mitica', 'pvp', 'lore', 'iniciantes', 'casual', 'colecionador', 'moradia', 'guias', 'humor']::text[]
      and cardinality(tags) <= 6
    ),
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  featured boolean not null default false,
  featured_note_pt text check (char_length(featured_note_pt) <= 200),
  featured_note_en text check (char_length(featured_note_en) <= 200),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger creators_set_updated_at
  before update on public.creators
  for each row execute function private.set_updated_at();

create table public.creator_channels (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  platform text not null check (platform in ('twitch', 'youtube', 'kick')),
  handle text not null check (handle ~ '^@?[A-Za-z0-9_.-]{2,60}$'),
  url text not null check (url ~ '^https://[^[:space:]]+$' and char_length(url) <= 300),
  -- Twitch: id do usuário; YouTube: id do canal (UC...). Preenchido pela tarefa agendada.
  external_id text check (char_length(external_id) <= 64),
  avatar_url text check (avatar_url ~ '^https://[^[:space:]]+$' and char_length(avatar_url) <= 500),
  is_live boolean not null default false,
  live_title text check (char_length(live_title) <= 200),
  live_game text check (char_length(live_game) <= 100),
  live_viewers integer check (live_viewers >= 0),
  live_started_at timestamptz,
  live_url text check (live_url ~ '^https://[^[:space:]]+$' and char_length(live_url) <= 300),
  live_thumbnail_url text check (live_thumbnail_url ~ '^https://[^[:space:]]+$' and char_length(live_thumbnail_url) <= 500),
  latest_title text check (char_length(latest_title) <= 200),
  latest_url text check (latest_url ~ '^https://[^[:space:]]+$' and char_length(latest_url) <= 300),
  latest_thumbnail_url text check (latest_thumbnail_url ~ '^https://[^[:space:]]+$' and char_length(latest_thumbnail_url) <= 500),
  latest_published_at timestamptz,
  checked_at timestamptz
);

create unique index creator_channels_platform_handle on public.creator_channels (platform, lower(handle));
create index creator_channels_creator_idx on public.creator_channels (creator_id);

alter table public.creators enable row level security;
alter table public.creator_channels enable row level security;
revoke all on public.creators, public.creator_channels from anon, authenticated;
grant select on public.creators, public.creator_channels to anon, authenticated;

create policy creators_select_published on public.creators
  for select to anon, authenticated using (status = 'published');
create policy creator_channels_select_published on public.creator_channels
  for select to anon, authenticated
  using (exists (select 1 from public.creators c where c.id = creator_id and c.status = 'published'));

create table public.creator_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null default 'join' check (kind in ('join', 'leave')),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  links text not null check (char_length(links) between 8 and 600),
  message text check (char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index creator_requests_status_idx on public.creator_requests (status, created_at);

alter table public.creator_requests enable row level security;
revoke all on public.creator_requests from anon, authenticated;
grant select on public.creator_requests to authenticated;
grant insert (kind, display_name, links, message) on public.creator_requests to authenticated;

create policy creator_requests_select_own on public.creator_requests
  for select to authenticated using (user_id = (select auth.uid()));
create policy creator_requests_insert_own on public.creator_requests
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending');

-- No máximo 3 pedidos em aberto por conta (contra spam).
create or replace function private.enforce_creator_request_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.creator_requests where user_id = new.user_id and status = 'pending') >= 3 then
    raise exception 'creator_request_quota_exceeded' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger creator_requests_enforce_quota
  before insert on public.creator_requests
  for each row execute function private.enforce_creator_request_quota();
