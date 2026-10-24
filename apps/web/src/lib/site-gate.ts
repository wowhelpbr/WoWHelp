// Site privado (fase de testes): ligado e com a senha definida pelo Bruno na
// administração (tabela site_settings). A senha fica só como hash PBKDF2; quem
// acerta recebe um cookie assinado com esse hash, então trocar a senha derruba
// todos os acessos. Usado no proxy: só Web Crypto e fetch.

export const GATE_COOKIE = 'wowhelp_gate';
export const GATE_MAX_AGE = 30 * 86_400;
export const PBKDF2_ITERATIONS = 210_000;

export interface GateSettings {
  private: boolean;
  passwordHash: string | null;
  passwordSalt: string | null;
  passwordIterations: number | null;
}

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (s: string) => new Uint8Array(s.match(/../g)!.map((b) => parseInt(b, 16)));

/** Hash da senha (PBKDF2-SHA256, 32 bytes em hexadecimal). */
export async function hashPassword(password: string, saltHex: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations },
    key,
    256,
  );
  return hex(bits);
}

export function newSalt(): string {
  return hex(crypto.getRandomValues(new Uint8Array(16)).buffer as ArrayBuffer);
}

/** Valor do cookie de acesso: assinatura derivada do hash atual da senha. */
export async function gateToken(passwordHash: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(passwordHash), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode('wowhelp-gate-v1')));
}

/** Comparação em tempo constante (não vaza quanto do texto bateu). */
export function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Tarefas agendadas e a verificação de saúde passam com o CRON_SECRET. */
export function isMonitor(authorization: string | null): boolean {
  const secret = process.env.CRON_SECRET ?? '';
  return secret.length >= 16 && authorization !== null && sameText(authorization, `Bearer ${secret}`);
}

let cached: { at: number; value: GateSettings } | null = null;
const CACHE_MS = 30_000;

/**
 * Configuração atual (cache de 30 s por servidor, para não consultar o banco
 * a cada página). Sem banco configurado ou com erro de leitura, o site fica aberto.
 */
export async function getGateSettings(): Promise<GateSettings> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  const closed: GateSettings = { private: false, passwordHash: null, passwordSalt: null, passwordIterations: null };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return closed;
  try {
    const res = await fetch(
      `${url}/rest/v1/site_settings?id=eq.true&select=private,password_hash,password_salt,password_iterations`,
      { headers: { apikey: key }, cache: 'no-store', signal: AbortSignal.timeout(3000) },
    );
    const rows = (await res.json()) as {
      private: boolean;
      password_hash: string | null;
      password_salt: string | null;
      password_iterations: number | null;
    }[];
    const row = Array.isArray(rows) ? rows[0] : undefined;
    const value: GateSettings = row
      ? {
          private: row.private === true && Boolean(row.password_hash),
          passwordHash: row.password_hash,
          passwordSalt: row.password_salt,
          passwordIterations: row.password_iterations,
        }
      : closed;
    cached = { at: Date.now(), value };
    return value;
  } catch {
    return cached?.value ?? closed;
  }
}

/** Depois de salvar na administração: o próximo pedido lê de novo (neste servidor). */
export function clearGateCache() {
  cached = null;
}
