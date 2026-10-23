import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { syncOfficialCollection } from '@/features/catalog/collection-sync';
import { syncCatalogMedia } from '@/features/catalog/media-sync';
import { syncOfficialMounts } from '@/features/catalog/sync';
import { isBattlenetConfigured } from '@/lib/blizzard/client';
import { isAdminConfigured } from '@/lib/supabase/admin';

// Tarefa agendada: importa/renova um lote do catálogo oficial
// (?kind=mount|pet|toy, padrão mount; ?job=media: um lote das imagens oficiais, guardadas no Storage).
// Chamada pelo GitHub Actions (.github/workflows/catalogo.yml) com o CRON_SECRET.
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET ?? '';
  const header = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (secret.length < 16 || header.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

async function handle(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isBattlenetConfigured() || !isAdminConfigured()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }
  const media = request.nextUrl.searchParams.get('job') === 'media';
  const kindParam = request.nextUrl.searchParams.get('kind') ?? 'mount';
  if (kindParam !== 'mount' && kindParam !== 'pet' && kindParam !== 'toy') {
    return NextResponse.json({ error: 'invalid_kind' }, { status: 400 });
  }
  const kind = kindParam;
  const fallback = media ? 40 : 120;
  const requested = Number(request.nextUrl.searchParams.get('batch') ?? fallback);
  const batch = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), media ? 120 : 300) : fallback;
  try {
    const result = media
      ? await syncCatalogMedia(kind, batch)
      : kind === 'mount'
        ? await syncOfficialMounts(batch)
        : await syncOfficialCollection(kind, batch);
    // Lista nova aparece já na próxima visita (o catálogo fica em cache por 1 h).
    if (result.processed > 0 || ('missing' in result && result.missing > 0)) revalidateTag('catalog', { expire: 0 });
    return NextResponse.json(result);
  } catch (e) {
    // Só código e mensagem curta (erros do Supabase não são instâncias de Error); nunca segredos.
    const info =
      e instanceof Error
        ? { message: e.message }
        : typeof e === 'object' && e !== null
          ? {
              code: (e as { code?: unknown }).code,
              message: String((e as { message?: unknown }).message ?? '').slice(0, 200),
            }
          : { message: 'desconhecido' };
    console.error('catalog-sync falhou', JSON.stringify(info));
    return NextResponse.json({ error: 'sync_failed' }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
