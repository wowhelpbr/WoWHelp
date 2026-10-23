import 'server-only';
import { normalizeCreatureDisplayMedia } from '@wowhelp/shared';
import sharp from 'sharp';
import { BlizzardError, fetchGameData, fetchRenderImage, isTestMediaUrl } from '@/lib/blizzard/client';
import { createAdminClient } from '@/lib/supabase/admin';

// Imagens oficiais das montarias (documento de mídia creature-display, asset
// "zoom"). A Blizzard recomenda guardar cópia própria: baixamos, convertemos
// para WebP e guardamos no Storage. Renovação a cada 7 dias, bem antes do
// limite de 30 dias dos termos da API.

export const MEDIA_BUCKET = 'catalog-media';
const REFRESH_AFTER_DAYS = 7;
const CONCURRENCY = 4;
const WIDTH = 640;

export interface MediaSyncResult {
  processed: number;
  missing: number;
  failed: number;
  remaining: number;
  removed: number;
}

type Row = { id: string; external_item_id: string; creature_display_id: number | null; media_path: string | null };

async function toWebp(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: 4096 * 4096 })
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

/** Arquivos do bucket cuja montaria saiu do catálogo ou ficou sem imagem (limite de 30 dias). */
async function removeOrphans(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const stored: string[] = [];
  for (let offset = 0; offset < 20_000; offset += 1000) {
    const { data, error } = await admin.storage.from(MEDIA_BUCKET).list('mounts', { limit: 1000, offset });
    if (error) throw error;
    stored.push(...(data ?? []).map((f) => `mounts/${f.name}`));
    if (!data || data.length < 1000) break;
  }
  if (stored.length === 0) return 0;

  const inUse = new Set<string>();
  for (let from = 0; from < 20_000; from += 1000) {
    const { data, error } = await admin
      .from('collectibles')
      .select('media_path')
      .eq('kind', 'mount')
      .not('media_path', 'is', null)
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    for (const r of data ?? []) inUse.add(r.media_path as string);
    if (!data || data.length < 1000) break;
  }
  const orphans = stored.filter((p) => !inUse.has(p));
  for (let i = 0; i < orphans.length; i += 100) {
    const { error } = await admin.storage.from(MEDIA_BUCKET).remove(orphans.slice(i, i + 100));
    if (error) throw error;
  }
  return orphans.length;
}

export async function syncMountMedia(batchSize: number): Promise<MediaSyncResult> {
  const admin = createAdminClient();
  const staleBefore = new Date(Date.now() - REFRESH_AFTER_DAYS * 86_400_000).toISOString();

  const pendingQuery = () =>
    admin
      .from('collectibles')
      .select('id, external_item_id, creature_display_id, media_path', { count: 'exact' })
      .eq('kind', 'mount')
      .eq('source', 'blizzard_api')
      .or(`media_fetched_at.is.null,media_fetched_at.lt.${staleBefore}`);

  const { data, count, error } = await pendingQuery()
    .order('media_fetched_at', { ascending: true, nullsFirst: true })
    .limit(batchSize);
  if (error) throw error;
  const batch = (data ?? []) as Row[];

  let missing = 0;
  let failed = 0;
  const now = new Date().toISOString();
  const mark = (row: Row, fields: { media_path: string | null; media_status: 'ok' | 'missing' | null }) =>
    admin
      .from('collectibles')
      .update({ ...fields, media_fetched_at: now })
      .eq('id', row.id);

  for (let i = 0; i < batch.length; i += CONCURRENCY) {
    await Promise.all(
      batch.slice(i, i + CONCURRENCY).map(async (row) => {
        try {
          const url =
            row.creature_display_id === null
              ? null
              : normalizeCreatureDisplayMedia(
                  await fetchGameData('us', `/media/creature-display/${row.creature_display_id}`),
                  isTestMediaUrl,
                );
          if (!url) {
            missing++;
            await mark(row, { media_path: null, media_status: 'missing' });
            return;
          }
          const webp = await toWebp(await fetchRenderImage(url));
          const path = `mounts/${row.external_item_id}.webp`;
          const { error: upError } = await admin.storage
            .from(MEDIA_BUCKET)
            .upload(path, webp, { contentType: 'image/webp', upsert: true, cacheControl: '86400' });
          if (upError) throw upError;
          const { error: rowError } = await mark(row, { media_path: path, media_status: 'ok' });
          if (rowError) throw rowError;
        } catch (e) {
          if (e instanceof BlizzardError && e.code === 'not_found') {
            missing++;
            await mark(row, { media_path: null, media_status: 'missing' });
            return;
          }
          failed++;
        }
      }),
    );
  }

  const remaining = Math.max(0, (count ?? 0) - batch.length + failed);
  // Limpeza só quando não há mais nada para baixar (uma vez por ciclo).
  const removed = remaining === 0 ? await removeOrphans(admin) : 0;
  return { processed: batch.length - failed - missing, missing, failed, remaining, removed };
}
