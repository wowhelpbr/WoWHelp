-- WoWHelp | Gamificação: o progresso da conta logada numa consulta só.
--
-- Nada novo é guardado: XP, nível e conquistas são calculados no site a
-- partir do que já existe (passos e objetivos concluídos, semanais e
-- diárias marcadas, marcações "já tenho" e a coleção). Desfazer um passo
-- tira o XP de volta. Roda com a sessão do jogador (security invoker): o
-- RLS continua valendo e cada conta só soma o que é dela.

create or replace function public.my_progress()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'steps_done', (select count(*) from public.goal_steps where user_id = auth.uid() and completed_at is not null),
    'goals_done', (select count(*) from public.goals where user_id = auth.uid() and status = 'completed'),
    'weekly_done', (select count(*) from public.task_completions where user_id = auth.uid() and cycle_key like '%-w-%'),
    'daily_done', (select count(*) from public.task_completions where user_id = auth.uid() and cycle_key like '%-d-%'),
    -- Datas de início das semanas com alguma semanal feita (mais recentes primeiro), para a sequência.
    'weekly_cycles', coalesce(
      (
        select jsonb_agg(w.d order by w.d desc)
        from (
          select distinct right(cycle_key, 10) as d
          from public.task_completions
          where user_id = auth.uid() and cycle_key like '%-w-%'
          order by d desc
          limit 60
        ) w
      ),
      '[]'::jsonb
    ),
    'manual_marks', (
      select count(*) from public.collection_states
      where user_id = auth.uid() and source = 'manual' and status = 'collected'
    ),
    'mounts', (
      select count(distinct external_item_id) from public.collection_states
      where user_id = auth.uid() and kind = 'mount' and status = 'collected'
    ),
    'pets', (
      select count(distinct external_item_id) from public.collection_states
      where user_id = auth.uid() and kind = 'pet' and status = 'collected'
    ),
    'toys', (
      select count(distinct external_item_id) from public.collection_states
      where user_id = auth.uid() and kind = 'toy' and status = 'collected'
    ),
    'battlenet', exists (select 1 from public.game_connections where user_id = auth.uid()),
    'addon', exists (select 1 from public.addon_imports where user_id = auth.uid())
  );
$$;

revoke all on function public.my_progress() from public, anon;
grant execute on function public.my_progress() to authenticated;
