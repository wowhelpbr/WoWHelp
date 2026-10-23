import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { StateNotice } from '@/components/ui/data-state';
import { AuthLayout } from '@/features/auth/auth-layout';
import { SignInForm } from '@/features/auth/auth-forms';
import { Link } from '@/i18n/navigation';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth');
  return { title: t('signInTitle'), robots: { index: false } };
}

/** Só o campo oculto depende da URL; o formulário em si fica no shell estático. */
async function NextField({ searchParams }: { searchParams: PageProps<'/[locale]/login'>['searchParams'] }) {
  const { next } = await searchParams;
  return typeof next === 'string' ? <input type="hidden" name="next" value={next} /> : null;
}

export default function LoginPage({ searchParams }: PageProps<'/[locale]/login'>) {
  const t = useTranslations('Auth');
  return (
    <AuthLayout>
      <h1 className="text-4xl text-foreground">{t('signInTitle')}</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">{t('signInIntro')}</p>
      {isSupabaseConfigured() ? (
        <SignInForm
          extraFields={
            <Suspense fallback={null}>
              <NextField searchParams={searchParams} />
            </Suspense>
          }
        />
      ) : (
        <StateNotice state="not_available" title={t('notConfigured')} />
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link href="/signup" className="text-neon underline-offset-4 hover:underline">
          {t('submitSignUp')}
        </Link>
      </p>
    </AuthLayout>
  );
}
