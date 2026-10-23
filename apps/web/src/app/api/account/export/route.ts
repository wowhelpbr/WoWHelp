import { NextResponse } from 'next/server';
import { buildAccountExport } from '@/features/account/export';
import { getCurrentUser } from '@/features/auth/session';
import { logEvent } from '@/lib/log';

// Download dos dados da conta logada. Sem sessão, 401; nunca vai para cache.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const payload = await buildAccountExport();
  if (!payload || payload.account.id !== user.id) {
    return NextResponse.json({ error: 'export_failed' }, { status: 500 });
  }

  logEvent('account_exported');
  const day = payload.exportedAt.slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="wowhelp-dados-${day}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
