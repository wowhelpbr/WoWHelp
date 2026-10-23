import { useTranslations } from 'next-intl';
import { ButtonLink } from '@/components/ui/button';
import { ClassArt } from '@/components/brand/class-art';
import { Container } from '@/components/ui/container';

export default function NotFound() {
  const t = useTranslations('NotFound');
  return (
    <Container className="grid min-h-[70svh] items-center gap-8 py-12 lg:grid-cols-2">
      <div className="flex max-w-md flex-col items-start gap-4">
        <span className="quest-mark" aria-hidden>
          ?
        </span>
        <h1 className="text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('body')}</p>
        <ButtonLink href="/">{t('back')}</ButtonLink>
      </div>
      <div className="mx-auto w-56 sm:w-80 lg:order-first lg:w-full lg:max-w-xl">
        <ClassArt name="monk" sizes="(min-width: 1024px) 576px, (min-width: 640px) 320px, 224px" />
      </div>
    </Container>
  );
}
