import Image, { type StaticImageData } from 'next/image';
import mage from '@/assets/brand/classes/mage.webp';
import monk from '@/assets/brand/classes/monk.webp';
import priest from '@/assets/brand/classes/priest.webp';
import warrior from '@/assets/brand/classes/warrior.webp';
import { cn } from '@/lib/cn';

// Ilustrações de classe da Elianai dos Santos (eliz00r). Decorativas: o texto
// ao lado já diz tudo, então o alt fica vazio para leitores de tela.
const ART: Record<'mage' | 'monk' | 'priest' | 'warrior', StaticImageData> = { mage, monk, priest, warrior };

export function ClassArt({
  name,
  className = 'w-full',
  sizes,
  priority = false,
}: {
  name: keyof typeof ART;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={ART[name]}
      alt=""
      sizes={sizes}
      priority={priority}
      className={cn('pointer-events-none h-auto drop-shadow-[0_24px_40px_rgb(0_0_0/0.55)] select-none', className)}
    />
  );
}
