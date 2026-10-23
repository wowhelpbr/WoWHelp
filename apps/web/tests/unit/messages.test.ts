import { describe, expect, it } from 'vitest';
import en from '../../messages/en-US.json';
import pt from '../../messages/pt-BR.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? { ...acc, [path]: value } : { ...acc, ...flatten(value, path) };
  }, {});
}

/** Variáveis ICU de nível superior ({count}, {phase, plural, ...}); ignora o texto dos ramos. */
function placeholders(text: string): string[] {
  const names: string[] = [];
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) names.push(/^\{\s*(\w+)/.exec(text.slice(i))?.[1] ?? '');
      depth++;
    } else if (text[i] === '}') {
      depth--;
    }
  }
  return names.sort();
}

describe('traduções en-US e pt-BR', () => {
  const enFlat = flatten(en as Tree);
  const ptFlat = flatten(pt as Tree);

  it('têm exatamente as mesmas chaves', () => {
    expect(Object.keys(ptFlat).sort()).toEqual(Object.keys(enFlat).sort());
  });

  it('usam as mesmas variáveis em cada mensagem', () => {
    for (const key of Object.keys(enFlat)) {
      expect(placeholders(ptFlat[key] ?? ''), key).toEqual(placeholders(enFlat[key]!));
    }
  });

  it('não têm mensagens vazias', () => {
    for (const [key, value] of Object.entries({ ...enFlat, ...ptFlat })) {
      expect(value.trim().length, key).toBeGreaterThan(0);
    }
  });
});
