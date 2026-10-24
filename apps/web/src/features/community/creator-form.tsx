'use client';

import { CREATOR_PLATFORMS, CREATOR_TAGS } from '@wowhelp/shared';
import { useLocale, useTranslations } from 'next-intl';
import { startTransition, useActionState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field, inputClasses } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import { saveCreatorAction, type CreatorFormState } from './actions';
import type { CreatorView } from './queries';

const initial: CreatorFormState = { status: 'idle' };

function TextArea({
  id,
  label,
  defaultValue,
  maxLength,
}: {
  id: string;
  label: string;
  defaultValue: string;
  maxLength: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
      >
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        rows={3}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className={cn(inputClasses, 'w-full py-2')}
      />
    </div>
  );
}

/** Formulário do curador: dados do criador, etiquetas, canais e destaque. */
export function CreatorForm({ creator, prefill }: { creator: CreatorView | null; prefill?: { name: string } }) {
  const t = useTranslations('Admin.community');
  const tc = useTranslations('Community');
  const locale = useLocale();
  const [state, action, pending] = useActionState(saveCreatorAction, initial);
  const channel = (p: string) => creator?.channels.find((c) => c.platform === p)?.handle ?? '';

  // Envio manual: um erro não apaga o que foi digitado.
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={creator?.id ?? ''} />
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Field
          id="name"
          name="name"
          required
          maxLength={60}
          label={t('name')}
          defaultValue={creator?.name ?? prefill?.name ?? ''}
        />
        <Field
          id="slug"
          name="slug"
          maxLength={40}
          label={t('slug')}
          hint={t('slugHint')}
          defaultValue={creator?.slug ?? ''}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="status"
            className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
          >
            {t('status')}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={creator?.status ?? 'draft'}
            className={cn(inputClasses, 'w-full')}
          >
            <option value="draft">{t('statusDraft')}</option>
            <option value="published">{t('statusPublished')}</option>
            <option value="hidden">{t('statusHidden')}</option>
          </select>
        </div>
      </div>

      <fieldset className="grid gap-4 md:grid-cols-3">
        <legend className="mb-2 font-display text-lg text-primary">{t('channels')}</legend>
        {CREATOR_PLATFORMS.map((p) => (
          <Field
            key={p}
            id={`channel_${p}`}
            name={`channel_${p}`}
            label={tc(`platforms.${p}`)}
            placeholder={t(`channelPlaceholder.${p}`)}
            defaultValue={channel(p)}
          />
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-display text-lg text-primary">{t('tags')}</legend>
        <div className="flex flex-wrap gap-2">
          {CREATOR_TAGS.map((tag) => (
            <label
              key={tag}
              className="flex cursor-pointer items-center gap-2 rounded-sm border border-border bg-background/40 px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:text-primary"
            >
              <input
                type="checkbox"
                name="tags"
                value={tag}
                defaultChecked={creator?.tags.includes(tag)}
                className="size-4 accent-primary"
              />
              {tc(`tags.${tag}`)}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t('tagsHint')}</p>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <TextArea id="bioPt" label={t('bioPt')} maxLength={400} defaultValue={creator?.bioPt ?? ''} />
        <TextArea id="bioEn" label={t('bioEn')} maxLength={400} defaultValue={creator?.bioEn ?? ''} />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-sm border border-border p-4">
        <legend className="px-1 font-display text-lg text-primary">{t('featuredTitle')}</legend>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="featured" defaultChecked={creator?.featured} className="size-4 accent-primary" />
          {t('featured')}
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="featuredNotePt"
            name="featuredNotePt"
            maxLength={200}
            label={t('featuredNotePt')}
            defaultValue={creator?.featuredNotePt ?? ''}
          />
          <Field
            id="featuredNoteEn"
            name="featuredNoteEn"
            maxLength={200}
            label={t('featuredNoteEn')}
            defaultValue={creator?.featuredNoteEn ?? ''}
          />
        </div>
      </fieldset>

      {state.status === 'error' && (
        <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(`errors.${state.code}`, { platform: state.platform ? tc(`platforms.${state.platform}`) : '' })}
        </p>
      )}
      {state.status === 'saved' && (
        <p role="status" className="text-sm text-success">
          {t('saved')}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t('saving') : t('save')}
      </Button>
    </form>
  );
}
