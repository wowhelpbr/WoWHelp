import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/safe-redirect';
import { GATE_COOKIE, GATE_MAX_AGE, gateToken, getGateSettings, hashPassword, sameText } from '@/lib/site-gate';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Confere a senha do site e devolve o cookie de acesso. */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const prefix = form?.get('prefix') === '/en' ? '/en' : '/pt-br';
  const next = safeNextPath(form?.get('next'), prefix);
  const gate = await getGateSettings();
  if (!gate.private || !gate.passwordHash || !gate.passwordSalt || !gate.passwordIterations) {
    return NextResponse.redirect(new URL(next, request.url), 303);
  }

  const typed = String(form?.get('password') ?? '').slice(0, 200);
  const typedHash = await hashPassword(typed, gate.passwordSalt, gate.passwordIterations);
  if (!sameText(typedHash, gate.passwordHash)) {
    // Atrasa a resposta errada para dificultar tentativa em massa.
    await sleep(800);
    const url = new URL(`${prefix}/gate`, request.url);
    url.searchParams.set('next', next);
    url.searchParams.set('erro', '1');
    return NextResponse.redirect(url, 303);
  }

  const res = NextResponse.redirect(new URL(next, request.url), 303);
  res.cookies.set(GATE_COOKIE, await gateToken(gate.passwordHash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GATE_MAX_AGE,
  });
  return res;
}
