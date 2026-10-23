import 'server-only';
import type { FocusArea, GameRegion, Locale } from '@wowhelp/shared';
import { createClient } from '@/lib/supabase/server';

export interface ProfileView {
  locale: Locale;
  preferredGameRegion: GameRegion | null;
  focusAreas: FocusArea[];
  onboardedAt: string | null;
}

/** Perfil do usuário logado (RLS: só a própria linha é visível). */
export async function getMyProfile(): Promise<ProfileView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('locale, preferred_game_region, focus_areas, onboarded_at')
    .maybeSingle();
  if (error || !data) return null;
  return {
    locale: data.locale as Locale,
    preferredGameRegion: (data.preferred_game_region as GameRegion | null) ?? null,
    focusAreas: (data.focus_areas ?? []) as FocusArea[],
    onboardedAt: data.onboarded_at,
  };
}
