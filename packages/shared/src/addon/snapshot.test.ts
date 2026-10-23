import { describe, expect, it } from 'vitest';
import { LIMITS, parseSavedVariables } from './saved-variables';
import { readAddonSnapshot } from './snapshot';

// Amostra no formato que o jogo escreve (chaves entre colchetes, comentários
// "-- [n]" nas listas). Dados de TESTE, não de um personagem real.
export const SAMPLE = `
WoWHelpCompanionDB = {
["schemaVersion"] = 1,
["addonVersion"] = "0.1.0",
["lastObservedAt"] = 1792742400,
["region"] = "us",
["client"] = {
["version"] = "12.1.5",
["build"] = "70529",
["interface"] = 120105,
},
["weeklyResetAt"] = 1793113200,
["account"] = {
["mounts"] = {
["available"] = true,
["observedAt"] = 1792742400,
["collected"] = {
6, -- [1]
7, -- [2]
6, -- [3]
},
},
},
["characters"] = {
["Player-1234-0ABCDEF0"] = {
["name"] = "Testmage",
["realm"] = "Test Realm",
["realmSlug"] = "TestRealm",
["level"] = 80,
["classId"] = 8,
["className"] = "Mago",
["classFile"] = "MAGE",
["raceId"] = 3,
["raceName"] = "An\\227o",
["faction"] = "Alliance",
["observedAt"] = 1792742400,
},
},
}
`;

describe('readAddonSnapshot', () => {
  it('lê a amostra no formato do jogo', () => {
    const r = readAddonSnapshot(SAMPLE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.snapshot).toMatchObject({
      addonVersion: '0.1.0',
      region: 'us',
      observedAt: '2026-10-23T08:00:00.000Z',
      mounts: { ids: ['6', '7'] },
    });
    expect(r.snapshot.characters).toEqual([
      expect.objectContaining({
        guid: 'Player-1234-0ABCDEF0',
        name: 'Testmage',
        level: 80,
        faction: 'ALLIANCE',
        realmSlug: 'TestRealm',
      }),
    ]);
  });

  it('coleção indisponível vira desconhecida (null), não vazia', () => {
    const r = readAddonSnapshot(SAMPLE.replace('["available"] = true', '["available"] = false'));
    expect(r.ok && r.snapshot.mounts).toBeNull();
  });

  it('versão de dados desconhecida é recusada', () => {
    const r = readAddonSnapshot(SAMPLE.replace('["schemaVersion"] = 1', '["schemaVersion"] = 9'));
    expect(r).toEqual({ ok: false, code: 'unsupported_version' });
  });

  it('variável de outro addon é recusada', () => {
    expect(readAddonSnapshot('OutroAddonDB = { ["x"] = 1 }')).toEqual({ ok: false, code: 'wrong_variable' });
  });
});

describe('arquivos maliciosos ou quebrados são recusados sem executar nada', () => {
  const cases: [string, string, string][] = [
    ['chamada de função', 'WoWHelpCompanionDB = os.execute("rm -rf /")', 'unsupported'],
    ['loadstring', 'WoWHelpCompanionDB = loadstring("x")()', 'unsupported'],
    ['função no valor', 'WoWHelpCompanionDB = { ["a"] = function() end }', 'unsupported'],
    ['concatenação', 'WoWHelpCompanionDB = { ["a"] = "x" .. "y" }', 'syntax'],
    ['variável como valor', 'WoWHelpCompanionDB = { ["a"] = _G }', 'unsupported'],
    ['texto sem fim', 'WoWHelpCompanionDB = { ["a"] = "aberto }', 'syntax'],
    ['comentário de bloco sem fim', 'WoWHelpCompanionDB = { --[[ nunca fecha', 'syntax'],
  ];

  it.each(cases)('%s', (_name, source, code) => {
    expect(readAddonSnapshot(source)).toEqual({ ok: false, code });
  });

  it('profundidade excessiva', () => {
    const deep = 'WoWHelpCompanionDB = ' + '{'.repeat(LIMITS.depth + 5) + '}'.repeat(LIMITS.depth + 5);
    expect(readAddonSnapshot(deep)).toEqual({ ok: false, code: 'too_deep' });
  });

  it('arquivo grande demais', () => {
    const big = 'WoWHelpCompanionDB = { ["a"] = "' + 'x'.repeat(10) + '" }' + ' '.repeat(LIMITS.bytes);
    expect(readAddonSnapshot(big)).toEqual({ ok: false, code: 'too_large' });
  });

  it('itens demais', () => {
    const many = 'WoWHelpCompanionDB = {' + '1,'.repeat(LIMITS.items + 1) + '}';
    expect(readAddonSnapshot(many)).toEqual({ ok: false, code: 'too_many' });
  });

  it('chave __proto__ não polui objetos', () => {
    parseSavedVariables('WoWHelpCompanionDB = { ["__proto__"] = { ["polluted"] = true } }', 'WoWHelpCompanionDB');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    const r = readAddonSnapshot(
      SAMPLE.replace('["region"] = "us",', '["region"] = "us", ["__proto__"] = { ["x"] = 1 },'),
    );
    expect(r.ok).toBe(true);
  });

  it('campos fora do formato são recusados (ex.: GUID inválido)', () => {
    expect(readAddonSnapshot(SAMPLE.replace('Player-1234-0ABCDEF0', '../etc/passwd'))).toEqual({
      ok: false,
      code: 'invalid_format',
    });
  });

  it('bytes UTF-8 escapados viram o acento certo', () => {
    const utf8 = SAMPLE.replace(String.raw`An\227o`, String.raw`An\195\163o`);
    const r = readAddonSnapshot(utf8);
    expect(r.ok && r.snapshot.characters[0]!.raceName).toBe('Anão');
  });

  it('decodifica escapes decimais do Lua (\\227 = ã em Latin-1 do teste)', () => {
    const r = readAddonSnapshot(SAMPLE);
    expect(r.ok && r.snapshot.characters[0]!.raceName).toBe('Anão');
  });
});
