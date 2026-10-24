-- Assinatura Apoiador: só o servidor grava; cada conta lê só a própria.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

delete from auth.users;
insert into auth.users (id, email, aud, role) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local', 'authenticated', 'authenticated');

-- Gravação feita pelo servidor (service role não passa por RLS).
insert into public.billing_customers (id, user_id, livemode) values
  ('cus_A1', '11111111-1111-4111-8111-111111111111', false),
  ('cus_B1', '22222222-2222-4222-8222-222222222222', false);
insert into public.supporter_subscriptions (id, user_id, customer_id, status, plan, current_period_end, livemode) values
  ('sub_A1', '11111111-1111-4111-8111-111111111111', 'cus_A1', 'active', 'monthly', now() + interval '30 days', false),
  ('sub_B1', '22222222-2222-4222-8222-222222222222', 'cus_B1', 'active', 'yearly', now() + interval '365 days', false);

select throws_ok(
  $$ insert into public.supporter_subscriptions (id, user_id, customer_id, status, livemode)
     values ('sub_X', '11111111-1111-4111-8111-111111111111', 'cus_A1', 'vip', false) $$,
  '23514', null, 'situação fora da lista do Stripe é recusada'
);
select throws_ok(
  $$ insert into public.billing_customers (id, user_id, livemode)
     values ('cus_A2', '11111111-1111-4111-8111-111111111111', false) $$,
  '23505', null, 'uma conta tem um cliente só no Stripe'
);
select is(
  (select subscriptions_open from public.site_settings), false, 'venda de assinatura começa fechada'
);

create function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

select pg_temp.login_as('11111111-1111-4111-8111-111111111111');
select is((select count(*) from public.supporter_subscriptions), 1::bigint, 'A vê só a própria assinatura');
select is((select plan from public.supporter_subscriptions), 'monthly', 'A vê o próprio plano');
select is((select count(*) from public.billing_customers), 1::bigint, 'A vê só o próprio cliente');
select throws_ok(
  $$ update public.supporter_subscriptions set status = 'active', plan = 'yearly' $$,
  '42501', null, 'A não vira apoiador pelo navegador'
);
select throws_ok(
  $$ insert into public.supporter_subscriptions (id, user_id, customer_id, status, livemode)
     values ('sub_A9', '11111111-1111-4111-8111-111111111111', 'cus_A1', 'active', false) $$,
  '42501', null, 'A não cria assinatura pelo navegador'
);
reset role;

set local role anon;
select throws_ok($$ select id from public.supporter_subscriptions $$, '42501', null, 'visitante não lê assinaturas');
reset role;

select * from finish();
rollback;
