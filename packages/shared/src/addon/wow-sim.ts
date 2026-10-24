// Roda o addon WoWHelp Companion num Lua de verdade (fengari, Lua 5.3 em JS)
// com o WoW de mentira (wow-mock.lua). Só para testes.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// fengari não tem tipos publicados.
// @ts-ignore
import * as fengari from 'fengari';

const { lua, lauxlib, lualib, to_luastring } = fengari as unknown as {
  lua: {
    LUA_OK: number;
    lua_tojsstring(L: unknown, i: number): string;
    lua_settop(L: unknown, i: number): void;
  };
  lauxlib: { luaL_newstate(): unknown; luaL_dostring(L: unknown, s: Uint8Array): number };
  lualib: { luaL_openlibs(L: unknown): void };
  to_luastring(s: string): Uint8Array;
};

const here = path.dirname(fileURLToPath(import.meta.url));
const ADDON_DIR = path.resolve(here, '../../../../addon/WoWHelpCompanion');

function tocFiles(): string[] {
  return readFileSync(path.join(ADDON_DIR, 'WoWHelpCompanion.toc'), 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/** Uma sessão do jogo: carrega o SavedVariables anterior (se houver) e o addon. */
export class WowSession {
  private readonly L = lauxlib.luaL_newstate();

  constructor(previousSavedVariables?: string) {
    lualib.luaL_openlibs(this.L);
    this.run(readFileSync(path.join(here, 'wow-mock.lua'), 'utf8'));
    // O jogo carrega o arquivo salvo antes do addon (define a variável global).
    if (previousSavedVariables) this.run(previousSavedVariables);
    this.run('__ns = {}');
    for (const file of tocFiles()) {
      const source = readFileSync(path.join(ADDON_DIR, file), 'utf8');
      if (source.includes(']=====]')) throw new Error(`delimitador dentro de ${file}`);
      this.run(`assert(load([=====[${source}]=====], "@${file}"))("WoWHelpCompanion", __ns)`);
    }
  }

  /** Executa Lua e devolve o resultado como texto (ou "" se não houver). */
  run(code: string): string {
    const status = lauxlib.luaL_dostring(this.L, to_luastring(code));
    const top = lua.lua_tojsstring(this.L, -1);
    lua.lua_settop(this.L, 0);
    if (status !== lua.LUA_OK) throw new Error(`Lua: ${top}`);
    return top ?? '';
  }

  fire(event: string, arg?: string) {
    this.run(
      arg === undefined
        ? `__fire(${JSON.stringify(event)})`
        : `__fire(${JSON.stringify(event)}, ${JSON.stringify(arg)})`,
    );
  }

  /** ADDON_LOADED + PLAYER_LOGIN, como no login. */
  login() {
    this.fire('ADDON_LOADED', 'WoWHelpCompanion');
    this.fire('PLAYER_LOGIN');
  }

  /** PLAYER_LOGOUT e o arquivo que o jogo gravaria no disco. */
  logout(): string {
    this.fire('PLAYER_LOGOUT');
    return this.run('return __savedVariables()');
  }
}
