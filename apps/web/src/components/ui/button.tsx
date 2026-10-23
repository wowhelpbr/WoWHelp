import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60 select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground uppercase shadow-[inset_0_-2px_0_rgb(0_0_0/0.22)] hover:bg-[#ffd65c] active:bg-primary-deep',
  secondary: 'border border-primary/70 text-primary uppercase hover:bg-primary/10',
  ghost: 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
  danger: 'text-danger hover:bg-danger/10 border border-danger/40',
};

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-4 text-[0.95rem]',
  sm: 'min-h-9 px-3 text-sm',
};

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
