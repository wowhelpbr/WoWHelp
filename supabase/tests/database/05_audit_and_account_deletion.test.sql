-- Fase 6: auditoria geral de RLS e exclusão completa da conta.
begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

-- Toda tabela do schema public tem RLS ligado.
select is(
  (select coalesce(array_agg(tablename::text order by tablename), '{}')
     from pg_tables where schemaname = 'public' and not rowsecurity),
  '{}'::text[],
  'todas as tabelas públicas têm RLS'
);

-- Visitante (anon) só tem acesso ao catálogo publicado.
select is(
  (select coalesce(array_agg(distinct table_name::text order by table_name::text), '{}')
     from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public'),
  array['collectible_guides', 'collectible_translations', 'collectibles', 'creator_channels', 'creators']::text[],
  'anon só enxerga o catálogo'
);

-- Nenhuma tabela pública deixa o navegador escolher user_id.
select is(
  (select coalesce(array_agg(table_name::text order by table_name::text), '{}')
     from information_schema.column_privileges
    where grantee = 'authenticated' and table_schema = 'public'
      and column_name = 'user_id' and privilege_type in ('INSERT', 'UPDATE')),
  '{}'::text[],
  'user_id nunca vem do navegador'
);

-- Uma conta com dados em todas as tabelas...
insert into auth.users (id, email, aud, role) values
  ('33333333-3333-4333-8333-333333333333', 'apagar@test.local', 'authenticated', 'authenticated'),
  ('44444444-4444-4444-8444-444444444444', 'fica@test.local', 'authenticated', 'authenticated');

insert into public.goals (id, user_id, title) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'Objetivo'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'Objetivo de B');
insert into public.goal_steps (user_id, goal_id, label) values
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-0000-4000-8000-000000000001', 'Passo');
insert into public.recurring_tasks (id, user_id, title) values
  ('bbbbbbbb-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'Semanal');
insert into public.task_completions (user_id, task_id, cycle_key) values
  ('33333333-3333-4333-8333-333333333333', 'bbbbbbbb-0000-4000-8000-000000000001', 'us-w-2026-10-20');
insert into public.game_connections (user_id, region, external_account_ref) values
  ('33333333-3333-4333-8333-333333333333', 'us', '123');
insert into public.characters (user_id, source, region, realm_slug, name) values
  ('33333333-3333-4333-8333-333333333333', 'addon_import', 'us', 'test', 'Apagado');
insert into public.collection_states (user_id, kind, external_item_id, status, source, observed_at) values
  ('33333333-3333-4333-8333-333333333333', 'mount', '6', 'collected', 'manual', now());
insert into public.addon_imports (user_id, schema_version, addon_version, categories, payload_sha256) values
  ('33333333-3333-4333-8333-333333333333', 1, '0.1.0', array['mounts'], repeat('e', 64));

-- ...é excluída (o que o Supabase faz em auth.admin.deleteUser).
delete from auth.users where id = '33333333-3333-4333-8333-333333333333';

select is(
  (select
     (select count(*) from public.profiles where id = '33333333-3333-4333-8333-333333333333')
   + (select count(*) from public.goals where user_id = '33333333-3333-4333-8333-333333333333')
   + (select count(*) from public.goal_steps where user_id = '33333333-3333-4333-8333-333333333333')
   + (select count(*) from public.recurring_tasks where user_id = '33333333-3333-4333-8333-333333333333')
   + (select count(*) from public.task_completions where user_id = '33333333-3333-4333-8333-333333333333')
   + (select count(*) from public.game_connections where user_id = '33333333-3333-4333-8333-333333333333')
   + (select count(*) from public.characters where user_id = '33333333-3333-4333-8333-333333333333')
   + (select count(*) from public.collection_states where user_id = '33333333-3333-4333-8333-333333333333')
   + (select count(*) from public.addon_imports where user_id = '33333333-3333-4333-8333-333333333333')),
  0::bigint,
  'excluir a conta apaga os dados em todas as tabelas'
);
select is(
  (select count(*) from public.goals where user_id = '44444444-4444-4444-8444-444444444444'),
  1::bigint,
  'a exclusão não toca nos dados de outra conta'
);

select * from finish();
rollback;
