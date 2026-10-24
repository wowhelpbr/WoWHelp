'use client';

import { useSyncExternalStore } from 'react';
import { CONSENT_COOKIE, CONSENT_EVENT, type ConsentChoice } from './config';

/** Escolha de cookies guardada no navegador (null = ainda não escolheu). */
export function readConsent(): ConsentChoice | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(all|essential)(?:;|$)`));
  return (match?.[1] as ConsentChoice | undefined) ?? null;
}

export function saveConsent(choice: ConsentChoice | null) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    choice === null
      ? `${CONSENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`
      : `${CONSENT_COOKIE}=${choice}; Max-Age=${180 * 86_400}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

/** undefined = ainda carregando (servidor); null = sem escolha; ou a escolha. */
export function useConsent(): ConsentChoice | null | undefined {
  return useSyncExternalStore(subscribe, readConsent, () => undefined);
}
