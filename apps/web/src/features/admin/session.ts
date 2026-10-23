import 'server-only';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getCurrentUser, type CurrentUser } from '@/features/auth/session';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';

/**
 * Conta logada que está em app_admins (lista mantida à mão no banco). A
 * tabela não é legível pelo navegador: a checagem é sempre no servidor.
 */
export const getAdminUser = cache(async (): Promise<CurrentUser | null> => {
  const user = await getCurrentUser();
  if (!user || !isAdminConfigured()) return null;
  const { data, error } = await createAdminClient()
    .from('app_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  return error || !data ? null : user;
});

/** Páginas de curadoria: quem não é administrador vê "página não encontrada". */
export async function requireAdmin(): Promise<CurrentUser> {
  const admin = await getAdminUser();
  if (!admin) notFound();
  return admin;
}
