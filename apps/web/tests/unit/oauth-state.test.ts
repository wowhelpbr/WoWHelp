import { describe, expect, it } from 'vitest';
import { decodeOAuthState, encodeOAuthState, sameState } from '@/features/battlenet/oauth-state';

const valid = {
  state: 'a'.repeat(43),
  region: 'us' as const,
  locale: 'pt-BR' as const,
  userId: '11111111-1111-4111-8111-111111111111',
};

describe('cookie de state da Battle.net', () => {
  it('ida e volta preserva os dados', () => {
    expect(decodeOAuthState(encodeOAuthState(valid))).toEqual(valid);
  });

  it('rejeita conteúdo adulterado ou inválido', () => {
    const forged = Buffer.from(JSON.stringify({ s: 'curto', r: 'us', l: 'pt-BR', u: valid.userId })).toString(
      'base64url',
    );
    expect(decodeOAuthState(forged)).toBeNull();
    const badRegion = Buffer.from(JSON.stringify({ s: valid.state, r: 'cn', l: 'pt-BR', u: valid.userId })).toString(
      'base64url',
    );
    expect(decodeOAuthState(badRegion)).toBeNull();
    expect(decodeOAuthState('não é base64 válido{')).toBeNull();
    expect(decodeOAuthState(undefined)).toBeNull();
    expect(decodeOAuthState('x'.repeat(2000))).toBeNull();
  });

  it('compara state sem atalho por tamanho igual', () => {
    expect(sameState('abc', 'abc')).toBe(true);
    expect(sameState('abc', 'abd')).toBe(false);
    expect(sameState('abc', 'abcd')).toBe(false);
  });
});
