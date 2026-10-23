/**
 * Endereço público do site, sem barra no final.
 * - Produção: NEXT_PUBLIC_SITE_URL (definida só no ambiente Production da Vercel).
 * - Preview da Vercel: o endereço do próprio deploy (VERCEL_BRANCH_URL ou VERCEL_URL).
 * - Local: http://localhost:3100.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const vercelHost = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;
  return 'http://localhost:3100';
}
