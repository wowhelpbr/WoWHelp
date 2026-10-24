'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { buttonClasses } from '@/components/ui/button';

/** Botão de formulário que trava e troca o texto enquanto o servidor responde. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = 'primary',
  className,
}: {
  children: ReactNode;
  pendingLabel: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses(variant, 'md', className)}>
      {pending ? pendingLabel : children}
    </button>
  );
}
