import { describe, expect, it } from 'vitest';
import { mapAuthError } from '@/features/auth/errors';

describe('mapAuthError', () => {
  it('traduz códigos conhecidos do Supabase Auth', () => {
    expect(mapAuthError({ code: 'invalid_credentials' })).toBe('invalid_credentials');
    expect(mapAuthError({ code: 'email_exists' })).toBe('user_already_exists');
    expect(mapAuthError({ code: 'over_email_send_rate_limit' })).toBe('rate_limited');
    expect(mapAuthError({ status: 429 })).toBe('rate_limited');
  });

  it('nunca repassa mensagens internas: o desconhecido vira unknown', () => {
    expect(mapAuthError({ code: 'something_new', status: 500 })).toBe('unknown');
    expect(mapAuthError(null)).toBe('unknown');
  });
});
