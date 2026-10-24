'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { buttonClasses } from '@/components/ui/button';

/** Botão de formulário que trava e troca o texto enquanto o servidor responde. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = 'primary',
  size = 'md',
  shape = 'default',
  className,
}: {
  children: ReactNode;
  pendingLabel: ReactNode;
  variant?: 'primary' | 'secondary' | 'cyan';
  size?: 'md' | 'lg';
  shape?: 'default' | 'skew' | 'cut';
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses(variant, size, className, shape)}>
      {pending ? pendingLabel : children}
    </button>
  );
}
