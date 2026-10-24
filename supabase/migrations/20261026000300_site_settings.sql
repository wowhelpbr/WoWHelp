-- WoWHelp | Configurações do site, mudadas pelo Bruno na administração.
--
-- Uma linha só. "private" fecha o site inteiro atrás de uma senha (fase de
-- testes). A senha fica só como hash (PBKDF2-SHA256 com sal); nem o navegador
-- nem quem está logado consegue ler esta tabela: só o servidor.

create table public.site_settings (
  id boolean primary key default true check (id),
  private boolean not null default false,
  password_hash text check (password_hash ~ '^[0-9a-f]{64}$'),
  password_salt text check (password_salt ~ '^[0-9a-f]{32}$'),
  password_iterations integer check (password_iterations between 100000 and 2000000),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_settings_private_needs_password check (not private or password_hash is not null)
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function private.set_updated_at();

alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;

insert into public.site_settings (id) values (true) on conflict do nothing;
