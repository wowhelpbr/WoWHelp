/**
 * Aceita só caminhos relativos do próprio site para o parâmetro `next`
 * (evita open redirect). Qualquer outra coisa cai no fallback.
 */
export function safeNextPath(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  // Barra invertida e caracteres de controle permitem truques como "/\evil.com".
  if (value.includes('\\') || [...value].some((ch) => ch.charCodeAt(0) < 0x20)) return fallback;
  try {
    const url = new URL(value, 'https://wowhelp.invalid');
    if (url.origin !== 'https://wowhelp.invalid') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
