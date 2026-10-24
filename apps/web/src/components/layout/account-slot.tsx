import { Gem, LogOut } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';
import { signOutAction } from '@/features/auth/actions';
import { getCurrentUser } from '@/features/auth/session';
import { getMySupport } from '@/features/billing/queries';
import { Link } from '@/i18n/navigation';

/**
 * Lê a sessão, então precisa ficar dentro de <Suspense> (Cache Components).
 * Mostra só uma inicial, nunca o e-mail inteiro, no cabeçalho.
 */
export async function AccountSlot() {
  const [user, t, locale] = await Promise.all([getCurrentUser(), getTranslations('Nav'), getLocale()]);

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <ButtonLink href="/login" variant="secondary" size="sm">
          {t('signIn')}
        </ButtonLink>
        <ButtonLink href="/signup" variant="brand" size="sm" className="max-sm:hidden">
          {t('signUp')}
        </ButtonLink>
      </div>
    );
  }

  const support = await getMySupport();
  return (
    <div className="flex items-center gap-1.5">
      {support?.active && (
        <Link
          href="/supporter"
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm bg-purple/20 px-2.5 font-display text-[0.6875rem] font-bold tracking-[0.08em] text-purple-soft uppercase shadow-[inset_0_0_0_1px_rgb(122_20_248/0.5)] hover:bg-purple/30"
        >
          <Gem aria-hidden className="size-3.5" />
          <span className="max-sm:sr-only">{t('supporterBadge')}</span>
        </Link>
      )}
      {/* Quadrado com a inicial (proposta neon): leva às configurações da conta. */}
      <Link
        href="/settings"
        aria-label={t('account')}
        title={t('account')}
        className="grid size-9 place-items-center rounded-md bg-gradient-to-br from-chip to-card-raised font-display text-sm font-bold text-primary uppercase hover:shadow-[0_0_0_1px_rgb(197_251_20/0.6)]"
      >
        {(user.email ?? '?').slice(0, 1)}
      </Link>
      <form action={signOutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          title={t('signOut')}
          className="grid size-9 place-items-center rounded-md text-faint hover:bg-white/5 hover:text-foreground"
        >
          <LogOut aria-hidden className="size-4" />
          <span className="sr-only">{t('signOut')}</span>
        </button>
      </form>
    </div>
  );
}

export function AccountSlotFallback() {
  return <span className="inline-block h-9 w-24 rounded-sm bg-white/5" aria-hidden />;
}
