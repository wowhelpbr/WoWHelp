import type { Locale } from '@wowhelp/shared';
import { TriangleAlert } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { LEGAL, type LegalKind } from './content';

const TOC_LABEL: Record<Locale, string> = { 'pt-BR': 'Nesta página', 'en-US': 'On this page' };

/** Página legal estática (rascunho): índice fixo à esquerda e texto em largura de leitura. */
export function LegalPage({ kind, locale }: { kind: LegalKind; locale: Locale }) {
  const doc = LEGAL[kind][locale];
  const anchor = (i: number) => `secao-${i + 1}`;
  return (
    <Container className="py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] xl:gap-16">
        <nav aria-label={TOC_LABEL[locale]} className="hidden lg:block">
          <div className="frame sticky top-24 p-4">
            <p className="label mb-3">{TOC_LABEL[locale]}</p>
            <ol className="flex flex-col gap-1 text-sm">
              {doc.sections.map((section, i) => (
                <li key={section.heading}>
                  <a
                    href={`#${anchor(i)}`}
                    className="block rounded-sm px-2 py-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <article className="flex max-w-4xl flex-col gap-7">
          <header className="flex flex-col gap-3">
            <p className="eyebrow">{doc.updated}</p>
            <h1 className="text-4xl text-foreground sm:text-5xl">{doc.title}</h1>
            <p
              role="note"
              className="flex items-start gap-2 rounded-sm border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning"
            >
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {doc.draftNotice}
            </p>
            <p className="text-muted-foreground">{doc.intro}</p>
          </header>
          {doc.sections.map((section, i) => (
            <section
              key={section.heading}
              id={anchor(i)}
              aria-labelledby={`${anchor(i)}-titulo`}
              className="flex scroll-mt-24 flex-col gap-2"
            >
              <h2 id={`${anchor(i)}-titulo`} className="font-display text-xl text-primary">
                {section.heading}
              </h2>
              {section.items && (
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-foreground marker:text-neon">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.paragraphs?.map((p) => (
                <p key={p} className="text-foreground">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </Container>
  );
}
