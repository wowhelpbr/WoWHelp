import type { DataState } from '@wowhelp/shared';
import {
  CircleCheck,
  CircleDashed,
  CircleHelp,
  Clock,
  CloudOff,
  LoaderCircle,
  Lock,
  ShieldAlert,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

// Cada estado tem ícone, cor e texto próprios: nunca depender só da cor,
// e "desconhecido" nunca se parece com "faltando".
const STYLE: Record<DataState | 'ok', { icon: LucideIcon; tone: string; spin?: boolean }> = {
  ok: { icon: CircleCheck, tone: 'text-success border-success/40 bg-success/10' },
  loading: { icon: LoaderCircle, tone: 'text-muted-foreground border-border bg-white/5', spin: true },
  empty: { icon: CircleDashed, tone: 'text-muted-foreground border-border bg-white/5' },
  unauthenticated: { icon: Lock, tone: 'text-neon border-neon/40 bg-neon/10' },
  permission_denied: { icon: ShieldAlert, tone: 'text-danger border-danger/40 bg-danger/10' },
  stale: { icon: Clock, tone: 'text-warning border-warning/40 bg-warning/10' },
  not_available: { icon: CloudOff, tone: 'text-unknown border-unknown/40 bg-unknown/10' },
  unknown: { icon: CircleHelp, tone: 'text-unknown border-dashed border-unknown/50 bg-transparent' },
  sync_failed: { icon: TriangleAlert, tone: 'text-danger border-danger/40 bg-danger/10' },
};

export function DataStateBadge({
  state,
  label,
  className,
}: {
  state: DataState | 'ok';
  /** Texto alternativo; por padrão usa o nome do estado traduzido. */
  label?: ReactNode;
  className?: string;
}) {
  const t = useTranslations('DataState');
  const { icon: Icon, tone, spin } = STYLE[state];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-0.5 font-display text-[0.6875rem] font-bold tracking-[0.06em] whitespace-nowrap uppercase',
        tone,
        className,
      )}
      data-state={state}
    >
      <Icon aria-hidden className={cn('size-3.5', spin && 'animate-spin')} />
      {label ?? (state === 'ok' ? null : t(state))}
    </span>
  );
}

/** Bloco de aviso para telas e seções inteiras num estado especial. */
export function StateNotice({
  state,
  title,
  children,
  action,
}: {
  state: DataState;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-sidebar/60 p-4"
      data-state={state}
    >
      <div className="flex flex-wrap items-center gap-2">
        <DataStateBadge state={state} />
        <p className="font-medium text-foreground">{title}</p>
      </div>
      {children && <div className="max-w-prose text-sm text-muted-foreground">{children}</div>}
      {action}
    </div>
  );
}
