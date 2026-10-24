import { getLocale, getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { getAdminUser } from '@/features/admin/session';
import { stripeMode } from '@/lib/stripe/client';
import { getMySupport, getSubscriptionsOpen } from './queries';
import { ManageForm, SupportDetails } from './supporter-plans';

/** Painel "Assinatura" nas configurações da conta. */
export async function SupporterPanel() {
  const [t, ts, locale, support, open, admin] = await Promise.all([
    getTranslations('Settings'),
    getTranslations('Supporter'),
    getLocale(),
    getMySupport(),
    getSubscriptionsOpen(),
    getAdminUser(),
  ]);
  // Sem assinatura e sem venda aberta: nada para mostrar.
  if (!support && (stripeMode() === 'off' || (!open && !admin))) return null;

  return (
    <Panel title={t('supporterTitle')} titleId="supporter" className={support?.active ? 'corner-brackets' : undefined}>
      {support?.active ? (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-primary">{ts('activeTitle')}</p>
          <SupportDetails support={support} locale={locale} />
          <ManageForm locale={locale} label={ts('manage')} pendingLabel={ts('opening')} />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{support ? t('supporterEnded') : t('supporterNone')}</p>
          <ButtonLink href="/supporter" variant="secondary" size="sm">
            {t('supporterLink')}
          </ButtonLink>
        </div>
      )}
    </Panel>
  );
}
