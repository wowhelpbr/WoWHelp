-- WoWHelp | Assinatura "WoWHelp Apoiador" (Stripe).
--
-- Só o servidor grava, a partir dos avisos (webhooks) do Stripe; cada conta
-- lê só a própria assinatura. Nenhum dado de cartão passa pelo WoWHelp: o
-- pagamento é todo na página do Stripe.
--
-- "subscriptions_open" é a chave da administração que abre a venda ao
-- público (fechada por padrão; o administrador consegue testar mesmo fechada).

alter table public.site_settings
  add column subscriptions_open boolean not null default false;

-- Cliente do Stripe de cada conta (um por conta).
create table public.billing_customers (
  id text primary key check (id ~ '^cus_[A-Za-z0-9]+$'),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  livemode boolean not null,
  created_at timestamptz not null default now()
);

-- Estado atual de cada assinatura, copiado do Stripe a cada aviso.
create table public.supporter_subscriptions (
  id text primary key check (id ~ '^sub_[A-Za-z0-9]+$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_id text not null check (customer_id ~ '^cus_[A-Za-z0-9]+$'),
  status text not null check (
    status in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')
  ),
  plan text check (plan in ('monthly', 'yearly')),
  current_period_end timestamptz,
  cancel_at timestamptz,
  livemode boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index supporter_subscriptions_user_idx on public.supporter_subscriptions (user_id);

create trigger supporter_subscriptions_set_updated_at
  before update on public.supporter_subscriptions
  for each row execute function private.set_updated_at();

alter table public.billing_customers enable row level security;
alter table public.supporter_subscriptions enable row level security;
revoke all on public.billing_customers from anon, authenticated;
revoke all on public.supporter_subscriptions from anon, authenticated;
grant select on public.billing_customers to authenticated;
grant select on public.supporter_subscriptions to authenticated;

create policy billing_customers_select_own on public.billing_customers
  for select to authenticated using (user_id = (select auth.uid()));
create policy supporter_subscriptions_select_own on public.supporter_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
