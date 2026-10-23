'use client';

import { GAME_REGIONS, LOCALES, type GameRegion, type Locale } from '@wowhelp/shared';
import { useTranslations } from 'next-intl';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { inputClasses } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import { saveSettingsAction, type SettingsState } from './actions';

const initial: SettingsState = { status: 'idle' };
const LOCALE_NAMES: Record<Locale, string> = { 'en-US': 'English', 'pt-BR': 'Português (Brasil)' };

export function SettingsForm({ locale, region }: { locale: Locale; region: GameRegion | null }) {
  const t = useTranslations('Settings');
  const [state, action, pending] = useActionState(saveSettingsAction, initial);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="preferred-locale" className="font-display text-lg text-primary">
          {t('languageTitle')}
        </label>
        <p className="text-sm text-muted-foreground">{t('languageBody')}</p>
        <select
          id="preferred-locale"
          name="preferredLocale"
          defaultValue={locale}
          className={cn(inputClasses, 'w-full')}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_NAMES[l]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="game-region" className="font-display text-lg text-primary">
          {t('regionTitle')}
        </label>
        <p className="text-sm text-muted-foreground">{t('regionBody')}</p>
        <select id="game-region" name="region" defaultValue={region ?? ''} className={cn(inputClasses, 'w-full')}>
          <option value="">{t('regionNone')}</option>
          {GAME_REGIONS.map((r) => (
            <option key={r} value={r}>
              {t(`regions.${r}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t('save')}
        </Button>
        {state.status === 'saved' && (
          <span role="status" className="text-sm text-success">
            {t('saved')}
          </span>
        )}
      </div>
    </form>
  );
}
