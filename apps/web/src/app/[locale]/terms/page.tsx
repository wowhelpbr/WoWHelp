import type { Locale } from '@wowhelp/shared';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { LEGAL } from '@/features/legal/content';
import { LegalPage } from '@/features/legal/legal-page';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  return { title: LEGAL.terms[locale].title };
}

export default async function TermsPage() {
  const locale = (await getLocale()) as Locale;
  return <LegalPage kind="terms" locale={locale} />;
}
