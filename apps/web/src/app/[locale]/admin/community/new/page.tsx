import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { requireAdmin } from '@/features/admin/session';
import { CreatorForm } from '@/features/community/creator-form';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Admin.community');
  return { title: t('new'), robots: { index: false, follow: false } };
}

export default function NewCreatorPage({ searchParams }: PageProps<'/[locale]/admin/community/new'>) {
  return (
    <Container className="py-8 sm:py-10">
      <Suspense fallback={<div className="frame h-96 animate-pulse" aria-hidden />}>
        <NewCreator searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function NewCreator({
  searchParams,
}: {
  searchParams: PageProps<'/[locale]/admin/community/new'>['searchParams'];
}) {
  await requireAdmin();
  const [sp, t] = await Promise.all([searchParams, getTranslations('Admin.community')]);
  const name = typeof sp.name === 'string' ? sp.name.slice(0, 60) : '';
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/community" className="text-sm text-muted-foreground hover:text-foreground">
        {t('backToList')}
      </Link>
      <h1 className="text-4xl text-foreground">{t('new')}</h1>
      <section className="frame p-5">
        <CreatorForm creator={null} prefill={{ name }} />
      </section>
    </div>
  );
}
