'use client';

import { FOCUS_AREAS, type FocusArea } from '@wowhelp/shared';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataStateBadge } from '@/components/ui/data-state';
import { Link } from '@/i18n/navigation';
import { saveFocusAreasAction, type FocusSaveState } from './actions';
import { FOCUS_AREA_CONFIG } from './focus-areas';

const initial: FocusSaveState = { status: 'idle' };

/** Painel "O que você quer fazer" do dashboard: mostra e edita as áreas de foco. */
export function FocusEditor({ areas }: { areas: FocusArea[] }) {
  const t = useTranslations('Dashboard');
  const tf = useTranslations('Focus');
  const ta = useTranslations('Availability');
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(async (prev: FocusSaveState, formData: FormData) => {
    const result = await saveFocusAreasAction(prev, formData);
    if (result.status === 'saved') setEditing(false);
    return result;
  }, initial);

  if (editing) {
    return (
      <form action={action} className="flex flex-col gap-3">
        <fieldset>
          <legend className="sr-only">{t('focusTitle')}</legend>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {FOCUS_AREAS.map((area) => (
              <li key={area}>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-border/70 px-3 has-[:checked]:border-primary/70 has-[:checked]:bg-primary/[0.07]">
                  <input
                    type="checkbox"
                    name="focus"
                    value={area}
                    defaultChecked={areas.includes(area)}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">{tf(`${area}.title`)}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {t('focusSave')}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            {t('focusCancel')}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {areas.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('focusEmpty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {areas.map((area) => {
            const { icon: Icon, tool } = FOCUS_AREA_CONFIG[area];
            return (
              <li key={area} className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-foreground">
                  <Icon aria-hidden className="size-4 text-muted-foreground" />
                  {tf(`${area}.title`)}
                </span>
                {typeof tool === 'object' && 'href' in tool ? (
                  <Link href={tool.href} className="rounded-sm">
                    <DataStateBadge state="ok" label={ta('openTool')} />
                  </Link>
                ) : (
                  <DataStateBadge
                    state="not_available"
                    label={tool === 'after_beta' ? ta('afterBeta') : ta('planned', { phase: tool.phase })}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">{ta('goalsMeanwhile')}</p>
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>
          {t('focusEdit')}
        </Button>
        {state.status === 'saved' && (
          <span role="status" className="text-sm text-success">
            {t('focusSaved')}
          </span>
        )}
      </div>
    </div>
  );
}
