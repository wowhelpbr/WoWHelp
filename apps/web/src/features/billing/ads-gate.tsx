import { AdsDecision } from '@/features/ads/ad-free';
import { getMySupport } from './queries';

/** Lê a sessão: fica dentro de <Suspense> no layout. Apoiador não vê anúncio. */
export async function AdsGate() {
  const support = await getMySupport();
  return <AdsDecision allowed={!support?.active} />;
}
