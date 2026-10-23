'use client';

import { useTranslations } from 'next-intl';
import { startTransition, useActionState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { DataStateBadge } from '@/components/ui/data-state';
import { Field, inputClasses } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import { saveGuideAction, type GuideFormState } from './actions';
import type { GuideKind, GuideRow } from './queries';

const initial: GuideFormState = { status: 'idle' };

function TextArea({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={5}
        maxLength={2000}
        defaultValue={defaultValue}
        className={cn(inputClasses, 'w-full py-2')}
      />
    </div>
  );
}

/** Formulário de curadoria: textos em inglês e português, chance só com fonte. */
export function GuideForm({
  kind,
  externalId,
  guide,
}: {
  kind: GuideKind;
  externalId: string;
  guide: GuideRow | null;
}) {
  const t = useTranslations('Admin.guide');
  const [state, action, pending] = useActionState(saveGuideAction, initial);
  const published = state.status === 'saved' ? state.intent === 'approve' : guide?.status === 'approved';
  // Envio manual (sem action no <form>): o React não limpa os campos depois,
  // então um erro não apaga o que o curador digitou.
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => action(data));
  }
  const v = (x: string | number | null | undefined) => (x === null || x === undefined ? '' : String(x));

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="externalId" value={externalId} />

      <div className="flex flex-wrap items-center gap-2">
        <DataStateBadge
          state={published ? 'ok' : guide ? 'stale' : 'empty'}
          label={published ? t('statusApproved') : guide ? t('statusDraft') : t('statusNone')}
        />
        {state.status === 'saved' && (
          <p role="status" className="text-sm text-success">
            {t(`saved.${state.intent}`)}
          </p>
        )}
      </div>

      <fieldset className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)]">
        <legend className="mb-2 font-display text-lg text-primary">{t('chanceTitle')}</legend>
        <Field
          id="dropChance"
          name="dropChance"
          inputMode="decimal"
          label={t('dropChance')}
          hint={t('dropChanceHint')}
          defaultValue={v(guide?.drop_chance_percent)}
        />
        <Field
          id="chanceNotePt"
          name="chanceNotePt"
          maxLength={200}
          label={t('notePt')}
          hint={t('noteHint')}
          defaultValue={v(guide?.chance_note_pt)}
        />
        <Field
          id="chanceNoteEn"
          name="chanceNoteEn"
          maxLength={200}
          label={t('noteEn')}
          defaultValue={v(guide?.chance_note_en)}
        />
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <legend className="mb-2 font-display text-lg text-primary">{t('sourceTitle')}</legend>
        <Field
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          maxLength={500}
          placeholder="https://"
          label={t('sourceUrl')}
          hint={t('sourceHint')}
          defaultValue={v(guide?.source_url)}
        />
        <Field
          id="sourceLabel"
          name="sourceLabel"
          maxLength={120}
          label={t('sourceLabel')}
          defaultValue={v(guide?.source_label)}
        />
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 font-display text-lg text-primary">{t('whereTitle')}</legend>
        <Field
          id="locationPt"
          name="locationPt"
          maxLength={300}
          label={t('locationPt')}
          defaultValue={v(guide?.location_pt)}
        />
        <Field
          id="locationEn"
          name="locationEn"
          maxLength={300}
          label={t('locationEn')}
          defaultValue={v(guide?.location_en)}
        />
        <TextArea id="howPt" name="howPt" label={t('howPt')} defaultValue={v(guide?.how_pt)} />
        <TextArea id="howEn" name="howEn" label={t('howEn')} defaultValue={v(guide?.how_en)} />
        <Field
          id="encounterId"
          name="encounterId"
          inputMode="numeric"
          label={t('encounter')}
          hint={t('encounterHint')}
          defaultValue={v(guide?.journal_encounter_id)}
        />
      </fieldset>

      {state.status === 'error' && (
        <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(`errors.${state.code}`)}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="intent" value="approve" disabled={pending}>
          {t('approve')}
        </Button>
        <Button type="submit" name="intent" value="draft" variant="secondary" disabled={pending}>
          {t('saveDraft')}
        </Button>
        {published && (
          <Button type="submit" name="intent" value="unpublish" variant="ghost" disabled={pending}>
            {t('unpublish')}
          </Button>
        )}
      </div>
    </form>
  );
}
