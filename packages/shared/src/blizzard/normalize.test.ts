import { describe, expect, it } from 'vitest';
import {
  apiLocaleFor,
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
