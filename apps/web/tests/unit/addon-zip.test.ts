import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { addonVersion, buildAddonZip, DOWNLOADS_DIR, zipFileName } from '../../scripts/build-addon-zip.mjs';
import { ADDON_DOWNLOAD } from '@/features/addon/download';

describe('zip do addon para download', () => {
  it('a versão do site é a mesma do .toc', () => {
    expect(ADDON_DOWNLOAD.version).toBe(addonVersion());
    expect(ADDON_DOWNLOAD.href).toBe(`/downloads/${zipFileName(addonVersion())}`);
  });

  it('o zip publicado está igual ao código do addon (rode npm run addon:zip -w @wowhelp/web)', () => {
    const file = path.join(DOWNLOADS_DIR, zipFileName(addonVersion()));
    expect(existsSync(file)).toBe(true);
    const { files, zip } = buildAddonZip();
    expect(files).toContain('WoWHelpCompanion.toc');
    expect(readFileSync(file).equals(zip)).toBe(true);
  });
});
