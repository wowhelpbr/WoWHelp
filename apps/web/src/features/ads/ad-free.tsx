'use client';

import { useEffect, useSyncExternalStore } from 'react';

// Apoiador não vê anúncio. O servidor decide (lê a assinatura) e avisa aqui;
// até a decisão chegar, nenhum anúncio nem aviso de cookies aparece.

type Decision = 'pending' | 'on' | 'off';
let decision: Decision = 'pending';
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** true só depois que o servidor confirmou que esta visita mostra anúncios. */
export function useAdsAllowed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => decision === 'on',
    () => false,
  );
}

export function AdsDecision({ allowed }: { allowed: boolean }) {
  useEffect(() => {
    decision = allowed ? 'on' : 'off';
    document.documentElement.dataset.ads = decision;
    listeners.forEach((notify) => notify());
  }, [allowed]);
  return null;
}
