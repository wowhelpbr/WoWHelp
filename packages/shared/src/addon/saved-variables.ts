// Leitor do arquivo SavedVariables do WoWHelp Companion SEM executar Lua.
//
// O arquivo enviado pelo jogador é dado não confiável. Este parser aceita só o
// subconjunto que o jogo escreve: `Nome = { ... }` com tabelas, textos, números,
// true/false/nil e comentários. Qualquer outra coisa (chamada de função,
// operador, variável, concatenação, `function`) é recusada. Há limites de
// tamanho, profundidade e quantidade de itens contra arquivos abusivos.

export type LuaValue = string | number | boolean | null | LuaTable;
export interface LuaTable {
  /** Entradas com chave explícita (string ou número). */
  map: Map<string | number, LuaValue>;
  /** Entradas posicionais ({ a, b, c }). */
  list: LuaValue[];
}

export class SavedVariablesError extends Error {
  constructor(
    readonly code:
      'too_large' | 'syntax' | 'unsupported' | 'too_deep' | 'too_many' | 'string_too_long' | 'wrong_variable',
    readonly position?: number,
  ) {
    super(code);
  }
}

export const LIMITS = { bytes: 512 * 1024, depth: 12, items: 60_000, stringLength: 2048 } as const;

/** Bytes escapados (95s) que formam UTF-8 válido viram o caractere certo (ã). */
function utf8FromBytes(s: string): string {
  if ([...s].some((c) => c.charCodeAt(0) > 255)) return s;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(s, (c) => c.charCodeAt(0)));
  } catch {
    return s;
  }
}

const IDENT = /[A-Za-z_][A-Za-z0-9_]*/y;
const NUMBER = /-?(?:0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/y;

class Parser {
  private pos = 0;
  private items = 0;
  constructor(private readonly src: string) {}

  private fail(code: SavedVariablesError['code']): never {
    throw new SavedVariablesError(code, this.pos);
  }

  /** Pula espaços e comentários (`-- linha` e `--[[ bloco ]]`). */
  private skip() {
    for (;;) {
      while (this.pos < this.src.length && /\s/.test(this.src[this.pos]!)) this.pos++;
      if (this.src.startsWith('--', this.pos)) {
        const block = /^--\[(=*)\[/.exec(this.src.slice(this.pos, this.pos + 64));
        if (block) {
          const end = this.src.indexOf(`]${block[1]}]`, this.pos + block[0].length);
          if (end < 0) this.fail('syntax');
          this.pos = end + block[1]!.length + 2;
        } else {
          const nl = this.src.indexOf('\n', this.pos);
          this.pos = nl < 0 ? this.src.length : nl + 1;
        }
        continue;
      }
      return;
    }
  }

  private peek(s: string): boolean {
    this.skip();
    return this.src.startsWith(s, this.pos);
  }

  private expect(s: string) {
    if (!this.peek(s)) this.fail('syntax');
    this.pos += s.length;
  }

  private ident(): string | null {
    this.skip();
    IDENT.lastIndex = this.pos;
    const m = IDENT.exec(this.src);
    if (!m) return null;
    this.pos += m[0].length;
    return m[0];
  }

  private string(): string {
    this.skip();
    const quote = this.src[this.pos];
    if (quote !== '"' && quote !== "'") this.fail('syntax');
    this.pos++;
    let out = '';
    let escapedHighByte = false;
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos]!;
      if (ch === quote) {
        this.pos++;
        if (out.length > LIMITS.stringLength) this.fail('string_too_long');
        return escapedHighByte ? utf8FromBytes(out) : out;
      }
      if (ch === '\n') this.fail('syntax');
      if (ch === '\\') {
        const next = this.src[this.pos + 1];
        const simple: Record<string, string> = {
          n: '\n',
          t: '\t',
          r: '\r',
          '\\': '\\',
          '"': '"',
          "'": "'",
          '\n': '\n',
          a: '\x07',
          b: '\b',
          f: '\f',
          v: '\v',
        };
        if (next !== undefined && simple[next] !== undefined) {
          out += simple[next];
          this.pos += 2;
          continue;
        }
        const dec = /^\d{1,3}/.exec(this.src.slice(this.pos + 1, this.pos + 4));
        if (dec) {
          const code = Number(dec[0]);
          if (code > 255) this.fail('syntax');
          if (code > 127) escapedHighByte = true;
          out += String.fromCharCode(code);
          this.pos += 1 + dec[0].length;
          continue;
        }
        this.fail('syntax');
      }
      out += ch;
      this.pos++;
      if (out.length > LIMITS.stringLength) this.fail('string_too_long');
    }
    return this.fail('syntax');
  }

  private number(): number {
    this.skip();
    NUMBER.lastIndex = this.pos;
    const m = NUMBER.exec(this.src);
    if (!m) this.fail('syntax');
    this.pos += m[0].length;
    const raw = m[0];
    const n = /^-?0[xX]/.test(raw)
      ? (raw.startsWith('-') ? -1 : 1) * parseInt(raw.replace(/^-?0[xX]/, ''), 16)
      : Number(raw);
    if (!Number.isFinite(n)) this.fail('syntax');
    return n;
  }

  private count() {
    if (++this.items > LIMITS.items) this.fail('too_many');
  }

  value(depth: number): LuaValue {
    if (depth > LIMITS.depth) this.fail('too_deep');
    this.skip();
    const ch = this.src[this.pos];
    if (ch === '{') return this.table(depth + 1);
    if (ch === '"' || ch === "'") return this.string();
    if (ch === '-' || (ch !== undefined && /[0-9.]/.test(ch))) return this.number();
    const save = this.pos;
    const word = this.ident();
    if (word === 'true') return true;
    if (word === 'false') return false;
    if (word === 'nil') return null;
    this.pos = save;
    // Qualquer outra coisa (variável, função, chamada, long string) não é dado.
    return this.fail('unsupported');
  }

  private table(depth: number): LuaTable {
    this.expect('{');
    const t: LuaTable = { map: new Map(), list: [] };
    for (;;) {
      if (this.peek('}')) {
        this.pos++;
        return t;
      }
      this.count();
      if (this.peek('[')) {
        this.pos++;
        this.skip();
        const ch = this.src[this.pos];
        const key = ch === '"' || ch === "'" ? this.string() : this.number();
        this.expect(']');
        this.expect('=');
        t.map.set(key, this.value(depth));
      } else {
        const save = this.pos;
        const name = this.ident();
        if (
          name &&
          !['true', 'false', 'nil'].includes(name) &&
          this.peek('=') &&
          !this.src.startsWith('==', this.pos)
        ) {
          this.pos++;
          t.map.set(name, this.value(depth));
        } else {
          this.pos = save;
          t.list.push(this.value(depth));
        }
      }
      if (this.peek(',') || this.peek(';')) {
        this.pos++;
        continue;
      }
      this.expect('}');
      return t;
    }
  }

  /** Arquivo inteiro: uma ou mais atribuições `Nome = valor`. */
  assignments(): Map<string, LuaValue> {
    const out = new Map<string, LuaValue>();
    for (;;) {
      this.skip();
      if (this.pos >= this.src.length) return out;
      const name = this.ident();
      if (!name) this.fail('syntax');
      this.expect('=');
      out.set(name, this.value(0));
      if (this.peek(';')) this.pos++;
    }
  }
}

/** Lê o texto do SavedVariables e devolve o valor da variável pedida, sem executar nada. */
export function parseSavedVariables(source: string, variable: string): LuaValue {
  if (source.length > LIMITS.bytes) throw new SavedVariablesError('too_large');
  const vars = new Parser(source.replace(/^﻿/, '')).assignments();
  if (!vars.has(variable)) throw new SavedVariablesError('wrong_variable');
  return vars.get(variable)!;
}

/** Converte a tabela Lua num objeto/array JS simples (chaves de texto). */
export function toPlain(v: LuaValue): unknown {
  if (v === null || typeof v !== 'object') return v;
  if (v.map.size === 0) return v.list.map(toPlain);
  // Objeto sem protótipo: chave como __proto__ não consegue poluir nada.
  const obj: Record<string, unknown> = Object.create(null);
  for (const [k, val] of v.map) {
    const key = String(k);
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    obj[key] = toPlain(val);
  }
  if (v.list.length) obj['__list'] = v.list.map(toPlain);
  return obj;
}
