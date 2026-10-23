import { describe, expect, it } from 'vitest';
import {
  apiLocaleFor,
  isOfficialRenderUrl,
  normalizeAccountPets,
  normalizeAccountToys,
  normalizeCollectionIndex,
  normalizeCreatureDisplayId,
  normalizeItemIcon,
  normalizePetDetail,
  normalizeToyDetail,
  normalizeCharacterEncounters,
  normalizeCreatureDisplayMedia,
  normalizeAccountMounts,
  normalizeMountDetail,
  normalizeMountIndex,
  normalizeProfileCharacters,
  normalizeUserInfo,
} from './normalize';

// Amostras no formato dos exemplos públicos da comunidade (a Blizzard não
// publica o formato oficial). Nomes e números aqui são de teste, não do jogo.

describe('normalizeUserInfo', () => {
  it('aceita id numérico e BattleTag', () => {
    expect(normalizeUserInfo({ id: 123456, battletag: 'Tester#1234' })).toEqual({
      accountId: '123456',
      battletag: 'Tester#1234',
    });
  });

  it('aceita sub quando não há id', () => {
    expect(normalizeUserInfo({ sub: '987' })?.accountId).toBe('987');
  });

  it('sem identificador é nulo', () => {
    expect(normalizeUserInfo({ battletag: 'x#1' })).toBeNull();
    expect(normalizeUserInfo('lixo')).toBeNull();
  });
});

describe('normalizeProfileCharacters', () => {
  const sample = {
    wow_accounts: [
      {
        id: 1,
        characters: [
          {
            name: 'Personagemteste',
            id: 111,
            realm: { name: 'Reino de Teste', id: 1, slug: 'reino-de-teste' },
            playable_class: { name: 'Mago', id: 8 },
            playable_race: { name: 'Anão', id: 3 },
            faction: { type: 'ALLIANCE', name: 'Aliança' },
            level: 80,
          },
          { name: 'SemReino', id: 112 },
          { name: 'ReinoInvalido', id: 113, realm: { slug: '../etc' } },
        ],
      },
      { id: 2, characters: [{ name: 'Outro', id: 'abc', realm: { slug: 'outro' }, level: 999 }] },
    ],
  };

  it('lê os campos conhecidos e descarta entradas incompletas', () => {
    const chars = normalizeProfileCharacters(sample, 'pt_BR');
    expect(chars).toHaveLength(2);
    expect(chars[0]).toEqual({
      externalId: '111',
      name: 'Personagemteste',
      realmSlug: 'reino-de-teste',
      realmName: 'Reino de Teste',
      level: 80,
      classId: 8,
      className: 'Mago',
      raceId: 3,
      raceName: 'Anão',
      faction: 'ALLIANCE',
    });
  });

  it('valores fora do esperado viram nulo, não chute', () => {
    const [, other] = normalizeProfileCharacters(sample, 'pt_BR');
    expect(other).toMatchObject({ externalId: null, level: null, faction: null, className: null });
  });

  it('formato desconhecido devolve lista vazia', () => {
    expect(normalizeProfileCharacters({ foo: 1 }, 'en_US')).toEqual([]);
  });
});

describe('normalizeAccountMounts', () => {
  it('extrai IDs únicos', () => {
    expect(
      normalizeAccountMounts({
        mounts: [{ mount: { id: 6 } }, { mount: { id: '6' } }, { mount: { id: 7 } }, { mount: {} }, 'x'],
      }),
    ).toEqual(['6', '7']);
  });

  it('formato inesperado é nulo (desconhecido), não lista vazia', () => {
    expect(normalizeAccountMounts({})).toBeNull();
    expect(normalizeAccountMounts({ mounts: [] })).toEqual([]);
  });
});

describe('catálogo de montarias', () => {
  it('índice: IDs únicos', () => {
    expect(normalizeMountIndex({ mounts: [{ id: 1, name: 'A' }, { id: 2 }, { id: 1 }] })).toEqual(['1', '2']);
  });

  it('detalhe sem locale: nomes nos dois idiomas, fonte e facção', () => {
    const detail = normalizeMountDetail({
      id: 6,
      name: { en_US: 'Test Mount', pt_BR: 'Montaria de Teste' },
      description: { en_US: 'A test.', pt_BR: 'Um teste.' },
      source: { type: 'VENDOR', name: { en_US: 'Vendor', pt_BR: 'Vendedor' } },
      faction: { type: 'HORDE' },
      should_exclude_if_uncollected: true,
      creature_displays: [{ id: 2404 }],
    });
    expect(detail).toEqual({
      id: '6',
      names: { 'en-US': 'Test Mount', 'pt-BR': 'Montaria de Teste' },
      descriptions: { 'en-US': 'A test.', 'pt-BR': 'Um teste.' },
      sourceType: 'VENDOR',
      sourceNames: { 'en-US': 'Vendor', 'pt-BR': 'Vendedor' },
      faction: 'HORDE',
      hiddenUntilCollected: true,
      creatureDisplayId: 2404,
    });
  });

  it('detalhe sem nome em inglês é descartado', () => {
    expect(normalizeMountDetail({ id: 1, name: { pt_BR: 'Só português' } })).toBeNull();
  });

  it('tradução ausente fica nula (a tela cai para o inglês)', () => {
    expect(normalizeMountDetail({ id: 1, name: { en_US: 'Only English' } })?.names['pt-BR']).toBeNull();
  });
});

describe('apiLocaleFor', () => {
  it('usa só idiomas aceitos por cada host', () => {
    expect(apiLocaleFor('us', 'pt-BR')).toBe('pt_BR');
    expect(apiLocaleFor('us', 'en-US')).toBe('en_US');
    expect(apiLocaleFor('eu', 'pt-BR')).toBe('en_GB');
  });
});

describe('mídia de modelo (creature-display)', () => {
  const media = (assets: unknown) => ({ id: 1, assets });

  it('prefere a imagem zoom oficial', () => {
    expect(
      normalizeCreatureDisplayMedia(
        media([
          { key: 'other', value: 'https://render.worldofwarcraft.com/us/npcs/other/x.jpg' },
          { key: 'zoom', value: 'https://render.worldofwarcraft.com/us/npcs/zoom/creature-display-1.jpg' },
        ]),
      ),
    ).toBe('https://render.worldofwarcraft.com/us/npcs/zoom/creature-display-1.jpg');
  });

  it('aceita host por região e cai para o primeiro asset válido', () => {
    expect(
      normalizeCreatureDisplayMedia(media([{ key: 'x', value: 'https://render-eu.worldofwarcraft.com/a.jpg' }])),
    ).toBe('https://render-eu.worldofwarcraft.com/a.jpg');
  });

  it('recusa host desconhecido, http e credenciais na URL', () => {
    for (const value of [
      'https://evil.example.com/zoom.jpg',
      'http://render.worldofwarcraft.com/a.jpg',
      'https://user:pw@render.worldofwarcraft.com/a.jpg',
      'https://render.worldofwarcraft.com.evil.com/a.jpg',
      'javascript:alert(1)',
    ]) {
      expect(isOfficialRenderUrl(value)).toBe(false);
    }
    expect(normalizeCreatureDisplayMedia(media([{ key: 'zoom', value: 'https://evil.example.com/z.jpg' }]))).toBeNull();
  });

  it('formato inesperado vira nulo', () => {
    expect(normalizeCreatureDisplayMedia(null)).toBeNull();
    expect(normalizeCreatureDisplayMedia({ assets: 'x' })).toBeNull();
    expect(normalizeCreatureDisplayMedia(media([]))).toBeNull();
  });

  it('host extra só quando liberado (teste local)', () => {
    const local = 'http://127.0.0.1:4010/render/1.jpg';
    expect(normalizeCreatureDisplayMedia(media([{ key: 'zoom', value: local }]))).toBeNull();
    expect(
      normalizeCreatureDisplayMedia(media([{ key: 'zoom', value: local }]), (u) => u.startsWith('http://127.0.0.1:')),
    ).toBe(local);
  });
});

describe('chefes mortos por personagem (encounters)', () => {
  const sample = {
    expansions: [
      {
        expansion: { id: 1, name: 'Test Expansion' },
        instances: [
          {
            instance: { id: 10, name: 'Test Raid' },
            modes: [
              {
                difficulty: { type: 'HEROIC', name: 'Heroic' },
                status: { type: 'COMPLETE' },
                progress: {
                  completed_count: 2,
                  total_count: 2,
                  encounters: [
                    {
                      encounter: { id: 1234, name: 'Test Boss' },
                      completed_count: 7,
                      last_kill_timestamp: 1792742400000,
                    },
                    { encounter: { id: 1235, name: 'Other Boss' }, completed_count: 0 },
                  ],
                },
              },
              {
                difficulty: { type: 'NORMAL', name: 'Normal' },
                progress: { encounters: [{ encounter: { id: 1234 }, completed_count: 3 }] },
              },
            ],
          },
        ],
      },
    ],
  };

  it('separa chefe por dificuldade e lê a última morte', () => {
    expect(normalizeCharacterEncounters(sample)).toEqual([
      { encounterId: 1234, difficulty: 'HEROIC', completedCount: 7, lastKillAt: '2026-10-23T08:00:00.000Z' },
      { encounterId: 1235, difficulty: 'HEROIC', completedCount: 0, lastKillAt: null },
      { encounterId: 1234, difficulty: 'NORMAL', completedCount: 3, lastKillAt: null },
    ]);
  });

  it('ignora entradas estranhas e formato inesperado', () => {
    expect(normalizeCharacterEncounters(null)).toEqual([]);
    expect(normalizeCharacterEncounters({ expansions: 'x' })).toEqual([]);
    expect(
      normalizeCharacterEncounters({
        expansions: [
          {
            instances: [
              {
                modes: [
                  {
                    difficulty: { type: 'heroic; drop table' },
                    progress: { encounters: [{ encounter: { id: 1 }, completed_count: 1 }] },
                  },
                  {
                    difficulty: { type: 'MYTHIC' },
                    progress: { encounters: [{ encounter: { id: -5 }, completed_count: 1 }] },
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toEqual([]);
  });
});

describe('mascotes e brinquedos', () => {
  it('mascote: nomes, tipo, facção, criatura e origem', () => {
    const pet = normalizePetDetail({
      id: 39,
      name: { en_US: 'Test Pet', pt_BR: 'Mascote de Teste' },
      description: { en_US: 'A test pet.', pt_BR: 'Um mascote de teste.' },
      battle_pet_type: { id: 7, type: 'BEAST', name: { en_US: 'Beast', pt_BR: 'Fera' } },
      source: { type: 'VENDOR', name: { en_US: 'Vendor', pt_BR: 'Vendedor' } },
      is_horde_only: true,
      creature: { id: 2671, name: { en_US: 'Test Creature' } },
    });
    expect(pet).toMatchObject({
      id: '39',
      names: { 'en-US': 'Test Pet', 'pt-BR': 'Mascote de Teste' },
      category: 'BEAST',
      categoryNames: { 'en-US': 'Beast', 'pt-BR': 'Fera' },
      faction: 'HORDE',
      creatureId: 2671,
      sourceType: 'VENDOR',
    });
  });

  it('brinquedo: nome vem do item, mídia do item vira referência', () => {
    const toy = normalizeToyDetail({
      id: 1131,
      item: { id: 54452, name: { en_US: 'Test Toy', pt_BR: 'Brinquedo de Teste' } },
      source: { type: 'DROP', name: { en_US: 'Drop' } },
      media: { id: 54452 },
      should_exclude_if_uncollected: true,
    });
    expect(toy).toMatchObject({
      id: '1131',
      names: { 'pt-BR': 'Brinquedo de Teste' },
      mediaRef: 54452,
      hiddenUntilCollected: true,
    });
    expect(normalizeToyDetail({ id: 1 })).toBeNull();
  });

  it('índices, criatura e ícone', () => {
    expect(normalizeCollectionIndex({ pets: [{ id: 39 }, { id: 39 }, { id: 'x' }] }, 'pets')).toEqual(['39']);
    expect(normalizeCollectionIndex({ toys: [{ id: 1131 }] }, 'toys')).toEqual(['1131']);
    expect(normalizeCollectionIndex({}, 'toys')).toEqual([]);
    expect(normalizeCreatureDisplayId({ creature_displays: [{ id: 5555 }] })).toBe(5555);
    expect(normalizeCreatureDisplayId({})).toBeNull();
    expect(
      normalizeItemIcon({
        assets: [{ key: 'icon', value: 'https://render.worldofwarcraft.com/us/icons/56/inv_toy.jpg' }],
      }),
    ).toBe('https://render.worldofwarcraft.com/us/icons/56/inv_toy.jpg');
    expect(normalizeItemIcon({ assets: [{ key: 'icon', value: 'https://evil.example.com/a.jpg' }] })).toBeNull();
  });

  it('coleções da conta: formato inesperado vira desconhecido (null), nunca vazio', () => {
    expect(
      normalizeAccountPets({ pets: [{ species: { id: 39 } }, { species: { id: 39 } }, { species: { id: 40 } }] }),
    ).toEqual(['39', '40']);
    expect(normalizeAccountToys({ toys: [{ toy: { id: 1131 } }] })).toEqual(['1131']);
    expect(normalizeAccountPets({ something: [] })).toBeNull();
    expect(normalizeAccountToys(null)).toBeNull();
  });
});
