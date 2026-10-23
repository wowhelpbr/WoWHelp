import Image from 'next/image';
import medallion from '@/assets/brand/medallion.webp';
import wordmark from '@/assets/brand/wordmark.webp';
import { cn } from '@/lib/cn';

// Marca oficial do WoWHelp (Elianai dos Santos / eliz00r). Créditos em
// src/assets/brand/CREDITS.md e no rodapé do site.

/** Medalhão rúnico sozinho (ícone). */
export function LogoMark({ className, alt = '' }: { className?: string; alt?: string }) {
  return <Image src={medallion} alt={alt} sizes="48px" className={cn('size-8 object-contain', className)} />;
}

/** Logotipo completo: o medalhão faz o "O" de WoW. */
export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={wordmark}
      alt="WoWHelp"
      priority={priority}
      sizes="(min-width: 640px) 200px, 160px"
      className={cn('h-7 w-auto sm:h-[2.1rem]', className)}
    />
  );
}
