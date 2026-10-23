import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const inputClasses =
  'min-h-11 rounded-sm border border-border bg-background/80 px-3 text-foreground placeholder:text-muted-foreground/70 shadow-[inset_0_1px_2px_rgb(0_0_0/0.6)] focus:border-primary focus:outline-none aria-invalid:border-danger';

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
      <label htmlFor={id} className="text-sm font-medium text-foreground">
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
