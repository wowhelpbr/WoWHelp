import type { Locale } from '@wowhelp/shared';
import { connection } from 'next/server';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';
import { getCurrentUser } from '@/features/auth/session';
import { getCatalog } from '@/features/catalog/queries';
import type { CatalogKind } from '@/features/catalog/kinds';
import { LatestCard, LiveCard } from '@/features/community/live-card';
import { liveTracking } from '@/features/community/live-config';
import { getPublishedCreators } from '@/features/community/queries';
import { ContinueButton } from '@/features/onboarding/focus-picker';

/** Quantos itens cada catálogo mostra (os escondidos até coletar ficam de fora). Cache de horas. */
export async function getCatalogCounts(locale: Locale): Promise<Record<CatalogKind, number> | null> {
  const results = await Promise.all((['mount', 'pet', 'toy'] as const).map((kind) => getCatalog(kind, locale)));
  if (results.some((r) => r.status !== 'ok')) return null;
  const [mount, pet, toy] = results.map((r) =>
    r.status === 'ok' ? r.items.filter((i) => !i.hiddenUntilCollected).length : 0,
  );
  return { mount: mount!, pet: pet!, toy: toy! };
}

/** Botão do herói conforme a sessão (fica dentro de <Suspense>). */
export async function HomeCta({ compact = false }: { compact?: boolean }) {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations('Home')]);
  return <ContinueButton label={user ? t('continueSignedIn') : t('ctaVisitor')} compact={compact} />;
}

/** Comunidade BR no início: quem está ao vivo ou, sem ninguém ao vivo, os vídeos mais novos. */
export async function HomeLive() {
  await connection();
  const [creators, t, format] = await Promise.all([getPublishedCreators(), getTranslations('Home'), getFormatter()]);
  if (!creators?.length) return null;

  // Sem as chaves das plataformas, o "ao vivo" guardado pode estar velho: mostra só os vídeos.
  const live = (liveTracking().any ? creators : [])
    .flatMap((creator) => creator.channels.filter((c) => c.isLive).map((channel) => ({ creator, channel })))
    .sort((a, b) => (b.channel.liveViewers ?? 0) - (a.channel.liveViewers ?? 0))
    .slice(0, 4);
  const latest = live.length
    ? []
    : creators
        .flatMap((creator) =>
          creator.channels
            .filter((c) => c.latestUrl && c.latestTitle && c.latestPublishedAt)
            .map((channel) => ({ creator, channel })),
        )
        .sort((a, b) => Date.parse(b.channel.latestPublishedAt!) - Date.parse(a.channel.latestPublishedAt!))
        .slice(0, 4);
  if (!live.length && !latest.length) return null;
  const now = new Date();

  return (
    <section aria-labelledby="home-live" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t('communityEyebrow')}</p>
          <h2 id="home-live" className="mt-3 text-3xl text-foreground sm:text-4xl">
            {live.length ? t('liveTitle') : t('latestTitle')}
          </h2>
        </div>
        <ButtonLink href="/community" variant="secondary">
          {t('seeCreators')}
        </ButtonLink>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {live.length
          ? live.map(({ creator, channel }) => <LiveCard key={channel.id} creator={creator} channel={channel} />)
          : latest.map(({ creator, channel }) => (
              <LatestCard
                key={channel.id}
                creator={creator}
                channel={channel}
                when={format.relativeTime(new Date(channel.latestPublishedAt!), now)}
              />
            ))}
      </ul>
    </section>
  );
}

/** Número de montarias no cartão de vidro sobre a ilustração. */
export async function HomeFloatingStat() {
  const locale = (await getLocale()) as Locale;
  const [counts, t] = await Promise.all([getCatalogCounts(locale), getTranslations('Home')]);
  if (!counts?.mount) return null;
  return (
    <div className="glass absolute right-[2%] bottom-[12%] flex items-center gap-3 px-4 py-3">
      <span className="label">{t('floatingLabel')}</span>
      <span className="font-display text-3xl leading-none font-bold text-primary tabular-nums">
        {new Intl.NumberFormat(locale).format(counts.mount)}
      </span>
    </div>
  );
}
