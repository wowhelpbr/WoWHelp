'use client';

import { BATTLENET_REGIONS, type BattlenetRegion } from '@wowhelp/shared';
import { Link2, RefreshCw, Unplug } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormStatus } from 'react-dom';
import { buttonClasses } from '@/components/ui/button';
import { inputClasses } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import { disconnectBattlenetAction, startBattlenetConnectionAction } from './actions';

function Submit({ children, variant = 'primary' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses(variant, 'md')}>
      {children}
    </button>
  );
}

/** Escolha da região + botão que leva à autorização na Battle.net. */
export function ConnectForm({ defaultRegion, connected }: { defaultRegion: BattlenetRegion; connected: boolean }) {
  const t = useTranslations('Characters');
  const tr = useTranslations('Settings.regions');
  const locale = useLocale();
  return (
    <form action={startBattlenetConnectionAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="locale" value={locale} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bnet-region" className="text-sm font-medium text-foreground">
          {t('regionLabel')}
        </label>
        <select id="bnet-region" name="region" defaultValue={defaultRegion} className={cn(inputClasses, 'sm:w-64')}>
          {BATTLENET_REGIONS.map((r) => (
            <option key={r} value={r}>
              {tr(r)}
            </option>
          ))}
        </select>
      </div>
      <Submit>
        {connected ? <RefreshCw aria-hidden className="size-4" /> : <Link2 aria-hidden className="size-4" />}
        {connected ? t('reconnect') : t('connect')}
      </Submit>
    </form>
  );
}

export function DisconnectForm({ region }: { region: BattlenetRegion }) {
  const t = useTranslations('Characters');
  return (
    <form
      action={disconnectBattlenetAction}
      onSubmit={(event) => {
        if (!window.confirm(t('disconnectConfirm'))) event.preventDefault();
      }}
    >
      <input type="hidden" name="region" value={region} />
      <button type="submit" className={buttonClasses('danger', 'sm')}>
        <Unplug aria-hidden className="size-4" />
        {t('disconnect')}
      </button>
    </form>
  );
}
