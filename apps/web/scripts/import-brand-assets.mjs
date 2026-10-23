// Importa a marca e as ilustrações oficiais (cessão de direitos: Elianai dos
// Santos, 28/10/2020) para o app, em versões otimizadas para web.
// Só LÊ os originais; nunca altera a pasta de origem.
//
// Uso: node apps/web/scripts/import-brand-assets.mjs ["caminho/para/Ilustrações Elianai"]
// Padrão: docs/Artes WoWhelp/Ilustrações Elianai (fora do git).
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const webRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(webRoot, '..', '..');
const source = path.resolve(process.argv[2] ?? path.join(repoRoot, 'docs', 'Artes WoWhelp', 'Ilustrações Elianai'));
const assetsOut = path.join(webRoot, 'src', 'assets', 'brand');
const iconsOut = path.join(webRoot, 'public', 'icons');
const BG = '#090e22';

await mkdir(path.join(assetsOut, 'classes'), { recursive: true });
await mkdir(iconsOut, { recursive: true });

const src = (...parts) => path.join(source, ...parts);
const log = (file) => console.log('ok', path.relative(repoRoot, file));

async function webp(input, output, width, quality = 82) {
  await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, alphaQuality: 90, effort: 6 })
    .toFile(output);
  log(output);
}

// Logotipo (wordmark) e medalhão.
await webp(src('ICON_WoWHELP', 'wowhelp_BIGtitle_upgrade.png'), path.join(assetsOut, 'wordmark.webp'), 1200, 88);
await webp(src('ICON_WoWHELP', 'Icon_no_BG.png'), path.join(assetsOut, 'medallion.webp'), 384, 88);

// Ilustrações de classe usadas no site. As demais entram quando houver tela para elas.
const CLASSES = {
  mage: 'mage.png',
  monk: 'monk.png',
  priest: 'priest.png',
  warrior: 'warrior.png',
};
for (const [name, file] of Object.entries(CLASSES)) {
  await webp(src('artes', file), path.join(assetsOut, 'classes', `${name}.webp`), 1400);
}

// Ícones do PWA a partir do medalhão.
const medallion = sharp(src('ICON_WoWHELP', 'Icon_no_BG.png'));
async function icon(size, output, { scale = 1, background = null } = {}) {
  const inner = Math.round(size * scale);
  const mark = await medallion.clone().resize(inner, inner).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(output);
  log(output);
}
await icon(192, path.join(iconsOut, 'icon-192.png'));
await icon(512, path.join(iconsOut, 'icon-512.png'));
// Maskable: o sistema pode recortar até 20% das bordas; medalhão em 72% com fundo cheio.
await icon(512, path.join(iconsOut, 'icon-maskable-512.png'), { scale: 0.72, background: BG });
await icon(180, path.join(webRoot, 'src', 'app', 'apple-icon.png'), { scale: 0.86, background: BG });
await icon(64, path.join(webRoot, 'src', 'app', 'icon.png'));

await writeFile(
  path.join(assetsOut, 'CREDITS.md'),
  `# Créditos da marca e ilustrações

Logotipo, ícone e ilustrações de classe: **Elianai dos Santos (eliz00r)**.
Direitos patrimoniais cedidos ao WoWHelp (contrato de 28/10/2020). A autora mantém
os direitos morais: o crédito precisa aparecer no site (rodapé).

Arquivos gerados por \`apps/web/scripts/import-brand-assets.mjs\` a partir dos
originais, que não ficam no repositório.

As ilustrações retratam raças e classes de World of Warcraft (propriedade
intelectual da Blizzard Entertainment). Ver docs/fase-0/inventario-de-assets.md.
`,
);
console.log('ok', 'CREDITS.md');
