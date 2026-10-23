'use client';

import { FOCUS_AREAS, type FocusArea } from '@wowhelp/shared';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { buttonClasses } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { continueFromHomeAction } from './actions';
import { FOCUS_AREA_CONFIG } from './focus-areas';

function ContinueButton({ disabled }: { disabled: boolean }) {
  const t = useTranslations('Home');
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={buttonClasses('primary', 'md', 'w-full sm:w-auto')} disabled={disabled || pending}>
      {pending ? '…' : t('continue')}
    </button>
  );
}

/**
 * Escolha de objetivos da home, no formato de registro de missões:
 * cada área é uma missão disponível ("!"); ao aceitar, ela vai para o
 * rastreador ao lado. Funciona sem JavaScript como lista de checkboxes.
 */
export function FocusPicker({ initial = [] }: { initial?: FocusArea[] }) {
  const t = useTranslations('Home');
  const tf = useTranslations('Focus');
  const locale = useLocale();
  const [selected, setSelected] = useState<FocusArea[]>(initial);

  const toggle = (area: FocusArea) =>
    setSelected((current) =>
      current.includes(area)
        ? current.filter((a) => a !== area)
        : FOCUS_AREAS.filter((a) => a === area || current.includes(a)),
    );

  return (
    <form
      action={continueFromHomeAction}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start 2xl:grid-cols-[minmax(0,1fr)_24rem]"
    >
      <input type="hidden" name="locale" value={locale} />
      <fieldset>
        <legend className="sr-only">{t('pickerLabel')}</legend>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {FOCUS_AREAS.map((area) => {
            const checked = selected.includes(area);
            const Icon = FOCUS_AREA_CONFIG[area].icon;
            return (
              <li key={area}>
                <label
                  className={cn(
                    'group relative flex h-full cursor-pointer items-start gap-3 rounded-sm border p-4 transition-colors xl:min-h-[11rem] xl:flex-col',
                    checked
                      ? 'corner-brackets border-primary/80 bg-primary/[0.08]'
                      : 'border-border bg-card/70 hover:border-neon/60 hover:bg-card',
                  )}
                >
                  <input
                    type="checkbox"
                    name="focus"
                    value={area}
                    checked={checked}
                    onChange={() => toggle(area)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-sm border bg-background/70 transition-colors',
                      'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
                      checked ? 'border-primary/70 text-primary' : 'border-border text-neon',
                    )}
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1 xl:order-last xl:flex-none">
                    <span className="text-[1.05rem] leading-snug font-semibold text-foreground">
                      {tf(`${area}.title`)}
                    </span>
                    <span className="text-sm text-muted-foreground">{tf(`${area}.summary`)}</span>
                  </span>
                  <span
                    className="quest-mark xl:absolute xl:top-4 xl:right-4"
                    data-state={checked ? 'accepted' : 'available'}
                    aria-hidden
                  >
                    {checked ? '✓' : '!'}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* Rastreador: no desktop fica ao lado; no celular vira barra fixa acima das abas. */}
      <aside className="frame corner-brackets hidden p-4 lg:sticky lg:top-24 lg:block" aria-live="polite">
        <h2 className="eyebrow">{t('trackerTitle')}</h2>
        {selected.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t('trackerEmpty')}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 border-l-2 border-primary/60 pl-3">
            {selected.map((area) => (
              <li key={area} className="text-[0.95rem] font-semibold text-primary">
                {tf(`${area}.title`)}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t('selectedCount', { count: selected.length })}</p>
          <ContinueButton disabled={false} />
        </div>
      </aside>

      <div
        className="frame-raised fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 px-3 py-2.5 lg:hidden"
        aria-live="polite"
      >
        <p className="text-sm text-foreground">
          {selected.length === 0 ? t('trackerEmptyMobile') : t('selectedCount', { count: selected.length })}
        </p>
        <div className="shrink-0">
          <ContinueButton disabled={false} />
        </div>
      </div>
    </form>
  );
}
