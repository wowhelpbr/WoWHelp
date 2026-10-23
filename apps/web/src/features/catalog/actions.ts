'use server';

import { localeSchema, uuidSchema } from '@wowhelp/shared';
import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/features/auth/session';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { logEvent } from '@/lib/log';
import { createClient } from '@/lib/supabase/server';

/** Cria um objetivo a partir de uma montaria do catálogo e abre o painel. */
export async function createMountGoalAction(formData: FormData): Promise<void> {
  const locale = localeSchema.safeParse(formData.get('locale'));
  const prefix = LOCALE_PREFIX[locale.success ? locale.data : routing.defaultLocale];
  const collectibleId = uuidSchema.safeParse(formData.get('collectibleId'));
  const back = String(formData.get('back') ?? '');

  const user = await getCurrentUser();
  if (!user) redirect(`${prefix}/login?next=${encodeURIComponent(back.startsWith('/') ? back : `${prefix}/mounts`)}`);
  if (!collectibleId.success) redirect(`${prefix}/mounts`);

  const supabase = await createClient();
  const { data: tr } = await supabase
    .from('collectible_translations')
    .select('name, locale')
    .eq('collectible_id', collectibleId.data)
    .in('locale', [locale.success ? locale.data : 'en-US', 'en-US']);
  const name =
    tr?.find((t) => t.locale === (locale.success ? locale.data : 'en-US'))?.name ??
    tr?.find((t) => t.locale === 'en-US')?.name;
  if (!name) redirect(`${prefix}/mounts`);

  await supabase.from('goals').insert({
    kind: 'mount',
    collectible_id: collectibleId.data,
    title: name.slice(0, 160),
    priority: 3,
  });
  logEvent('objective_created', { source: 'mount' });
  redirect(`${prefix}/dashboard`);
}

/** Marcação manual "já tenho" / "ainda não tenho" (fonte 'manual', sempre identificada). */
export async function setMountManualAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const externalId = z
    .string()
    .regex(/^\d{1,20}$/)
    .safeParse(formData.get('externalId'));
  const status = z.enum(['collected', 'not_collected', 'clear']).safeParse(formData.get('status'));
  if (!externalId.success || !status.success) return;

  const supabase = await createClient();
  if (status.data === 'clear') {
    await supabase
      .from('collection_states')
      .delete()
      .eq('kind', 'mount')
      .eq('external_item_id', externalId.data)
      .eq('source', 'manual');
  } else {
    await supabase.from('collection_states').upsert(
      {
        kind: 'mount',
        external_item_id: externalId.data,
        status: status.data,
        source: 'manual',
        observed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,kind,external_item_id,source' },
    );
  }
  refresh();
}
