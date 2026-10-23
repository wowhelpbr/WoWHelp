import { uuidSchema } from '@wowhelp/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { requireAdmin } from '@/features/admin/session';
import { deleteCreatorAction } from '@/features/community/actions';
import { CreatorForm } from '@/features/community/creator-form';
import { getCreatorForEdit } from '@/features/community/queries';
import { Link } from '@/i18n/navigation';
import { buttonClasses } from '@/components/ui/button';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Admin.community');
  return { title: t('edit'), robots: { index: false, follow: false } };
}

export default function EditCreatorPage({ params, searchParams }: PageProps<'/[locale]/admin/community/[id]'>) {
  return (
    <Container className="py-8 sm:py-10">
      <Suspense fallback={<div className="frame h-96 animate-pulse" aria-hidden />}>
        <EditCreator params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function EditCreator({
  params,
  searchParams,
}: {
  params: PageProps<'/[locale]/admin/community/[id]'>['params'];
  searchParams: PageProps<'/[locale]/admin/community/[id]'>['searchParams'];
}) {
  await requireAdmin();
  const [{ id }, sp, t, locale] = await Promise.all([
    params,
    searchParams,
    getTranslations('Admin.community'),
    getLocale(),
  ]);
  if (!uuidSchema.safeParse(id).success) notFound();
  const creator = await getCreatorForEdit(id);
  if (!creator) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/community" className="text-sm text-muted-foreground hover:text-foreground">
        {t('backToList')}
      </Link>
      <h1 className="text-4xl text-foreground">{creator.name}</h1>
      {sp.saved === '1' && (
        <p role="status" className="text-sm text-success">
          {t('created')}
        </p>
      )}
      <section className="frame p-5">
        <CreatorForm creator={creator} />
      </section>
      <form action={deleteCreatorAction} className="flex flex-col gap-2 border-t border-border pt-5">
        <input type="hidden" name="id" value={creator.id} />
        <input type="hidden" name="locale" value={locale} />
        <p className="text-sm text-muted-foreground">{t('deleteHint')}</p>
        <button type="submit" className={buttonClasses('danger', 'sm', 'self-start')}>
          {t('delete')}
        </button>
      </form>
    </div>
  );
}
