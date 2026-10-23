import { z } from 'zod';
import { FOCUS_AREAS, GAME_REGIONS, GOAL_STATUSES, LOCALES } from '../domain/enums';

// Schemas de entrada validados no servidor (Server Actions / Route Handlers).
// Limites iguais aos CHECKs do banco, para o erro aparecer antes do Postgres.

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

export const uuidSchema = z.uuid();

export const goalCreateSchema = z.object({
  title: trimmed(1, 160),
  priority: z.coerce.number().int().min(1).max(5).default(3),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type GoalCreateInput = z.infer<typeof goalCreateSchema>;

export const goalStatusSchema = z.enum(GOAL_STATUSES);

export const goalStepCreateSchema = z.object({
  goalId: uuidSchema,
  label: trimmed(1, 240),
});

export const focusAreasSchema = z
  .array(z.enum(FOCUS_AREAS))
  .max(FOCUS_AREAS.length)
  .transform((areas) => FOCUS_AREAS.filter((a) => areas.includes(a)));

export const localeSchema = z.enum(LOCALES);
export const gameRegionSchema = z.enum(GAME_REGIONS);

export const credentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(72),
});

export const signUpSchema = credentialsSchema.extend({
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});
