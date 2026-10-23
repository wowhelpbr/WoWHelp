// Gera public/downloads/WoWHelpCompanion-<versão>.zip a partir de addon/WoWHelpCompanion.
// O zip é sempre igual para os mesmos arquivos (sem compressão, data fixa e
// fim de linha LF), então o teste unitário consegue conferir se está atualizado.
// Uso: npm run addon:zip -w @wowhelp/web

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ADDON_NAME = 'WoWHelpCompanion';
export const ADDON_DIR = path.resolve(here, '../../../addon', ADDON_NAME);
export const DOWNLOADS_DIR = path.resolve(here, '../public/downloads');

export function addonVersion() {
  const toc = readFileSync(path.join(ADDON_DIR, `${ADDON_NAME}.toc`), 'utf8');
  const match = toc.match(/^## Version: (\d+\.\d+\.\d+)\s*$/m);
  if (!match) throw new Error('Versão não encontrada no .toc');
  return match[1];
}

export const zipFileName = (version) => `${ADDON_NAME}-${version}.zip`;

// 01/01/2026 00:00 no formato de data do MS-DOS usado pelo zip.
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

export function buildAddonZip() {
  const files = readdirSync(ADDON_DIR)
    .filter((f) => /\.(lua|toc|md)$/.test(f))
    .sort();
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const file of files) {
    const text = readFileSync(path.join(ADDON_DIR, file), 'utf8').replace(/\r\n/g, '\n');
    const data = Buffer.from(text, 'utf8');
    const name = Buffer.from(`${ADDON_NAME}/${file}`, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // versão mínima
    local.writeUInt16LE(0x0800, 6); // nomes em UTF-8
    local.writeUInt16LE(0, 8); // sem compressão
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);

  return { files, zip: Buffer.concat([...locals, ...centrals, end]) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const version = addonVersion();
  const { files, zip } = buildAddonZip();
  rmSync(DOWNLOADS_DIR, { recursive: true, force: true });
  mkdirSync(DOWNLOADS_DIR, { recursive: true });
  writeFileSync(path.join(DOWNLOADS_DIR, zipFileName(version)), zip);
  console.log(`${zipFileName(version)}: ${files.length} arquivos, ${zip.length} bytes`);
}
