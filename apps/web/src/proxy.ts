import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_PREFIX, routing } from './i18n/routing';
import { GATE_COOKIE, gateToken, getGateSettings, isMonitor, sameText } from './lib/site-gate';
import { refreshSession } from './lib/supabase/proxy';

const handleI18nRouting = createMiddleware(routing);

// Checagem otimista: visitantes vão para o login antes de renderizar.
// A checagem real acontece de novo na página e em cada Server Action.
const PROTECTED_PATHS = ['/dashboard', '/characters', '/planner', '/import', '/settings', '/admin'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const prefix = Object.values(LOCALE_PREFIX).find((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Site fechado com senha (fase de testes): sem o cookie certo, vai para a página da senha.
  const gate = prefix && pathname !== `${prefix}/gate` ? await getGateSettings() : null;
  if (gate?.private && gate.passwordHash && !isMonitor(request.headers.get('authorization'))) {
    const cookie = request.cookies.get(GATE_COOKIE)?.value ?? '';
    if (!sameText(cookie, await gateToken(gate.passwordHash))) {
      const url = request.nextUrl.clone();
      url.pathname = `${prefix}/gate`;
      url.search = `?next=${encodeURIComponent(`${pathname}${request.nextUrl.search}`)}`;
      return NextResponse.redirect(url);
    }
  }

  const session = await refreshSession(request);
  if (prefix && !session.userId) {
    const rest = pathname.slice(prefix.length) || '/';
    if (PROTECTED_PATHS.some((p) => rest === p || rest.startsWith(`${p}/`))) {
      const url = request.nextUrl.clone();
      url.pathname = `${prefix}/login`;
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return session.applyTo(NextResponse.redirect(url));
    }
  }

  return session.applyTo(handleI18nRouting(request));
}

export const config = {
  // Tudo, menos API, arquivos internos do Next e arquivos com extensão (ícones, sw.js, manifest).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
