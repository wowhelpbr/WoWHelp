'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { StateNotice } from '@/components/ui/data-state';
import { cn } from '@/lib/cn';
import { GoalCard } from './goal-card';
import type { GoalView } from './queries';

type Filter = 'active' | 'completed' | 'all';

export function GoalList({ goals }: { goals: GoalView[] }) {
  const t = useTranslations('Goals');
  const [filter, setFilter] = useState<Filter>('active');

  const visible = goals
    .filter((g) =>
      filter === 'all' ? true : filter === 'active' ? g.status !== 'completed' : g.status === 'completed',
    )
    .sort((a, b) => a.priority - b.priority || Date.parse(a.createdAt) - Date.parse(b.createdAt));

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label={t('filterLabel')}
        className="flex gap-1 self-start rounded-sm border border-border/70 p-1"
      >
        {(['active', 'completed', 'all'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              'min-h-9 rounded px-3 text-sm',
              filter === value ? 'bg-card-raised text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`filters.${value}`)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <StateNotice state="empty" title={t('empty')} />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((goal) => (
            <li key={goal.id}>
              <GoalCard goal={goal} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
