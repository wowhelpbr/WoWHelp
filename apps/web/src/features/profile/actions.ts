'use server';

import { gameRegionSchema, localeSchema } from '@wowhelp/shared';
import { refresh } from 'next/cache';
import { getCurrentUser } from '@/features/auth/session';
import { createClient } from '@/lib/supabase/server';

export type SettingsState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error' };

export async function saveSettingsAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await getCurrentUser();
  if (!user) return { status: 'error' };

  const regionRaw = formData.get('region');
  const region = regionRaw === '' ? { success: true as const, data: null } : gameRegionSchema.safeParse(regionRaw);
  const locale = localeSchema.safeParse(formData.get('preferredLocale'));
  if (!region.success || !locale.success) return { status: 'error' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ preferred_game_region: region.data, locale: locale.data })
    .eq('id', user.id);
  if (error) return { status: 'error' };

  refresh();
  return { status: 'saved', at: Date.now() };
}
