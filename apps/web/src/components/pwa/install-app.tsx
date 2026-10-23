'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallState = 'checking' | 'available' | 'ios' | 'installed' | 'unsupported';

/**
 * Instalação do PWA. Chromium oferece o evento beforeinstallprompt; o Safari
 * do iOS não, então mostramos o caminho manual (Compartilhar > Tela de Início).
 */
export function InstallApp() {
  const t = useTranslations('Settings');
  const [state, setState] = useState<InstallState>('checking');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setState('available');
    };
    const onInstalled = () => setState('installed');
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const initial = setTimeout(() => {
      setState((current) =>
        current !== 'checking' ? current : standalone ? 'installed' : ios ? 'ios' : 'unsupported',
      );
    }, 0);

    return () => {
      clearTimeout(initial);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (state === 'checking') return null;
  if (state === 'installed') return <p className="text-sm text-success">{t('installDone')}</p>;
  if (state === 'ios') return <p className="text-sm text-muted-foreground">{t('installIos')}</p>;
  if (state === 'unsupported') return <p className="text-sm text-muted-foreground">{t('installUnsupported')}</p>;

  return (
    <Button
      variant="secondary"
      onClick={async () => {
        if (!deferred) return;
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        setDeferred(null);
        setState(outcome === 'accepted' ? 'installed' : 'available');
      }}
    >
      <Download aria-hidden className="size-4" />
      {t('installButton')}
    </Button>
  );
}
