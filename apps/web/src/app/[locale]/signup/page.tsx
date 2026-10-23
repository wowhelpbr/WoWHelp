import { focusAreasSchema } from '@wowhelp/shared';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { StateNotice } from '@/components/ui/data-state';
import { AuthLayout } from '@/features/auth/auth-layout';
import { SignUpForm } from '@/features/auth/auth-forms';
import { Link } from '@/i18n/navigation';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth');
  return { title: t('signUpTitle'), robots: { index: false } };
}

/** Escolhas feitas na home (?focus=...). O formulário em si fica no shell estático. */
async function FocusFields({ searchParams }: { searchParams: PageProps<'/[locale]/signup'>['searchParams'] }) {
  const { focus } = await searchParams;
  const parsed = focusAreasSchema.safeParse(typeof focus === 'string' ? focus.split(',').filter(Boolean) : []);
  const areas = parsed.success ? parsed.data : [];
  if (areas.length === 0) return null;
  const [t, tf] = await Promise.all([getTranslations('Auth'), getTranslations('Focus')]);
  return (
    <>
      <input type="hidden" name="focus" value={areas.join(',')} />
      <p className="rounded-sm border border-primary/40 bg-primary/[0.07] px-3 py-2 text-sm text-foreground">
        {t('focusCarried', { areas: areas.map((area) => tf(`${area}.title`)).join(', ') })}
      </p>
    </>
  );
}

export default function SignUpPage({ searchParams }: PageProps<'/[locale]/signup'>) {
  const t = useTranslations('Auth');
  return (
    <AuthLayout>
      <h1 className="text-4xl text-foreground">{t('signUpTitle')}</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">{t('signUpIntro')}</p>
      {isSupabaseConfigured() ? (
        <SignUpForm
          extraFields={
            <Suspense fallback={null}>
              <FocusFields searchParams={searchParams} />
            </Suspense>
          }
        />
      ) : (
        <StateNotice state="not_available" title={t('notConfigured')} />
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        {t('haveAccount')}{' '}
        <Link href="/login" className="text-neon underline-offset-4 hover:underline">
          {t('submitSignIn')}
        </Link>
      </p>
    </AuthLayout>
  );
}
