import { z } from 'zod';
import { parseSavedVariables, SavedVariablesError, toPlain } from './saved-variables';

// Formato aceito do WoWHelp Companion (schemaVersion 1, addon/WoWHelpCompanion).
// Só os campos desta lista chegam ao banco; o resto do arquivo é ignorado.

export const ADDON_VARIABLE = 'WoWHelpCompanionDB';

const epoch = z
  .number()
  .int()
  .min(1_072_915_200) // 2004-01-01
  .max(4_102_444_800) // 2100-01-01
  .transform((s) => new Date(s * 1000).toISOString());

// .optional() é o que deixa a chave faltar: no Zod 4 um z.undefined() dentro
// da união não basta, e o addon omite o campo quando o jogo não informa.
const optionalEpoch = z
  .union([epoch, z.literal(0).transform(() => null), z.null()])
  .optional()
  .transform((v) => v ?? null);
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null));
const optionalInt = (min: number, max: number) =>
  z
    .number()
    .int()
    .min(min)
    .max(max)
    .optional()
    .nullable()
    .transform((v) => v ?? null);

const characterSchema = z.object({
  name: z.string().trim().min(1).max(48),
  realm: optionalText(64),
  realmSlug: optionalText(64),
  level: optionalInt(1, 200),
  classId: optionalInt(1, 100),
  className: optionalText(48),
  raceId: optionalInt(1, 200),
  raceName: optionalText(48),
  faction: z
    .enum(['Alliance', 'Horde', 'Neutral'])
    .optional()
    .nullable()
    .transform((f) => (f ? (f.toUpperCase() as 'ALLIANCE' | 'HORDE' | 'NEUTRAL') : null)),
  observedAt: optionalEpoch,
});

const GUID = /^Player-\d{1,5}-[0-9A-F]{8}$/;

const snapshotSchema = z.object({
  schemaVersion: z.literal(1),
  addonVersion: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/),
  lastObservedAt: optionalEpoch,
  region: z
    .enum(['us', 'eu', 'kr', 'tw', 'cn'])
    .optional()
    .nullable()
    .transform((r) => (r && r !== 'cn' ? r : null)),
  client: z
    .object({ version: optionalText(16), build: optionalText(16), interface: optionalInt(1, 999_999) })
    .optional()
    .nullable()
    .transform((c) => c ?? null),
  weeklyResetAt: optionalEpoch,
  account: z
    .object({
      mounts: z
        .object({
          available: z.boolean(),
          observedAt: optionalEpoch,
          collected: z.union([z.array(z.number().int().min(1).max(10_000_000)).max(6000), z.object({}).strict()]),
        })
        .optional(),
    })
    .optional(),
  characters: z.union([z.record(z.string().regex(GUID), characterSchema), z.array(z.never()).max(0)]).optional(),
});

export interface AddonCharacter {
  guid: string;
  name: string;
  realm: string | null;
  realmSlug: string | null;
  level: number | null;
  classId: number | null;
  className: string | null;
  raceId: number | null;
  raceName: string | null;
  faction: 'ALLIANCE' | 'HORDE' | 'NEUTRAL' | null;
  observedAt: string | null;
}

export interface AddonSnapshot {
  addonVersion: string;
  observedAt: string | null;
  region: 'us' | 'eu' | 'kr' | 'tw' | null;
  client: { version: string | null; build: string | null; interface: number | null } | null;
  weeklyResetAt: string | null;
  /** null = o addon não conseguiu ler a coleção (desconhecido), nunca "não tem nada". */
  mounts: { ids: string[]; observedAt: string | null } | null;
  characters: AddonCharacter[];
}

export type AddonReadResult =
  | { ok: true; snapshot: AddonSnapshot }
  | { ok: false; code: SavedVariablesError['code'] | 'invalid_format' | 'unsupported_version' };

export function readAddonSnapshot(source: string): AddonReadResult {
  let plain: unknown;
  try {
    plain = toPlain(parseSavedVariables(source, ADDON_VARIABLE));
  } catch (e) {
    if (e instanceof SavedVariablesError) return { ok: false, code: e.code };
    return { ok: false, code: 'syntax' };
  }

  if (
    plain &&
    typeof plain === 'object' &&
    'schemaVersion' in plain &&
    (plain as { schemaVersion: unknown }).schemaVersion !== 1
  ) {
    return { ok: false, code: 'unsupported_version' };
  }
  const parsed = snapshotSchema.safeParse(plain);
  if (!parsed.success) return { ok: false, code: 'invalid_format' };
  const d = parsed.data;

  const mounts = d.account?.mounts;
  const characters = d.characters && !Array.isArray(d.characters) ? Object.entries(d.characters) : [];

  return {
    ok: true,
    snapshot: {
      addonVersion: d.addonVersion,
      observedAt: d.lastObservedAt ?? null,
      region: d.region,
      client: d.client,
      weeklyResetAt: d.weeklyResetAt ?? null,
      mounts:
        mounts && mounts.available
          ? {
              ids: [...new Set((Array.isArray(mounts.collected) ? mounts.collected : []).map(String))],
              observedAt: mounts.observedAt ?? null,
            }
          : null,
      characters: characters.slice(0, 60).map(([guid, c]) => ({ guid, ...c, observedAt: c.observedAt ?? null })),
    },
  };
}
