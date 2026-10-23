import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Painel no estilo tooltip do jogo, com título opcional e ações à direita. */
export function Panel({
  title,
  titleId,
  actions,
  children,
  className,
  as: Tag = 'section',
}: {
  title?: ReactNode;
  titleId?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'aside';
}) {
  return (
    <Tag className={cn('frame p-4 sm:p-5', className)} aria-labelledby={title && titleId ? titleId : undefined}>
      {(title || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          {title && (
            <h2
              id={titleId}
              className="flex items-center gap-2.5 text-lg tracking-wide text-foreground uppercase before:size-2 before:rotate-45 before:bg-neon before:content-['']"
            >
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </Tag>
  );
}
