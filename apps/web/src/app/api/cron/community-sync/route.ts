import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { liveTracking } from '@/features/community/live-config';
import { syncCommunityLive } from '@/features/community/live-sync';
import { isAdminConfigured } from '@/lib/supabase/admin';

// Tarefa agendada: atualiza "ao vivo agora", fotos e últimos vídeos da
// Comunidade BR. Chamada pelo GitHub Actions (.github/workflows/comunidade.yml).
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
  if (!isAdminConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (!liveTracking().any) return NextResponse.json({ skipped: 'no_platform_keys' });
  try {
    const result = await syncCommunityLive();
    revalidateTag('community', { expire: 0 });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String((e as { message?: unknown })?.message ?? 'desconhecido');
    console.error('community-sync falhou', JSON.stringify({ message: message.slice(0, 200) }));
    return NextResponse.json({ error: 'sync_failed' }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
