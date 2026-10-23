export type AuthErrorCode =
  | 'invalid_input'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_already_exists'
  | 'weak_password'
  | 'rate_limited'
  | 'not_configured'
  | 'unknown';

/** Traduz códigos de erro do Supabase Auth para os códigos exibidos na UI. */
export function mapAuthError(error: { code?: string; status?: number } | null | undefined): AuthErrorCode {
  if (!error) return 'unknown';
  switch (error.code) {
    case 'invalid_credentials':
      return 'invalid_credentials';
    case 'email_not_confirmed':
      return 'email_not_confirmed';
    case 'user_already_exists':
    case 'email_exists':
      return 'user_already_exists';
    case 'weak_password':
      return 'weak_password';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'rate_limited';
  }
  if (error.status === 429) return 'rate_limited';
  return 'unknown';
}
