'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { getAdminUser } from '@/features/admin/session';
import { createAdminClient } from '@/lib/supabase/admin';

export type GuideFormState =
  | { status: 'idle' }
  | { status: 'saved'; intent: 'draft' | 'approve' | 'unpublish'; at: number }
  | { status: 'error'; code: 'forbidden' | 'invalid' | 'chance_needs_source' | 'storage' };

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length > 0 ? v : null));

const schema = z.object({
  kind: z.enum(['mount', 'pet', 'toy']),
  externalId: z.string().regex(/^\d{1,20}$/),
  intent: z.enum(['draft', 'approve', 'unpublish']),
  // Aceita vírgula ("0,5") como no Brasil.
  dropChance: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === '') return null;
      const n = Number(v.replace(',', '.'));
      if (!Number.isFinite(n) || n <= 0 || n > 100) {
        ctx.addIssue({ code: 'custom', message: 'chance' });
        return z.NEVER;
      }
      return Math.round(n * 10_000) / 10_000;
    }),
  chanceNoteEn: text(200),
  chanceNotePt: text(200),
  locationEn: text(300),
  locationPt: text(300),
  howEn: text(2000),
  howPt: text(2000),
  encounterId: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === '') return null;
      if (!/^\d{1,9}$/.test(v) || Number(v) <= 0) {
        ctx.addIssue({ code: 'custom', message: 'encounter' });
        return z.NEVER;
      }
      return Number(v);
    }),
  sourceUrl: z
    .string()
    .trim()
    .max(500)
    .transform((v, ctx) => {
      if (v === '') return null;
      try {
        const url = new URL(v);
        if (url.protocol === 'https:' && !/\s/.test(v)) return url.toString();
      } catch {
        // cai no erro abaixo
      }
      ctx.addIssue({ code: 'custom', message: 'url' });
      return z.NEVER;
    }),
  sourceLabel: text(120),
});

const field = (formData: FormData, name: string) => String(formData.get(name) ?? '');

/** Salva rascunho, publica ou despublica a curadoria de um item. Só administradores. */
export async function saveGuideAction(_prev: GuideFormState, formData: FormData): Promise<GuideFormState> {
  const admin = await getAdminUser();
  if (!admin) return { status: 'error', code: 'forbidden' };

  const parsed = schema.safeParse({
    kind: field(formData, 'kind'),
    externalId: field(formData, 'externalId'),
    intent: field(formData, 'intent'),
    dropChance: field(formData, 'dropChance'),
    chanceNoteEn: field(formData, 'chanceNoteEn'),
    chanceNotePt: field(formData, 'chanceNotePt'),
    locationEn: field(formData, 'locationEn'),
    locationPt: field(formData, 'locationPt'),
    howEn: field(formData, 'howEn'),
    howPt: field(formData, 'howPt'),
    encounterId: field(formData, 'encounterId'),
    sourceUrl: field(formData, 'sourceUrl'),
    sourceLabel: field(formData, 'sourceLabel'),
  });
  if (!parsed.success) return { status: 'error', code: 'invalid' };
  const d = parsed.data;
  if (d.dropChance !== null && d.sourceUrl === null) return { status: 'error', code: 'chance_needs_source' };

  const approve = d.intent === 'approve';
  const { error } = await createAdminClient()
    .from('collectible_guides')
    .upsert(
      {
        kind: d.kind,
        external_item_id: d.externalId,
        drop_chance_percent: d.dropChance,
        chance_note_en: d.chanceNoteEn,
        chance_note_pt: d.chanceNotePt,
        location_en: d.locationEn,
        location_pt: d.locationPt,
        how_en: d.howEn,
        how_pt: d.howPt,
        journal_encounter_id: d.encounterId,
        source_url: d.sourceUrl,
        source_label: d.sourceLabel,
        status: approve ? 'approved' : 'draft',
        reviewed_by: approve ? admin.id : null,
        reviewed_at: approve ? new Date().toISOString() : null,
      },
      { onConflict: 'kind,external_item_id' },
    );
  if (error) return { status: 'error', code: 'storage' };

  revalidateTag('guides', { expire: 0 });
  return { status: 'saved', intent: d.intent, at: Date.now() };
}
