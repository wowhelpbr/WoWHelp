import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Largura total da tela, com respiro lateral que cresce com o monitor. Sem coluna centralizada. */
export const gutter = 'px-4 sm:px-6 lg:px-10 2xl:px-14';

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('w-full', gutter, className)}>{children}</div>;
}
