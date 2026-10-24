import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const inputClasses =
  'min-h-11 rounded-sm border border-transparent bg-card-raised px-3.5 text-foreground placeholder:text-faint focus:border-primary focus:shadow-[0_0_18px_rgb(197_251_20/0.25)] focus:outline-none aria-invalid:border-danger';

export function Field({
  id,
  label,
  hint,
  error,
  className,
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ');
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        className={cn(inputClasses, 'w-full')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
