import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { DataStateBadge } from '@/components/ui/data-state';
import { requireAdmin } from '@/features/admin/session';
import { SubscriptionsForm } from '@/features/admin/subscriptions-form';
import { formatDate, formatPrice } from '@/features/billing/format';
import { getPlanPrices, getSubscriptionsOpen } from '@/features/billing/queries';
import { isSupporter } from '@/features/billing/subscription';
import { Link } from '@/i18n/navigation';
import { stripeMode } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Admin.supporters');
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default function AdminSupportersPage() {
  return (
    <Container className="py-8 sm:py-10">
      <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
        <AdminSupporters />
      </Suspense>
    </Container>
  );
}

const STATUS_KEYS = [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
] as const;

async function AdminSupporters() {
  await requireAdmin();
  const db = createAdminClient();
  const [t, ts, locale, open, prices, { data: rows }] = await Promise.all([
    getTranslations('Admin.supporters'),
    getTranslations('Supporter'),
    getLocale(),
    getSubscriptionsOpen(),
    getPlanPrices(),
    db
      .from('supporter_subscriptions')
      .select('id, user_id, status, plan, current_period_end, cancel_at')
      .order('updated_at', { ascending: false })
      .limit(25),
  ]);
  const mode = stripeMode();
  const list = rows ?? [];
  const { count } = await db
    .from('supporter_subscriptions')
    .select('id', { count: 'exact', head: true })
    .in('status', ['active', 'trialing', 'past_due']);
  // E-mail só para o administrador reconhecer a conta (nunca vai para log).
  const emails = new Map(
    await Promise.all(
      [...new Set(list.map((r) => r.user_id as string))].map(
        async (id) => [id, (await db.auth.admin.getUserById(id)).data.user?.email ?? '—'] as const,
      ),
    ),
  );

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <header>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          {t('back')}
        </Link>
        <h1 className="mt-2 text-4xl text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('intro')}</p>
      </header>

      <section className="frame corner-brackets flex flex-col gap-4 p-5">
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <DataStateBadge
              state={mode === 'live' ? 'ok' : mode === 'test' ? 'stale' : 'not_available'}
              label={t(`mode.${mode}`)}
            />
          </li>
          <li>
            <DataStateBadge
              state={process.env.STRIPE_WEBHOOK_SECRET ? 'ok' : 'not_available'}
              label={process.env.STRIPE_WEBHOOK_SECRET ? t('webhookOk') : t('webhookMissing')}
            />
          </li>
          <li>
            <DataStateBadge
              state={prices ? 'ok' : 'not_available'}
              label={
                prices
                  ? t('pricesOk', {
                      monthly: formatPrice(prices.monthly.amount, prices.monthly.currency, locale),
                      yearly: formatPrice(prices.yearly.amount, prices.yearly.currency, locale),
                    })
                  : t('pricesMissing')
              }
            />
          </li>
        </ul>
        <SubscriptionsForm isOpen={open} testMode={mode === 'test'} />
      </section>

      <section aria-labelledby="supporters-list" className="frame flex flex-col gap-3 p-5">
        <h2 id="supporters-list" className="font-display text-xl text-foreground">
          {t('listTitle')}
        </h2>
        <p className="text-primary">{t('activeCount', { count: count ?? 0 })}</p>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="py-2 pr-4 font-normal">{t('account')}</th>
                  <th className="py-2 pr-4 font-normal">{t('plan')}</th>
                  <th className="py-2 pr-4 font-normal">{t('status')}</th>
                  <th className="py-2 font-normal">{t('until')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => {
                  const status = STATUS_KEYS.find((s) => s === row.status);
                  const until = (row.cancel_at ?? row.current_period_end) as string | null;
                  return (
                    <tr key={row.id as string} className="border-t border-border/60">
                      <td className="py-2 pr-4 text-foreground">{emails.get(row.user_id as string)}</td>
                      <td className="py-2 pr-4">
                        {row.plan ? ts(`planNames.${row.plan as 'monthly' | 'yearly'}`) : '—'}
                      </td>
                      <td className={isSupporter(row) ? 'py-2 pr-4 text-success' : 'py-2 pr-4 text-muted-foreground'}>
                        {status ? t(`statusNames.${status}`) : String(row.status)}
                      </td>
                      <td className="py-2">{until ? formatDate(until, locale) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
