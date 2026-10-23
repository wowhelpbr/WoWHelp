-- WoWHelp | Fase 6: auditoria de segurança (supabase db advisors).
--
-- O Supabase criou no projeto de produção a função public.rls_auto_enable()
-- (opção "ligar RLS automaticamente"), usada pelo gatilho de evento ensure_rls.
-- Ela é SECURITY DEFINER e o advisor avisa que anon e authenticated podem
-- executá-la. Como só roda como gatilho, tirar o EXECUTE não muda nada no
-- funcionamento. O bloco só age se a função existir (no banco local não existe).

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
