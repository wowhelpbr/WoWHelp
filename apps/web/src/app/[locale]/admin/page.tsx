import { Gift, PawPrint, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { Container } from '@/components/ui/container';
import { requireAdmin } from '@/features/admin/session';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Admin');
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default function AdminPage() {
  return (
    <Container className="py-8 sm:py-10">
      <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
        <AdminHub />
      </Suspense>
    </Container>
  );
}

async function AdminHub() {
  await requireAdmin();
  const t = await getTranslations('Admin');
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 className="mt-2 text-4xl text-foreground">{t('title')}</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{t('intro')}</p>
      </header>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ['/admin/mounts', 'mountsTitle', MountGlyph],
            ['/admin/pets', 'petsTitle', PawPrint],
            ['/admin/toys', 'toysTitle', Gift],
          ] as const
        ).map(([href, key, Icon]) => (
          <li key={href}>
            <Link href={href} className="frame flex h-full items-start gap-4 p-5 hover:border-neon/60">
              <Icon aria-hidden className="size-8 shrink-0 text-primary" />
              <span>
                <span className="block font-display text-xl text-foreground">{t(key)}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{t('mountsBody')}</span>
              </span>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/admin/community" className="frame flex h-full items-start gap-4 p-5 hover:border-neon/60">
            <Users aria-hidden className="size-8 shrink-0 text-primary" />
            <span>
              <span className="block font-display text-xl text-foreground">{t('communityTitle')}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{t('communityBody')}</span>
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
