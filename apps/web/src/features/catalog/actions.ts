'use server';

import { localeSchema, uuidSchema } from '@wowhelp/shared';
import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/features/auth/session';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { logEvent } from '@/lib/log';
import { createClient } from '@/lib/supabase/server';
import { CATALOG_PATH, isCatalogKind, type CatalogKind } from './kinds';

const kindOf = (formData: FormData): CatalogKind => {
  const k = formData.get('kind');
  return isCatalogKind(k) ? k : 'mount';
};

/** Cria um objetivo a partir de um item do catálogo e abre o painel. */
export async function createCollectibleGoalAction(formData: FormData): Promise<void> {
  const kind = kindOf(formData);
  const locale = localeSchema.safeParse(formData.get('locale'));
  const prefix = LOCALE_PREFIX[locale.success ? locale.data : routing.defaultLocale];
  const list = `${prefix}${CATALOG_PATH[kind]}`;
  const collectibleId = uuidSchema.safeParse(formData.get('collectibleId'));
  const back = String(formData.get('back') ?? '');

  const user = await getCurrentUser();
  if (!user) redirect(`${prefix}/login?next=${encodeURIComponent(back.startsWith('/') ? back : list)}`);
  if (!collectibleId.success) redirect(list);

  const supabase = await createClient();
  const { data: tr } = await supabase
    .from('collectible_translations')
    .select('name, locale, collectibles!inner(kind)')
    .eq('collectible_id', collectibleId.data)
    .eq('collectibles.kind', kind)
    .in('locale', [locale.success ? locale.data : 'en-US', 'en-US']);
  const name =
    tr?.find((t) => t.locale === (locale.success ? locale.data : 'en-US'))?.name ??
    tr?.find((t) => t.locale === 'en-US')?.name;
  if (!name) redirect(list);

  await supabase.from('goals').insert({
    kind,
    collectible_id: collectibleId.data,
    title: name.slice(0, 160),
    priority: 3,
  });
  logEvent('objective_created', { source: kind });
  redirect(`${prefix}/dashboard`);
}

/** Marcação manual "já tenho" / "ainda não tenho" (fonte 'manual', sempre identificada). */
export async function setCollectionManualAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const kind = kindOf(formData);
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
      .eq('kind', kind)
      .eq('external_item_id', externalId.data)
      .eq('source', 'manual');
  } else {
    await supabase.from('collection_states').upsert(
      {
        kind,
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
