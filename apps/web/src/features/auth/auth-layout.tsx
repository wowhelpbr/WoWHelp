import type { ReactNode } from 'react';
import { ClassArt } from '@/components/brand/class-art';
import { gutter } from '@/components/ui/container';
import { cn } from '@/lib/cn';

/** Tela dividida de entrar/criar conta: formulário à esquerda, arte ocupando a outra metade. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <div className={cn('flex items-center justify-center py-10 sm:py-16', gutter)}>
        <div className="w-full max-w-md">{children}</div>
      </div>
      <div className="hex-grid relative hidden items-end justify-center overflow-hidden border-l border-border lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_55%,rgb(60_200_255/0.18),transparent_70%),linear-gradient(180deg,rgb(76_54_196/0.25),transparent_45%)]"
        />
        <ClassArt
          name="warrior"
          sizes="(min-width: 1024px) 45vw, 0px"
          className="relative w-[88%] max-w-4xl translate-y-[4%]"
        />
      </div>
    </div>
  );
}
