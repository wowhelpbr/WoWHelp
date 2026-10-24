import { CircleCheck, Gem, TriangleAlert } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';
import { getAdminUser } from '@/features/admin/session';
import { getCurrentUser } from '@/features/auth/session';
import { LOCALE_PREFIX, type AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { stripeMode } from '@/lib/stripe/client';
import { openPortalAction, startCheckoutAction } from './actions';
import { formatDate, formatPrice, monthsSaved } from './format';
import { getMySupport, getPlanPrices, getSubscriptionsOpen, type MySupport } from './queries';
import { SubmitButton } from './submit-button';
import { SUPPORTER_PLANS } from './subscription';

const STATUSES = ['ok', 'processando', 'cancelado', 'erro'] as const;
type ReturnStatus = (typeof STATUSES)[number];

/** Planos, estado da assinatura e volta do pagamento. Lê a sessão: fica dentro de <Suspense>. */
export async function SupporterPlans({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const returned = STATUSES.find((s) => s === params.status) ?? null;
  const [t, locale, user, admin, support, open, prices] = await Promise.all([
    getTranslations('Supporter'),
    getLocale(),
    getCurrentUser(),
    getAdminUser(),
    getMySupport(),
    getSubscriptionsOpen(),
    getPlanPrices(),
  ]);
  const mode = stripeMode();
  const canBuy = mode !== 'off' && prices !== null && (open || admin !== null);

  return (
    <div className="flex flex-col gap-5">
      {returned && <ReturnNotice status={returned} label={t(`status.${returned}`)} />}

      {support?.active ? (
        <ActiveSupport support={support} locale={locale} />
      ) : (
        <>
          {admin && !open && mode !== 'off' && <Notice tone="warning">{t('closedAdmin')}</Notice>}
          {canBuy && mode === 'test' && <Notice tone="info">{t('testMode')}</Notice>}
          {!canBuy && (
            <Notice tone="info">
              <strong className="text-foreground">{t('soon')}.</strong> {t('soonBody')}
            </Notice>
          )}
          {prices && (
            <ul className="grid gap-4 md:grid-cols-2">
              {SUPPORTER_PLANS.map((plan) => {
                const price = prices[plan];
                const saved = plan === 'yearly' ? monthsSaved(prices.monthly.amount, prices.yearly.amount) : 0;
                return (
                  <li
                    key={plan}
                    className={cn(
                      'frame flex flex-col gap-4 p-5',
                      plan === 'yearly' && 'corner-brackets border-primary/60',
                    )}
                  >
                    <div>
                      <h3 className="font-display text-2xl text-foreground">{t(plan)}</h3>
                      <p className="mt-2">
                        <span className="font-display text-4xl text-primary">
                          {formatPrice(price.amount, price.currency, locale)}
                        </span>{' '}
                        <span className="text-sm text-muted-foreground">
                          {plan === 'monthly' ? t('perMonth') : t('perYear')}
                        </span>
                      </p>
                      {saved > 0 && <p className="mt-1 text-sm text-neon">{t('yearlySaving', { months: saved })}</p>}
                    </div>
                    <div className="mt-auto">
                      {!canBuy ? (
                        <span className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-sm text-muted-foreground uppercase">
                          {t('soon')}
                        </span>
                      ) : user ? (
                        <form action={startCheckoutAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="plan" value={plan} />
                          <SubmitButton
                            pendingLabel={t('opening')}
                            variant={plan === 'yearly' ? 'primary' : 'secondary'}
                            className="w-full"
                          >
                            {plan === 'monthly' ? t('subscribeMonthly') : t('subscribeYearly')}
                          </SubmitButton>
                        </form>
                      ) : (
                        <ButtonLink
                          href={`/login?next=${encodeURIComponent(`${LOCALE_PREFIX[locale as AppLocale]}/supporter`)}`}
                          variant={plan === 'yearly' ? 'primary' : 'secondary'}
                          className="w-full"
                        >
                          {t('signInToSubscribe')}
                        </ButtonLink>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <p className="max-w-3xl text-xs text-muted-foreground">{t('fineprint')}</p>
    </div>
  );
}

async function ActiveSupport({ support, locale }: { support: MySupport; locale: string }) {
  const t = await getTranslations('Supporter');
  return (
    <section aria-labelledby="supporter-active" className="frame corner-brackets flex flex-col gap-3 p-5">
      <h2 id="supporter-active" className="flex items-center gap-2 font-display text-2xl text-primary">
        <Gem aria-hidden className="size-6" />
        {t('activeTitle')}
      </h2>
      <SupportDetails support={support} locale={locale} />
      <ManageForm locale={locale} label={t('manage')} pendingLabel={t('opening')} />
    </section>
  );
}

/** Plano, renovação ou fim, e aviso de cobrança atrasada. */
export async function SupportDetails({ support, locale }: { support: MySupport; locale: string }) {
  const t = await getTranslations('Supporter');
  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      <p>
        {support.plan && t('activePlan', { plan: t(`planNames.${support.plan}`) })}{' '}
        {support.cancelAt
          ? t('ends', { date: formatDate(support.cancelAt, locale) })
          : support.currentPeriodEnd && t('renews', { date: formatDate(support.currentPeriodEnd, locale) })}
      </p>
      {support.status === 'past_due' && <p className="text-warning">{t('pastDue')}</p>}
    </div>
  );
}

export function ManageForm({ locale, label, pendingLabel }: { locale: string; label: string; pendingLabel: string }) {
  return (
    <form action={openPortalAction}>
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton pendingLabel={pendingLabel} variant="secondary">
        {label}
      </SubmitButton>
    </form>
  );
}

function ReturnNotice({ status, label }: { status: ReturnStatus; label: string }) {
  const good = status === 'ok' || status === 'processando';
  return (
    <p
      role={good ? 'status' : 'alert'}
      className={cn(
        'flex items-start gap-2 rounded-sm border px-4 py-3 text-sm',
        good ? 'border-success/40 bg-success/10 text-success' : 'border-danger/40 bg-danger/10 text-danger',
      )}
    >
      {good ? (
        <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
      ) : (
        <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      )}
      {label}
    </p>
  );
}

function Notice({ tone, children }: { tone: 'info' | 'warning'; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        'rounded-sm border px-4 py-3 text-sm',
        tone === 'warning'
          ? 'border-warning/40 bg-warning/10 text-warning'
          : 'border-neon/40 bg-neon/10 text-foreground',
      )}
    >
      {children}
    </p>
  );
}
