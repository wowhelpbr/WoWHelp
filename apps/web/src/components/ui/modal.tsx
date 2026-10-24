'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

/**
 * Janela por cima da página para rotas interceptadas (ex.: montaria aberta do
 * catálogo). Usa <dialog> nativo: foco preso, Esc fecha, leitor de tela entende.
 * Fechar volta no histórico, então a lista continua onde estava.
 */
export function Modal({
  children,
  closeLabel,
  labelledBy,
}: {
  children: ReactNode;
  closeLabel: string;
  labelledBy: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Clique no fundo escuro (fora da caixa) fecha.
  function onClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === ref.current) router.back();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        router.back();
      }}
      onClick={onClick}
      className="m-auto max-h-[92dvh] w-[min(72rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-white/10 bg-[rgb(15_21_29/0.96)] p-0 text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_30px_80px_rgb(0_0_0/0.6)] backdrop:bg-[rgb(5_8_11/0.72)] backdrop:backdrop-blur-sm"
    >
      <div className="relative p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={closeLabel}
          className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-sm bg-card-raised text-muted-foreground hover:bg-border-strong hover:text-foreground"
        >
          <X aria-hidden className="size-5" />
        </button>
        {children}
      </div>
    </dialog>
  );
}
