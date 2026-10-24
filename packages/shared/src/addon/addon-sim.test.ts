import { describe, expect, it } from 'vitest';
import { readAddonSnapshot } from './snapshot';
import { WowSession } from './wow-sim';

// O addon de verdade rodando num Lua de verdade, com o WoW de mentira:
// o arquivo que ele grava tem que ser aceito pelo leitor do site.

const read = (sv: string) => {
  const r = readAddonSnapshot(sv);
  if (!r.ok) throw new Error(`site recusou o arquivo: ${r.code}\n${sv}`);
  return r.snapshot;
};

describe('addon no WoW de mentira', () => {
  it('primeiro login: grava personagem, região, reset e montarias coletadas', () => {
    const game = new WowSession();
    game.login();
    const s = read(game.logout());
    expect(s).toMatchObject({
      addonVersion: '0.1.0',
      region: 'us',
      observedAt: '2026-10-23T08:00:00.000Z',
      weeklyResetAt: '2026-10-24T14:00:00.000Z',
      client: { version: '12.1.5', interface: 120105 },
      mounts: { ids: ['6', '7'] },
    });
    expect(s.characters).toEqual([
      expect.objectContaining({
        guid: 'Player-1234-0ABCDEF0',
        name: 'Testmage',
        realmSlug: 'TestRealm',
        level: 80,
        className: 'Mago',
        raceName: 'Anão',
        faction: 'ALLIANCE',
      }),
    ]);
  });

  it('segundo personagem em outra sessão: os dois ficam no arquivo', () => {
    const first = new WowSession();
    first.login();
    const sv1 = first.logout();

    const second = new WowSession(sv1);
    second.run(
      `__player.guid = "Player-1234-0ABCDEF1"; __player.name = "Testwarrior"; __player.faction = "Horde"; __player.level = 42`,
    );
    second.login();
    const s = read(second.logout());
    expect(s.characters.map((c) => c.name).sort()).toEqual(['Testmage', 'Testwarrior']);
    expect(s.characters.find((c) => c.name === 'Testwarrior')).toMatchObject({ faction: 'HORDE', level: 42 });
  });

  it('em combate no login: espera sair do combate para ler', () => {
    const game = new WowSession();
    game.run('__combat = true');
    game.login();
    expect(game.run('return tostring(next(WoWHelpCompanionDB.characters) ~= nil)')).toBe('false');
    game.run('__combat = false');
    game.fire('PLAYER_REGEN_ENABLED');
    expect(read(game.logout()).characters).toHaveLength(1);
  });

  it('montaria nova durante o jogo atualiza a lista', () => {
    const game = new WowSession();
    game.login();
    game.run('__mounts[8] = true; __now = __now + 600');
    game.fire('NEW_MOUNT_ADDED');
    expect(read(game.logout()).mounts?.ids).toEqual(['6', '7', '8']);
  });

  it('sem a API de montarias: coleção fica desconhecida, não vazia', () => {
    const game = new WowSession();
    game.run('C_MountJournal = nil; C_DateAndTime = nil');
    game.login();
    const s = read(game.logout());
    expect(s.mounts).toBeNull();
    expect(s.weeklyResetAt).toBeNull();
    expect(s.characters).toHaveLength(1);
  });

  it('arquivo de versão futura ou corrompido recomeça do zero', () => {
    for (const old of ['WoWHelpCompanionDB = { ["schemaVersion"] = 99 }', 'WoWHelpCompanionDB = "lixo"']) {
      const game = new WowSession(old);
      game.login();
      const s = read(game.logout());
      expect(s.characters).toHaveLength(1);
    }
  });

  it('guarda no máximo 60 personagens', () => {
    const game = new WowSession();
    game.login();
    game.run(`for i = 1, 70 do
      __player.guid = string.format("Player-1234-%08X", i); __player.name = "Alt" .. i; __now = __now + 1
      __fire("PLAYER_LOGIN")
    end`);
    expect(read(game.logout()).characters).toHaveLength(60);
  });

  it('/wowhelp mostra o status sem erro', () => {
    const game = new WowSession();
    game.login();
    game.run('SlashCmdList.WOWHELP("")');
    const printed = game.run('return table.concat(__printed, "\\n")');
    expect(printed).toContain('WoWHelp Companion');
    expect(printed).toContain('1 personagem(ns) salvo(s); 2 montarias coletadas');
  });
});
