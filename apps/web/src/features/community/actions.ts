'use server';

import {
  CREATOR_PLATFORMS,
  CREATOR_TAGS,
  parseChannel,
  slugify,
  uuidSchema,
  type CreatorPlatform,
} from '@wowhelp/shared';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getAdminUser } from '@/features/admin/session';
import { getCurrentUser } from '@/features/auth/session';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type CreatorFormState =
  | { status: 'idle' }
  | { status: 'saved'; at: number }
  | {
      status: 'error';
      code: 'forbidden' | 'invalid' | 'no_channel' | 'bad_channel' | 'slug_taken' | 'channel_taken' | 'storage';
      platform?: CreatorPlatform;
    };

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length > 0 ? v : null));

const schema = z.object({
  id: z.string().trim(),
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().max(40),
  bioPt: text(400),
  bioEn: text(400),
  status: z.enum(['draft', 'published', 'hidden']),
  featured: z.boolean(),
  featuredNotePt: text(200),
  featuredNoteEn: text(200),
  tags: z.array(z.enum(CREATOR_TAGS)).max(6),
});

const field = (f: FormData, name: string) => String(f.get(name) ?? '');

/** Cria ou edita um criador e os canais dele. Só curador. */
export async function saveCreatorAction(_prev: CreatorFormState, formData: FormData): Promise<CreatorFormState> {
  const admin = await getAdminUser();
  if (!admin) return { status: 'error', code: 'forbidden' };

  const parsed = schema.safeParse({
    id: field(formData, 'id'),
    name: field(formData, 'name'),
    slug: field(formData, 'slug'),
    bioPt: field(formData, 'bioPt'),
    bioEn: field(formData, 'bioEn'),
    status: field(formData, 'status'),
    featured: formData.get('featured') === 'on',
    featuredNotePt: field(formData, 'featuredNotePt'),
    featuredNoteEn: field(formData, 'featuredNoteEn'),
    tags: formData.getAll('tags').map(String),
  });
  if (!parsed.success) return { status: 'error', code: 'invalid' };
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);
  if (slug.length < 2) return { status: 'error', code: 'invalid' };

  const channels = [];
  for (const platform of CREATOR_PLATFORMS) {
    const raw = field(formData, `channel_${platform}`).trim();
    if (!raw) continue;
    const ref = parseChannel(platform, raw);
    if (!ref) return { status: 'error', code: 'bad_channel', platform };
    channels.push(ref);
  }
  if (channels.length === 0) return { status: 'error', code: 'no_channel' };

  const db = createAdminClient();
  const existingId = uuidSchema.safeParse(d.id);
  const row = {
    slug,
    display_name: d.name,
    bio_pt: d.bioPt,
    bio_en: d.bioEn,
    tags: [...new Set(d.tags)],
    status: d.status,
    featured: d.featured,
    featured_note_pt: d.featuredNotePt,
    featured_note_en: d.featuredNoteEn,
  };
  const saved = existingId.success
    ? await db.from('creators').update(row).eq('id', existingId.data).select('id').single()
    : await db
        .from('creators')
        .insert({ ...row, created_by: admin.id })
        .select('id')
        .single();
  if (saved.error || !saved.data) {
    return { status: 'error', code: saved.error?.code === '23505' ? 'slug_taken' : 'storage' };
  }
  const creatorId = saved.data.id as string;

  // Canais: remove os que saíram, atualiza os que ficaram (mantendo o status ao vivo) e cria os novos.
  const { data: current } = await db
    .from('creator_channels')
    .select('id, platform, handle')
    .eq('creator_id', creatorId);
  const keep = new Set(channels.map((c) => c.platform));
  const stale = (current ?? []).filter((c) => !keep.has(c.platform as (typeof CREATOR_PLATFORMS)[number]));
  if (stale.length > 0) {
    await db
      .from('creator_channels')
      .delete()
      .in(
        'id',
        stale.map((c) => c.id),
      );
  }
  for (const ref of channels) {
    const before = (current ?? []).find((c) => c.platform === ref.platform);
    const sameChannel = before && before.handle.toLowerCase() === ref.handle.toLowerCase();
    const { error } = before
      ? await db
          .from('creator_channels')
          .update({
            handle: ref.handle,
            url: ref.url,
            // Canal trocado: zera o que veio da plataforma para a tarefa buscar de novo.
            ...(sameChannel
              ? {}
              : {
                  external_id: ref.externalId,
                  avatar_url: null,
                  is_live: false,
                  checked_at: null,
                  latest_title: null,
                  latest_url: null,
                  latest_thumbnail_url: null,
                  latest_published_at: null,
                }),
          })
          .eq('id', before.id)
      : await db.from('creator_channels').insert({
          creator_id: creatorId,
          platform: ref.platform,
          handle: ref.handle,
          url: ref.url,
          external_id: ref.externalId,
        });
    if (error)
      return { status: 'error', code: error.code === '23505' ? 'channel_taken' : 'storage', platform: ref.platform };
  }

  revalidateTag('community', { expire: 0 });
  if (!existingId.success) {
    const locale = z.enum(routing.locales).safeParse(formData.get('locale'));
    redirect(
      `${LOCALE_PREFIX[locale.success ? locale.data : routing.defaultLocale]}/admin/community/${creatorId}?saved=1`,
    );
  }
  return { status: 'saved', at: Date.now() };
}

/** Apaga um criador da lista (e os canais). Só curador. */
export async function deleteCreatorAction(formData: FormData): Promise<void> {
  const admin = await getAdminUser();
  if (!admin) return;
  const id = uuidSchema.safeParse(formData.get('id'));
  if (!id.success) return;
  await createAdminClient().from('creators').delete().eq('id', id.data);
  revalidateTag('community', { expire: 0 });
  const locale = z.enum(routing.locales).safeParse(formData.get('locale'));
  redirect(`${LOCALE_PREFIX[locale.success ? locale.data : routing.defaultLocale]}/admin/community`);
}

/** Marca um pedido como atendido ou recusado. Só curador. */
export async function setRequestStatusAction(formData: FormData): Promise<void> {
  const admin = await getAdminUser();
  if (!admin) return;
  const id = uuidSchema.safeParse(formData.get('id'));
  const status = z.enum(['approved', 'rejected']).safeParse(formData.get('status'));
  if (!id.success || !status.success) return;
  await createAdminClient().from('creator_requests').update({ status: status.data }).eq('id', id.data);
  const locale = z.enum(routing.locales).safeParse(formData.get('locale'));
  redirect(`${LOCALE_PREFIX[locale.success ? locale.data : routing.defaultLocale]}/admin/community`);
}

export type RequestFormState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; code: 'unauthenticated' | 'invalid' | 'quota' | 'storage' };

/** "Quero ser listado" / "quero sair": pedido de quem está logado; o curador decide. */
export async function submitCreatorRequestAction(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  if (!(await getCurrentUser())) return { status: 'error', code: 'unauthenticated' };
  const parsed = z
    .object({
      kind: z.enum(['join', 'leave']),
      displayName: z.string().trim().min(1).max(60),
      links: z.string().trim().min(8).max(600),
      message: text(1000),
    })
    .safeParse({
      kind: field(formData, 'kind'),
      displayName: field(formData, 'displayName'),
      links: field(formData, 'links'),
      message: field(formData, 'message'),
    });
  if (!parsed.success || !/https?:\/\/|\.(tv|com)\b/i.test(parsed.data.links)) {
    return { status: 'error', code: 'invalid' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('creator_requests').insert({
    kind: parsed.data.kind,
    display_name: parsed.data.displayName,
    links: parsed.data.links,
    message: parsed.data.message,
  });
  if (error) return { status: 'error', code: error.code === 'P0001' ? 'quota' : 'storage' };
  return { status: 'sent' };
}
