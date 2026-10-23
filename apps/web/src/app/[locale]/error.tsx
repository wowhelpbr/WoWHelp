'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('Error');
  return (
    <Container className="flex justify-center py-16">
      <div role="alert" className="flex max-w-md flex-col items-start gap-3">
        <h1 className="text-3xl text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('body')}</p>
        <Button onClick={() => reset()}>{t('retry')}</Button>
      </div>
    </Container>
  );
}
