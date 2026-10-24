'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ADSENSE_CLIENT, AD_SLOTS, type AdPlacement } from './config';
import { saveConsent, useConsent } from './consent';

type AdsQueue = unknown[] & { requestNonPersonalizedAds?: number };
type AdsWindow = Window & { adsbygoogle?: AdsQueue };

/** Fila do AdSense (o script lê o que for empurrado antes ou depois de carregar). */
function adsQueue(): AdsQueue {
  const w = window as AdsWindow;
  w.adsbygoogle ??= [] as AdsQueue;
  return w.adsbygoogle;
}

/**
 * Carrega o AdSense uma vez, só depois da escolha de cookies. "Só o
 * necessário" pede anúncios não personalizados.
 */
export function AdsLoader() {
  const consent = useConsent();
  useEffect(() => {
    if (!ADSENSE_CLIENT || !consent || document.getElementById('adsense-script')) return;
    if (consent === 'essential') adsQueue().requestNonPersonalizedAds = 1;
    const script = document.createElement('script');
    script.id = 'adsense-script';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    document.head.appendChild(script);
  }, [consent]);
  return null;
}

/** Um bloco de anúncio, sempre identificado como "Publicidade". */
export function AdSlot({ placement, className }: { placement: AdPlacement; className?: string }) {
  const t = useTranslations('Ads');
  const consent = useConsent();
  const slot = AD_SLOTS[placement];
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !slot || !consent || !ref.current || ref.current.dataset.pushed) return;
    ref.current.dataset.pushed = '1';
    adsQueue().push({});
  }, [consent, slot]);

  if (!ADSENSE_CLIENT || !slot || !consent) return null;
  return (
    <aside aria-label={t('label')} className={className}>
      <p className="mb-1 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">{t('label')}</p>
      <ins
        ref={ref}
        className="adsbygoogle block min-h-[90px] w-full"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

/** Aviso de cookies (LGPD). Só aparece se os anúncios estiverem ligados. */
export function ConsentBanner() {
  const t = useTranslations('Ads');
  const consent = useConsent();
  if (!ADSENSE_CLIENT || consent !== null) return null;
  return (
    <section
      aria-label={t('bannerTitle')}
      className="frame fixed inset-x-3 bottom-20 z-50 flex flex-col gap-3 p-4 shadow-[0_20px_50px_rgb(0_0_0/0.5)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md md:bottom-6"
    >
      <h2 className="font-display text-lg text-foreground">{t('bannerTitle')}</h2>
      <p className="text-sm text-muted-foreground">
        {t('bannerBody')}{' '}
        <Link href="/privacy" className="text-neon underline underline-offset-2">
          {t('privacyLink')}
        </Link>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => saveConsent('all')}>
          {t('acceptAll')}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => saveConsent('essential')}>
          {t('essentialOnly')}
        </Button>
      </div>
    </section>
  );
}

/** Link do rodapé para mudar a escolha de cookies. */
export function ConsentReopen({ className }: { className?: string }) {
  const t = useTranslations('Ads');
  if (!ADSENSE_CLIENT) return null;
  return (
    <button type="button" onClick={() => saveConsent(null)} className={className}>
      {t('preferences')}
    </button>
  );
}
