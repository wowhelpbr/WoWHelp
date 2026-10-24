'use client';

import { FOCUS_AREAS, type FocusArea } from '@wowhelp/shared';
import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { buttonClasses } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { continueFromHomeAction } from './actions';
import { FOCUS_AREA_CONFIG } from './focus-areas';

/** Botão do herói: "Criar conta grátis" (visitante) ou "Salvar e abrir meus objetivos". */
export function ContinueButton({ label, compact = false }: { label: string; compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={buttonClasses('primary', compact ? 'md' : 'lg', compact ? undefined : 'w-full sm:w-auto', 'skew')}
      disabled={pending}
    >
      {pending ? '…' : label}
    </button>
  );
}

/**
 * Herói da home no formato da proposta neon: à esquerda a pergunta e os oito
 * objetivos (missões disponíveis); à direita a ilustração com o rastreador em
 * vidro, que mostra na hora o que foi escolhido. Funciona sem JavaScript como
 * lista de checkboxes.
 */
export function FocusPicker({
  initial = [],
  intro,
  art,
  floating,
  cta,
  mobileCta,
  secondary,
}: {
  initial?: FocusArea[];
  /** Sobrelinha, título e texto (renderizados no servidor). */
  intro: ReactNode;
  /** Ilustração da classe. */
  art: ReactNode;
  /** Cartão de vidro com um número real (canto da ilustração). */
  floating?: ReactNode;
  cta: ReactNode;
  mobileCta: ReactNode;
  secondary?: ReactNode;
}) {
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
      className="relative grid min-h-[inherit] items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
    >
      <input type="hidden" name="locale" value={locale} />
      <div className="flex flex-col gap-6 py-10 lg:py-14">
        {intro}
        <fieldset id="objetivos" className="scroll-mt-24">
          <legend className="sr-only">{t('pickerLabel')}</legend>
          <ul className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            {FOCUS_AREAS.map((area) => {
              const checked = selected.includes(area);
              const Icon = FOCUS_AREA_CONFIG[area].icon;
              return (
                <li key={area}>
                  <label
                    className={cn(
                      'relative flex h-full min-h-[7rem] cursor-pointer flex-col gap-1.5 rounded-lg p-3.5 transition-[background-color,box-shadow]',
                      checked
                        ? 'bg-card-raised shadow-[inset_0_0_0_1px_rgb(197_251_20/0.55),0_0_20px_rgb(197_251_20/0.12)]'
                        : 'bg-card hover:bg-card-raised',
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
                    <Icon
                      aria-hidden
                      className={cn(
                        'size-[18px] rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primary',
                        checked ? 'text-primary' : 'text-neon',
                      )}
                    />
                    <span className="pr-5 font-display text-[0.8125rem] leading-tight font-bold tracking-[0.02em] text-foreground uppercase">
                      {tf(`${area}.title`)}
                    </span>
                    <span className="text-[0.8125rem] leading-snug text-faint">{tf(`${area}.summary`)}</span>
                    {checked && (
                      <span
                        aria-hidden
                        className="glow-lime absolute top-2.5 right-2.5 grid size-[18px] place-items-center rounded-[3px] bg-primary text-primary-foreground"
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
        <div className="hidden flex-wrap gap-3 lg:flex">
          {cta}
          {secondary}
        </div>
        <div className="flex flex-wrap gap-3 lg:hidden">{secondary}</div>
      </div>

      {/* Ilustração com o rastreador em vidro: mostra na hora o que foi escolhido. */}
      <div className="hero-art relative hidden h-[min(640px,78svh)] self-end md:block">
        <div
          aria-hidden
          className="absolute inset-x-[4%] top-[8%] bottom-0 bg-[radial-gradient(closest-side,rgb(122_20_248/0.38),transparent_70%)] blur-md"
        />
        {art}
        <aside
          className="glass absolute top-[10%] left-0 flex w-[min(21rem,90%)] flex-col gap-3 p-4"
          aria-live="polite"
          aria-labelledby="tracker-title"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="tracker-title" className="label">
              {t('trackerTitle')}
            </h2>
            <span className="chip chip-lime">{t('selectedCount', { count: selected.length })}</span>
          </div>
          {selected.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('trackerEmpty')}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {selected.slice(0, 4).map((area) => {
                const Icon = FOCUS_AREA_CONFIG[area].icon;
                return (
                  <li key={area} className="grid grid-cols-[2.25rem_1fr] items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-md bg-[radial-gradient(circle,rgb(197_251_20/0.2),transparent_70%)] text-primary">
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <b className="block font-display text-xs leading-tight font-bold tracking-[0.02em] text-foreground uppercase">
                        {tf(`${area}.title`)}
                      </b>
                      <span className="block truncate text-xs text-muted-foreground">{tf(`${area}.summary`)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {selected.length > 0 && (
            <ol className="steps lime" aria-hidden>
              <li className="on">{t('trackerChosen')}</li>
              <li>{t('trackerTrying')}</li>
              <li>{t('trackerDone')}</li>
            </ol>
          )}
        </aside>
        {floating}
        <span aria-hidden className="pointer-events-none absolute top-[4%] left-[56%] inline-flex items-start gap-1">
          <svg viewBox="0 0 24 24" className="size-[18px] fill-primary drop-shadow-[0_0_6px_rgb(197_251_20/0.6)]">
            <path d="M4 3l7 18 2.5-7.5L21 11z" />
          </svg>
          <span className="mt-3 rounded bg-primary px-2 py-0.5 text-[0.6875rem] font-bold text-primary-foreground">
            {t('cursorYou')}
          </span>
        </span>
      </div>

      {/* Celular: barra fixa acima das abas com o botão. */}
      <div
        className="glass fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 px-3 py-2.5 lg:hidden"
        aria-live="polite"
      >
        <p className="text-sm text-foreground">
          {selected.length === 0 ? t('trackerEmptyMobile') : t('selectedCount', { count: selected.length })}
        </p>
        <div className="shrink-0">{mobileCta}</div>
      </div>
    </form>
  );
}
