'use client';

import { FileUp, Trash2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useRef, useState, useSyncExternalStore, useTransition, type DragEvent } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { DataStateBadge } from '@/components/ui/data-state';
import { cn } from '@/lib/cn';
import {
  confirmAddonImportAction,
  deleteAddonDataAction,
  previewAddonImportAction,
  type ImportPreview,
  type ImportResult,
} from './actions';

// Mesmo limite do servidor; conferido antes para não enviar arquivo errado.
const MAX_BYTES = 512 * 1024;

const noop = () => () => {};
/** true só depois de carregar o JavaScript: antes disso o arquivo escolhido se perderia. */
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

type Category = 'characters' | 'mounts';
type Preview = Extract<ImportPreview, { ok: true }>;
type ErrorCode =
  | Extract<ImportPreview, { ok: false }>['code']
  | Extract<ImportResult, { ok: false }>['code']
  | 'read'
  | 'wrong_extension';

type State =
  | { step: 'idle'; error?: ErrorCode }
  | { step: 'preview'; text: string; preview: Preview; error?: ErrorCode }
  | { step: 'done'; characters: number; mounts: number | null };

function defaultCategories(p: Preview): Set<Category> {
  const set = new Set<Category>();
  if (p.characters.length > 0 && p.region) set.add('characters');
  if (p.mountsCount !== null) set.add('mounts');
  return set;
}

/** Envio do WoWHelpCompanion.lua: prévia primeiro, gravação só depois de confirmar. */
export function AddonUploader() {
  const t = useTranslations('Import');
  const tr = useTranslations('Settings.regions');
  const format = useFormatter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ step: 'idle' });
  const [categories, setCategories] = useState<Set<Category>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();

  async function handleFile(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.lua')) return setState({ step: 'idle', error: 'wrong_extension' });
    if (file.size > MAX_BYTES) return setState({ step: 'idle', error: 'too_large' });
    let text: string;
    try {
      text = await file.text();
    } catch {
      return setState({ step: 'idle', error: 'read' });
    }
    startTransition(async () => {
      // Falha de rede ou do servidor vira aviso no painel, não tela de erro.
      const preview = await previewAddonImportAction(text).catch((): ImportPreview => ({ ok: false, code: 'storage' }));
      if (!preview.ok) {
        setState({ step: 'idle', error: preview.code });
        return;
      }
      setCategories(defaultCategories(preview));
      setState({ step: 'preview', text, preview });
    });
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  }

  function toggle(category: Category, checked: boolean) {
    setCategories((current) => {
      const next = new Set(current);
      if (checked) next.add(category);
      else next.delete(category);
      return next;
    });
  }

  function confirm() {
    if (state.step !== 'preview') return;
    const current = state;
    startTransition(async () => {
      const result = await confirmAddonImportAction(current.text, [...categories]).catch((): ImportResult => ({
        ok: false,
        code: 'storage',
      }));
      if (result.ok) setState({ step: 'done', characters: result.characters, mounts: result.mounts });
      else setState({ ...current, error: result.code });
    });
  }

  if (state.step === 'done') {
    return (
      <div role="status" className="flex flex-col gap-4">
        <div className="rounded-sm border border-success/40 bg-success/10 px-4 py-3 text-success">
          <p className="font-semibold">{t('successTitle')}</p>
          <ul className="mt-1 text-sm">
            {state.characters > 0 && <li>{t('successCharacters', { count: state.characters })}</li>}
            {state.mounts !== null && <li>{t('successMounts', { count: state.mounts })}</li>}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2">
          {state.characters > 0 && (
            <ButtonLink href="/characters" variant="secondary" size="sm">
              {t('seeCharacters')}
            </ButtonLink>
          )}
          {state.mounts !== null && (
            <ButtonLink href="/mounts" variant="secondary" size="sm">
              {t('seeMounts')}
            </ButtonLink>
          )}
          <Button variant="ghost" size="sm" onClick={() => setState({ step: 'idle' })}>
            {t('importAnother')}
          </Button>
        </div>
      </div>
    );
  }

  const error = state.error ? (
    <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      {t(`errors.${state.error}`)}
    </p>
  ) : null;

  if (state.step === 'preview') {
    const p = state.preview;
    const canCharacters = p.characters.length > 0 && p.region !== null;
    return (
      <div className="flex flex-col gap-4" aria-busy={pending}>
        <h3 className="font-display text-lg text-primary">{t('previewTitle')}</h3>
        <div className="flex flex-wrap gap-2">
          <DataStateBadge state="ok" label={t('previewAddon', { version: p.addonVersion })} />
          {p.observedAt && (
            <DataStateBadge
              state="ok"
              label={t('previewObserved', {
                when: format.dateTime(new Date(p.observedAt), { dateStyle: 'medium', timeStyle: 'short' }),
              })}
            />
          )}
          <DataStateBadge
            state={p.region ? 'ok' : 'unknown'}
            label={p.region ? t('previewRegion', { region: tr(p.region) }) : t('previewNoRegion')}
          />
        </div>

        {p.alreadyImported && (
          <p className="rounded-sm border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            {t('alreadyImported')}
          </p>
        )}

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            {t('categoriesLegend')}
          </legend>
          <label
            className={cn(
              'flex items-start gap-3 rounded-sm border border-border bg-background/40 p-3',
              !canCharacters && 'opacity-60',
            )}
          >
            <input
              type="checkbox"
              className="mt-1 size-4 accent-primary"
              checked={categories.has('characters')}
              disabled={!canCharacters}
              onChange={(e) => toggle('characters', e.target.checked)}
            />
            <span className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">{t('categoryCharacters')}</span>
              <span className="text-sm text-muted-foreground">
                {t('previewCharacters', { count: p.characters.length })}
              </span>
              {p.characters.map((c) => (
                <span key={c.name + c.realm} className="text-sm text-foreground">
                  {[c.name, c.level ? t('level', { level: c.level }) : null, c.className, c.realm]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              ))}
              {p.characters.length > 0 && !p.region && (
                <span className="text-sm text-warning">{t('errors.no_region')}</span>
              )}
            </span>
          </label>
          <label
            className={cn(
              'flex items-start gap-3 rounded-sm border border-border bg-background/40 p-3',
              p.mountsCount === null && 'opacity-60',
            )}
          >
            <input
              type="checkbox"
              className="mt-1 size-4 accent-primary"
              checked={categories.has('mounts')}
              disabled={p.mountsCount === null}
              onChange={(e) => toggle('mounts', e.target.checked)}
            />
            <span className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">{t('categoryMounts')}</span>
              <span className="text-sm text-muted-foreground">
                {p.mountsCount === null ? t('previewMountsUnknown') : t('previewMounts', { count: p.mountsCount })}
              </span>
            </span>
          </label>
        </fieldset>

        <p className="text-xs text-muted-foreground">{t('replaceNote')}</p>
        {error}
        <div className="flex flex-wrap gap-2">
          <Button onClick={confirm} disabled={pending || categories.size === 0}>
            {pending ? t('importing') : t('confirm')}
          </Button>
          <Button variant="ghost" onClick={() => setState({ step: 'idle' })} disabled={pending}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed p-6 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
          dragging ? 'border-primary bg-primary/10' : 'border-border-strong bg-background/40 hover:border-primary',
        )}
      >
        <FileUp aria-hidden className="size-8 text-primary" />
        <span className="font-semibold text-foreground">{pending ? t('reading') : t('chooseFile')}</span>
        <span className="text-sm text-muted-foreground">{t('dropHint')}</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".lua"
          className="sr-only"
          disabled={pending || !hydrated}
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </label>
      {error}
    </div>
  );
}

/** Exclusão em dois passos dos dados que vieram do addon. */
export function DeleteAddonData() {
  const t = useTranslations('Import');
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="danger" size="sm" className="self-start" onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden className="size-4" />
        {t('delete')}
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap gap-2" aria-busy={pending}>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteAddonDataAction();
            setConfirming(false);
          })
        }
      >
        {pending ? t('deleting') : t('deleteConfirm')}
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
        {t('deleteCancel')}
      </Button>
    </div>
  );
}
