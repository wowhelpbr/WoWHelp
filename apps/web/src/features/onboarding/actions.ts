'use server';

import { FOCUS_AREAS, focusAreasSchema, localeSchema } from '@wowhelp/shared';
import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/session';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';

function readFocus(formData: FormData) {
  const raw = formData.getAll('focus').map(String);
  const parsed = focusAreasSchema.safeParse(raw.filter((v) => (FOCUS_AREAS as readonly string[]).includes(v)));
  return parsed.success ? parsed.data : [];
}

/**
 * "Continuar" da home. Logado: salva no perfil e abre o painel.
 * Visitante: leva as escolhas para o cadastro pela URL (nada é gravado).
 */
export async function continueFromHomeAction(formData: FormData): Promise<void> {
  const locale = localeSchema.safeParse(formData.get('locale'));
  const prefix = LOCALE_PREFIX[locale.success ? locale.data : routing.defaultLocale];
  const focus = readFocus(formData);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`${prefix}/signup${focus.length ? `?focus=${focus.join(',')}` : ''}`);
  }

  const supabase = await createClient();
  await supabase
    .from('profiles')
    .update({ focus_areas: focus, onboarded_at: new Date().toISOString() })
    .eq('id', user.id);
  redirect(`${prefix}/dashboard`);
}

export type FocusSaveState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error' };

export async function saveFocusAreasAction(_prev: FocusSaveState, formData: FormData): Promise<FocusSaveState> {
  const user = await getCurrentUser();
  if (!user) return { status: 'error' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ focus_areas: readFocus(formData), onboarded_at: new Date().toISOString() })
    .eq('id', user.id);
  if (error) return { status: 'error' };

  refresh();
  return { status: 'saved', at: Date.now() };
}
