import { LogOut, UserRound } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';
import { signOutAction } from '@/features/auth/actions';
import { getCurrentUser } from '@/features/auth/session';
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
        <ButtonLink href="/login" variant="ghost" size="sm">
          {t('signIn')}
        </ButtonLink>
        <ButtonLink href="/signup" size="sm" className="max-sm:hidden">
          {t('signUp')}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/settings"
        className="hidden min-h-10 items-center gap-2 rounded-sm px-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground md:inline-flex"
      >
        <UserRound aria-hidden className="size-4" />
        {t('account')}
      </Link>
      <form action={signOutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-sm px-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <LogOut aria-hidden className="size-4" />
          <span className="hidden sm:inline">{t('signOut')}</span>
          <span className="sr-only sm:hidden">{t('signOut')}</span>
        </button>
      </form>
    </div>
  );
}

export function AccountSlotFallback() {
  return <span className="inline-block h-9 w-24 rounded-sm bg-white/5" aria-hidden />;
}
