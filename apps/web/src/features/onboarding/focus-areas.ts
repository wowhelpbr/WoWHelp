import type { FocusArea } from '@wowhelp/shared';
import { BookOpen, CalendarCheck, Hourglass, House, Shield, Trophy, Users, type LucideIcon } from 'lucide-react';
import { MountGlyph } from '@/components/brand/mount-glyph';

/**
 * Quando cada área ganha uma ferramenta própria (roteiro em
 * planning/docs/02_FASES_E_MARCOS.md e 08_BACKLOG.md). Hoje todas já
 * funcionam com objetivos e checklists manuais.
 */
export type ToolAvailability = { href: '/mounts' | '/planner' | '/characters' } | { phase: number } | 'after_beta';

export const FOCUS_AREA_CONFIG: Record<FocusArea, { icon: LucideIcon | typeof MountGlyph; tool: ToolAvailability }> = {
  gear: { icon: Shield, tool: 'after_beta' },
  mounts: { icon: MountGlyph, tool: { href: '/mounts' } },
  achievements: { icon: Trophy, tool: 'after_beta' },
  weekly: { icon: CalendarCheck, tool: { href: '/planner' } },
  alts: { icon: Users, tool: { href: '/characters' } },
  class: { icon: BookOpen, tool: 'after_beta' },
  sessions: { icon: Hourglass, tool: { href: '/planner' } },
  housing: { icon: House, tool: 'after_beta' },
};
