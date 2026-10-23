import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error luaparse não traz tipos
import luaparse from 'luaparse';
import { describe, expect, it } from 'vitest';

// Confere a sintaxe dos arquivos Lua do addon (Lua 5.1, como o WoW) e o .toc.
const dir = fileURLToPath(new URL('../../../../addon/WoWHelpCompanion', import.meta.url));

describe('addon WoWHelp Companion', () => {
  const toc = readFileSync(join(dir, 'WoWHelpCompanion.toc'), 'utf8');
  const listed = toc
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter((l: string) => l && !l.startsWith('#'));

  it('o .toc declara interface do Midnight e a SavedVariable certa', () => {
    expect(toc).toMatch(/^## Interface: 1201\d\d/m);
    expect(toc).toMatch(/^## SavedVariables: WoWHelpCompanionDB$/m);
  });

  it('todo arquivo listado no .toc existe e todo .lua está listado', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.lua'));
    expect([...listed].sort()).toEqual([...files].sort());
  });

  it.each(listed)('%s tem sintaxe Lua 5.1 válida', (file) => {
    expect(() => luaparse.parse(readFileSync(join(dir, file), 'utf8'), { luaVersion: '5.1' })).not.toThrow();
  });

  it('nenhum arquivo usa rede, execução dinâmica ou combate', () => {
    for (const file of listed) {
      const src = readFileSync(join(dir, file), 'utf8');
      expect(src, file).not.toMatch(/loadstring|RunScript|COMBAT_LOG_EVENT|SendAddonMessage|C_ChatInfo|socket|http/i);
    }
  });
});
