import { Download, Shield } from 'lucide-react';
import type { Metadata } from 'next';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AccountSidebar } from '@/components/layout/account-sidebar';
import { Container } from '@/components/ui/container';
import { StateNotice } from '@/components/ui/data-state';
import { Panel } from '@/components/ui/panel';
import { ADDON_DOWNLOAD } from '@/features/addon/download';
import { AddonUploader, DeleteAddonData } from '@/features/addon/import-ui';
import { getMyAddonImports } from '@/features/addon/queries';
import { getCurrentUser } from '@/features/auth/session';
import { redirect } from '@/i18n/navigation';
import { buttonClasses } from '@/components/ui/button';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Import');
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default function ImportPage() {
  return (
    <div className="lg:grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <AccountSidebar />
      <Container className="py-8 sm:py-10">
        <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
          <ImportContent />
        </Suspense>
      </Container>
    </div>
  );
}

function PathBox({ children }: { children: string }) {
  return (
    <code className="block overflow-x-auto rounded-sm border border-border bg-background/70 px-3 py-2 font-mono text-xs break-all text-neon">
      {children}
    </code>
  );
}

async function ImportContent() {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect({ href: '/login?next=/import', locale });

  const [imports, t, format] = await Promise.all([getMyAddonImports(), getTranslations('Import'), getFormatter()]);
  const savedVariablesPath = `World of Warcraft\\_retail_\\WTF\\Account\\${t('accountFolder')}\\SavedVariables\\WoWHelpCompanion.lua`;
  const steps = [
    {
      title: t('step1Title'),
      body: (
        <>
          <p>{t('step1Body')}</p>
          <PathBox>{'World of Warcraft\\_retail_\\Interface\\AddOns'}</PathBox>
          <a href={ADDON_DOWNLOAD.href} download className={buttonClasses('primary', 'md', 'mt-1 self-start')}>
            <Download aria-hidden className="size-4" />
            {t('download', { version: ADDON_DOWNLOAD.version })}
          </a>
          <p className="text-xs">{t('downloadNote', { interface: ADDON_DOWNLOAD.interfaceVersion })}</p>
        </>
      ),
    },
    { title: t('step2Title'), body: <p>{t('step2Body')}</p> },
    { title: t('step3Title'), body: <p>{t('step3Body')}</p> },
    {
      title: t('step4Title'),
      body: (
        <>
          <p>{t('step4Body')}</p>
          <PathBox>{savedVariablesPath}</PathBox>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-3xl">
        <h1 className="text-4xl text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('intro')}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Panel title={t('stepsTitle')} titleId="import-steps">
          <ol className="flex flex-col gap-5">
            {steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className="quest-mark mt-0.5" aria-hidden>
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-muted-foreground">
                  <h3 className="font-display text-base text-foreground">{step.title}</h3>
                  {step.body}
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title={t('uploadTitle')} titleId="import-upload" className="corner-brackets">
            <div className="flex flex-col gap-4">
              <AddonUploader />
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Shield aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                {t('privacy')}
              </p>
            </div>
          </Panel>

          <Panel title={t('historyTitle')} titleId="import-history">
            {imports === null ? (
              <StateNotice state="sync_failed" title={t('errors.storage')} />
            ) : imports.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('historyEmpty')}</p>
            ) : (
              <div className="flex flex-col gap-5">
                <ul className="flex flex-col gap-2">
                  {imports.map((imp) => (
                    <li
                      key={imp.id}
                      className="flex flex-col gap-0.5 rounded-sm border border-border bg-background/40 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-foreground">
                        {format.dateTime(new Date(imp.importedAt), { dateStyle: 'medium', timeStyle: 'short' })}
                        <span className="font-normal text-muted-foreground"> · v{imp.addonVersion}</span>
                      </span>
                      <span className="text-muted-foreground">
                        {[
                          imp.categories.includes('characters')
                            ? t('historyCharacters', { count: imp.charactersCount })
                            : null,
                          imp.mountsCount !== null
                            ? t('historyMounts', { count: imp.mountsCount })
                            : t('historyMountsSkipped'),
                          imp.observedAt
                            ? t('historyObserved', {
                                when: format.dateTime(new Date(imp.observedAt), { dateStyle: 'medium' }),
                              })
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <h3 className="font-display text-base text-foreground">{t('deleteTitle')}</h3>
                  <p className="text-sm text-muted-foreground">{t('deleteBody')}</p>
                  <DeleteAddonData />
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
