import { describe, expect, it } from 'vitest';
import { safeNextPath } from '@/lib/safe-redirect';

const fallback = '/en/dashboard';

describe('safeNextPath', () => {
  it('aceita caminho relativo do próprio site', () => {
    expect(safeNextPath('/pt-br/settings', fallback)).toBe('/pt-br/settings');
    expect(safeNextPath('/en/mounts?x=1#top', fallback)).toBe('/en/mounts?x=1#top');
  });

  it.each([
    'https://evil.example/',
    '//evil.example/path',
    String.raw`/\evil.example`,
    String.raw`\\evil.example`,
    'javascript:alert(1)',
    '/en/%0d%0aSet-Cookie:x',
    'en/dashboard',
    '',
    null,
    undefined,
    42,
  ])('rejeita %s', (value) => {
    const result = safeNextPath(value, fallback);
    expect(result.startsWith('/')).toBe(true);
    expect(result.startsWith('//')).toBe(false);
    if (typeof value !== 'string' || !value.startsWith('/en/%0d')) expect(result).toBe(fallback);
  });

  it('rejeita caracteres de controle', () => {
    expect(safeNextPath('/en/\tdashboard', fallback)).toBe(fallback);
  });
});
