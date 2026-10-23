// Enums do domínio, espelhando planning/technical/contracts.json e as
// constraints das migrations em supabase/migrations. Mudou aqui, mude lá.

export const LOCALES = ['en-US', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en-US';

/** Regiões de jogo da Battle.net. Disponibilidade real por região é TBD (Fase 2). */
export const GAME_REGIONS = ['us', 'eu', 'kr', 'tw', 'cn'] as const;
export type GameRegion = (typeof GAME_REGIONS)[number];

/** Tri-state: ausência de registro nunca vira "não obtido". */
export const COLLECTION_STATUSES = ['collected', 'not_collected', 'unknown'] as const;
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

export const GOAL_STATUSES = ['active', 'paused', 'completed'] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const DATA_SOURCES = ['blizzard_api', 'addon_import', 'manual', 'editorial'] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

export const CONTENT_REVIEW_STATUSES = ['draft', 'needs_review', 'approved', 'retired'] as const;
export type ContentReviewStatus = (typeof CONTENT_REVIEW_STATUSES)[number];

/**
 * Objetivos que o jogador escolhe na entrada ("What do you want to do today?").
 * A ordem é a de exibição.
 */
export const FOCUS_AREAS = [
  'gear',
  'mounts',
  'achievements',
  'weekly',
  'alts',
  'class',
  'sessions',
  'housing',
] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];

/**
 * Estados de dado que a interface precisa representar de forma distinta
 * (planning/docs/05_WEB_PWA_E_UX.md, "Estados UX obrigatórios").
 */
export const DATA_STATES = [
  'loading',
  'empty',
  'unauthenticated',
  'permission_denied',
  'stale',
  'not_available',
  'unknown',
  'sync_failed',
] as const;
export type DataState = (typeof DATA_STATES)[number];

export function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}
