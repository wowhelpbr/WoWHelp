import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

// Botões do sistema neon (classes .btn em globals.css): limão para a ação
// principal, roxo (brand) para o botão de marca no topo, cinza para o resto.

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand' | 'cyan' | 'olive';
type Size = 'lg' | 'md' | 'sm';
/** Paralelogramo para chamadas de destaque, chanfro para ações compactas. */
type Shape = 'default' | 'skew' | 'cut';

const sizes: Record<Size, string> = {
  lg: 'min-h-12 px-7 text-[0.8125rem]',
  md: 'min-h-11 px-5 text-xs',
  sm: 'min-h-9 px-3.5 text-[0.6875rem]',
};

export function buttonClasses(
  variant: Variant = 'primary',
  size: Size = 'md',
  className?: string,
  shape: Shape = 'default',
) {
  return cn('btn', `btn-${variant}`, shape !== 'default' && `btn-${shape}`, sizes[size], className);
}

type Options = { variant?: Variant; size?: Size; shape?: Shape };

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'default',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Options) {
  return <button type={type} className={buttonClasses(variant, size, className, shape)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  shape = 'default',
  className,
  ...props
}: ComponentProps<typeof Link> & Options) {
  return <Link className={buttonClasses(variant, size, className, shape)} {...props} />;
}
