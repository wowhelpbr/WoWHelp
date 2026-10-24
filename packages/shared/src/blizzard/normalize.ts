// Conversão das respostas da API da Blizzard para o domínio do WoWHelp.
//
// A Blizzard não publica o formato das respostas (docs/fase-0, A1 e A5). Os
// formatos abaixo seguem os exemplos públicos da comunidade e são lidos de modo
// defensivo: campo ausente ou estranho é ignorado, nunca inventado. Ao primeiro
// teste com conta real, conferir e ajustar (TBD registrado no relatório da Fase 0).

export const BATTLENET_REGIONS = ['us', 'eu', 'kr', 'tw'] as const;
export type BattlenetRegion = (typeof BATTLENET_REGIONS)[number];

type Json = unknown;

const isObj = (v: Json): v is Record<string, Json> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: Json, max = 128): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim().slice(0, max) : null;
const int = (v: Json): number | null => (typeof v === 'number' && Number.isInteger(v) ? v : null);
const idString = (v: Json): string | null => {
  if (typeof v === 'number' && Number.isInteger(v) && v >= 0) return String(v);
  if (typeof v === 'string' && /^\d{1,20}$/.test(v)) return v;
  return null;
};

/** Texto que pode vir pronto (com ?locale=) ou como mapa de idiomas (sem locale). */
export function localized(v: Json, locale: string): string | null {
  if (typeof v === 'string') return str(v, 512);
  if (isObj(v)) return str(v[locale], 512) ?? str(v.en_US, 512) ?? null;
  return null;
}

export interface BattlenetUser {
  accountId: string;
  battletag: string | null;
}

/** Só o idioma pedido, sem cair para o inglês (para saber se a tradução existe). */
function exact(v: Json, locale: string): string | null {
  if (typeof v === 'string') return locale === 'en_US' ? str(v, 512) : null;
  return isObj(v) ? str(v[locale], 512) : null;
}

/** /userinfo devolve "o ID da conta e a BattleTag" (campos exatos: TBD). */
export function normalizeUserInfo(json: Json): BattlenetUser | null {
  if (!isObj(json)) return null;
  const accountId = idString(json.id) ?? idString(json.sub) ?? str(json.sub, 64);
  if (!accountId) return null;
  return { accountId, battletag: str(json.battletag, 64) };
}

export interface CharacterSummary {
  externalId: string | null;
  name: string;
  realmSlug: string;
  realmName: string | null;
  level: number | null;
  classId: number | null;
  className: string | null;
  raceId: number | null;
  raceName: string | null;
  faction: 'ALLIANCE' | 'HORDE' | 'NEUTRAL' | null;
}

const FACTIONS = new Set(['ALLIANCE', 'HORDE', 'NEUTRAL']);

/** /profile/user/wow → personagens de todas as contas WoW do Battle.net. */
export function normalizeProfileCharacters(json: Json, locale: string): CharacterSummary[] {
  if (!isObj(json) || !Array.isArray(json.wow_accounts)) return [];
  const out: CharacterSummary[] = [];
  for (const account of json.wow_accounts) {
    if (!isObj(account) || !Array.isArray(account.characters)) continue;
    for (const c of account.characters) {
      if (!isObj(c)) continue;
      const name = localized(c.name, locale);
      const realm = isObj(c.realm) ? c.realm : null;
      const realmSlug = realm ? str(realm.slug, 64) : null;
      if (!name || !realmSlug || !/^[a-z0-9-]+$/.test(realmSlug)) continue;
      const cls = isObj(c.playable_class) ? c.playable_class : null;
      const race = isObj(c.playable_race) ? c.playable_race : null;
      const factionType = isObj(c.faction) ? str(c.faction.type, 16) : null;
      const level = int(c.level);
      out.push({
        externalId: idString(c.id),
        name: name.slice(0, 48),
        realmSlug,
        realmName: realm ? localized(realm.name, locale) : null,
        level: level !== null && level >= 1 && level <= 200 ? level : null,
        classId: cls ? int(cls.id) : null,
        className: cls ? localized(cls.name, locale) : null,
        raceId: race ? int(race.id) : null,
        raceName: race ? localized(race.name, locale) : null,
        faction: factionType && FACTIONS.has(factionType) ? (factionType as CharacterSummary['faction']) : null,
      });
    }
  }
  return out;
}

/**
 * /profile/user/wow/collections/mounts → IDs de montaria que a conta tem.
 * Formato inesperado devolve null ("não sei"), nunca lista vazia ("não tem nada").
 */
export function normalizeAccountMounts(json: Json): string[] | null {
  if (!isObj(json) || !Array.isArray(json.mounts)) return null;
  const ids = new Set<string>();
  for (const entry of json.mounts) {
    if (!isObj(entry)) continue;
    const id = isObj(entry.mount) ? idString(entry.mount.id) : null;
    if (id) ids.add(id);
  }
  return [...ids];
}

export interface EncounterKill {
  encounterId: number;
  /** Ex.: MYTHIC, HEROIC, NORMAL, LFR, LEGACY_25_MAN_HEROIC. */
  difficulty: string;
  completedCount: number;
  lastKillAt: string | null;
}

/**
 * /profile/wow/character/{realm}/{name}/encounters/raids (ou /dungeons):
 * expansions[].instances[].modes[].progress.encounters[] com completed_count
 * acumulado por chefe e dificuldade. Formato inesperado vira lista vazia.
 */
export function normalizeCharacterEncounters(json: Json): EncounterKill[] {
  if (!isObj(json) || !Array.isArray(json.expansions)) return [];
  const out = new Map<string, EncounterKill>();
  for (const expansion of json.expansions) {
    if (!isObj(expansion) || !Array.isArray(expansion.instances)) continue;
    for (const instance of expansion.instances) {
      if (!isObj(instance) || !Array.isArray(instance.modes)) continue;
      for (const mode of instance.modes) {
        if (!isObj(mode) || !isObj(mode.difficulty) || !isObj(mode.progress)) continue;
        const difficulty = str(mode.difficulty.type, 40);
        if (!difficulty || !/^[A-Z0-9_]{2,40}$/.test(difficulty)) continue;
        const encounters = Array.isArray(mode.progress.encounters) ? mode.progress.encounters : [];
        for (const e of encounters) {
          if (!isObj(e) || !isObj(e.encounter)) continue;
          const encounterId = int(e.encounter.id);
          const count = int(e.completed_count);
          if (!encounterId || encounterId <= 0 || count === null || count < 0) continue;
          const ts = int(e.last_kill_timestamp);
          const lastKillAt = ts && ts > 1_072_915_200_000 && ts < 4_102_444_800_000 ? new Date(ts).toISOString() : null;
          const key = `${encounterId}:${difficulty}`;
          const prev = out.get(key);
          out.set(key, {
            encounterId,
            difficulty,
            completedCount: Math.min((prev?.completedCount ?? 0) + count, 1_000_000),
            lastKillAt: [prev?.lastKillAt, lastKillAt].filter(Boolean).sort().at(-1) ?? null,
          });
        }
      }
    }
  }
  return [...out.values()];
}

/** Coleção de mascotes da conta: IDs das espécies. Formato inesperado = null (desconhecido). */
export function normalizeAccountPets(json: Json): string[] | null {
  if (!isObj(json) || !Array.isArray(json.pets)) return null;
  const ids = new Set<string>();
  for (const entry of json.pets) {
    const id = isObj(entry) && isObj(entry.species) ? idString(entry.species.id) : null;
    if (id) ids.add(id);
  }
  return [...ids];
}

/** Coleção de brinquedos da conta: IDs dos brinquedos. Formato inesperado = null (desconhecido). */
export function normalizeAccountToys(json: Json): string[] | null {
  if (!isObj(json) || !Array.isArray(json.toys)) return null;
  const ids = new Set<string>();
  for (const entry of json.toys) {
    const id = isObj(entry) && isObj(entry.toy) ? idString(entry.toy.id) : null;
    if (id) ids.add(id);
  }
  return [...ids];
}

/** Índice de mascotes (pets) ou brinquedos (toys): lista de IDs. */
export function normalizeCollectionIndex(json: Json, key: 'pets' | 'toys'): string[] {
  if (!isObj(json) || !Array.isArray(json[key])) return [];
  const ids = new Set<string>();
  for (const entry of json[key] as Json[]) {
    const id = isObj(entry) ? idString(entry.id) : null;
    if (id) ids.add(id);
  }
  return [...ids];
}

type Texts = { 'en-US': string | null; 'pt-BR': string | null };
const texts = (v: Json): Texts => ({ 'en-US': exact(v, 'en_US'), 'pt-BR': exact(v, 'pt_BR') });

export interface CollectibleDetail {
  id: string;
  names: Texts;
  descriptions: Texts;
  sourceType: string | null;
  sourceNames: Texts;
  faction: 'ALLIANCE' | 'HORDE' | null;
  hiddenUntilCollected: boolean;
  /** Tipo do item (mascote: BEAST, CRITTER...). */
  category: string | null;
  categoryNames: Texts;
  /** Mascote: criatura que leva ao modelo renderizado. */
  creatureId: number | null;
  /** Brinquedo: documento de mídia do item (ícone). */
  mediaRef: number | null;
  /** Brinquedo: item que ensina o brinquedo (para ler o efeito de "Usar"). */
  itemId: number | null;
}

function sourceOf(json: Record<string, Json>) {
  const src = isObj(json.source) ? json.source : null;
  const type = src ? str(src.type, 32) : null;
  return {
    sourceType: type && /^[A-Z_]+$/.test(type) ? type : null,
    sourceNames: src ? texts(src.name) : { 'en-US': null, 'pt-BR': null },
  };
}

/** /data/wow/pet/{id} pedido sem locale (todos os idiomas). */
export function normalizePetDetail(json: Json): CollectibleDetail | null {
  if (!isObj(json)) return null;
  const id = idString(json.id);
  const en = localized(json.name, 'en_US');
  if (!id || !en) return null;
  const type = isObj(json.battle_pet_type) ? json.battle_pet_type : null;
  const typeKey = type ? str(type.type, 32) : null;
  return {
    id,
    names: { 'en-US': en, 'pt-BR': exact(json.name, 'pt_BR') },
    descriptions: texts(json.description),
    ...sourceOf(json),
    faction: json.is_alliance_only === true ? 'ALLIANCE' : json.is_horde_only === true ? 'HORDE' : null,
    hiddenUntilCollected: false,
    category: typeKey && /^[A-Z_]+$/.test(typeKey) ? typeKey : null,
    categoryNames: type ? texts(type.name) : { 'en-US': null, 'pt-BR': null },
    creatureId: isObj(json.creature) ? int(json.creature.id) : null,
    mediaRef: null,
    itemId: null,
  };
}

/** /data/wow/toy/{id} pedido sem locale: o nome vem do item. */
export function normalizeToyDetail(json: Json): CollectibleDetail | null {
  if (!isObj(json)) return null;
  const id = idString(json.id);
  const item = isObj(json.item) ? json.item : null;
  const en = item ? localized(item.name, 'en_US') : null;
  if (!id || !item || !en) return null;
  return {
    id,
    names: { 'en-US': en, 'pt-BR': exact(item.name, 'pt_BR') },
    descriptions: { 'en-US': null, 'pt-BR': null },
    ...sourceOf(json),
    faction: null,
    hiddenUntilCollected: json.should_exclude_if_uncollected === true,
    category: null,
    categoryNames: { 'en-US': null, 'pt-BR': null },
    creatureId: null,
    mediaRef: isObj(json.media) ? int(json.media.id) : null,
    itemId: int(item.id),
  };
}

/** /data/wow/creature/{id}: primeiro modelo (creature display). */
export function normalizeCreatureDisplayId(json: Json): number | null {
  if (!isObj(json) || !Array.isArray(json.creature_displays)) return null;
  const first = json.creature_displays.find(isObj);
  return first ? int(first.id) : null;
}

/** /data/wow/media/item/{id}: URL do ícone oficial. */
export function normalizeItemIcon(json: Json, allowHost?: (url: string) => boolean): string | null {
  if (!isObj(json) || !Array.isArray(json.assets)) return null;
  const assets = json.assets
    .filter(isObj)
    .map((a) => ({ key: str(a.key, 32), value: str(a.value, 500) }))
    .filter((a): a is { key: string | null; value: string } => a.value !== null)
    .filter((a) => isOfficialRenderUrl(a.value) || (allowHost?.(a.value) ?? false));
  return (assets.find((a) => a.key === 'icon') ?? assets[0])?.value ?? null;
}

/** /data/wow/mount/index → lista de IDs. */
export function normalizeMountIndex(json: Json): string[] {
  if (!isObj(json) || !Array.isArray(json.mounts)) return [];
  const ids = new Set<string>();
  for (const m of json.mounts) {
    const id = isObj(m) ? idString(m.id) : null;
    if (id) ids.add(id);
  }
  return [...ids];
}

export interface MountDetail {
  id: string;
  names: { 'en-US': string | null; 'pt-BR': string | null };
  descriptions: { 'en-US': string | null; 'pt-BR': string | null };
  sourceType: string | null;
  sourceNames: { 'en-US': string | null; 'pt-BR': string | null };
  faction: 'ALLIANCE' | 'HORDE' | null;
  hiddenUntilCollected: boolean;
  creatureDisplayId: number | null;
}

/** /data/wow/mount/{id} pedido sem locale (todos os idiomas numa resposta só). */
export function normalizeMountDetail(json: Json): MountDetail | null {
  if (!isObj(json)) return null;
  const id = idString(json.id);
  const en = localized(json.name, 'en_US');
  if (!id || !en) return null;
  const src = isObj(json.source) ? json.source : null;
  const sourceType = src ? str(src.type, 32) : null;
  const factionType = isObj(json.faction) ? str(json.faction.type, 16) : null;
  const display = Array.isArray(json.creature_displays) ? json.creature_displays.find(isObj) : undefined;
  return {
    id,
    names: { 'en-US': en, 'pt-BR': exact(json.name, 'pt_BR') },
    descriptions: { 'en-US': exact(json.description, 'en_US'), 'pt-BR': exact(json.description, 'pt_BR') },
    sourceType: sourceType && /^[A-Z_]+$/.test(sourceType) ? sourceType : null,
    sourceNames: {
      'en-US': src ? exact(src.name, 'en_US') : null,
      'pt-BR': src ? exact(src.name, 'pt_BR') : null,
    },
    faction: factionType === 'ALLIANCE' || factionType === 'HORDE' ? factionType : null,
    hiddenUntilCollected: json.should_exclude_if_uncollected === true,
    creatureDisplayId: display ? int(display.id) : null,
  };
}

// Imagens oficiais da Blizzard vêm de render.worldofwarcraft.com ou
// render-{região}.worldofwarcraft.com (planning: documentos de mídia).
const RENDER_HOST = /^render(-[a-z]{2})?\.worldofwarcraft\.com$/;

/** true se a URL é uma imagem oficial da Blizzard (https e host de render conhecido). */
export function isOfficialRenderUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && RENDER_HOST.test(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

/**
 * /data/wow/media/creature-display/{id}: devolve a URL da imagem do modelo
 * (prefere o asset "zoom"). `allowHost` libera um host extra só em teste local.
 */
export function normalizeCreatureDisplayMedia(json: Json, allowHost?: (url: string) => boolean): string | null {
  if (!isObj(json) || !Array.isArray(json.assets)) return null;
  const assets = json.assets
    .filter(isObj)
    .map((a) => ({ key: str(a.key, 32), value: str(a.value, 500) }))
    .filter((a): a is { key: string | null; value: string } => a.value !== null)
    .filter((a) => isOfficialRenderUrl(a.value) || (allowHost?.(a.value) ?? false));
  return (assets.find((a) => a.key === 'zoom') ?? assets[0])?.value ?? null;
}

/** Idioma a pedir à API conforme a região (cada host aceita só alguns). */
export function apiLocaleFor(region: BattlenetRegion, appLocale: 'en-US' | 'pt-BR'): string {
  switch (region) {
    case 'us':
      return appLocale === 'pt-BR' ? 'pt_BR' : 'en_US';
    case 'eu':
      return 'en_GB';
    case 'kr':
      return 'ko_KR';
    case 'tw':
      return 'zh_TW';
  }
}

/**
 * Itens de rascunho interno da Blizzard ("[PH] Horse with Hat", "[DNT] ...",
 * "[DND] Test Mount"). Existem na API mas não são obtíveis: ficam fora do catálogo.
 */
export function isPlaceholderName(name: string | null | undefined): boolean {
  return typeof name === 'string' && /\[(PH|DNT|DND|NYI)\]/i.test(name);
}

/**
 * /data/wow/item/{id} pedido sem locale: texto do efeito de "Usar"
 * (preview_item.spells[].description), que é a descrição útil de um brinquedo.
 */
export function normalizeItemUseText(json: Json): Texts {
  const empty = { 'en-US': null, 'pt-BR': null };
  if (!isObj(json) || !isObj(json.preview_item) || !Array.isArray(json.preview_item.spells)) return empty;
  const spell = json.preview_item.spells.find((sp) => isObj(sp) && sp.description);
  return isObj(spell) ? texts(spell.description) : empty;
}
