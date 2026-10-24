'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser } from './session';

export type SubscriptionsSettingsState =
  | { status: 'idle' }
  | { status: 'saved'; open: boolean; at: number }
  | { status: 'error'; code: 'forbidden' | 'storage' };

/** Abre ou fecha a venda do WoWHelp Apoiador ao público. Só administrador. */
export async function saveSubscriptionsOpenAction(
  _prev: SubscriptionsSettingsState,
  formData: FormData,
): Promise<SubscriptionsSettingsState> {
  const admin = await getAdminUser();
  if (!admin) return { status: 'error', code: 'forbidden' };
  const open = formData.get('open') === 'on';
  const { error } = await createAdminClient()
    .from('site_settings')
    .update({ subscriptions_open: open, updated_by: admin.id })
    .eq('id', true);
  if (error) return { status: 'error', code: 'storage' };
  return { status: 'saved', open, at: Date.now() };
}
