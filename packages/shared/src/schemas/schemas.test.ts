import { describe, expect, it } from 'vitest';
import { focusAreasSchema, goalCreateSchema, signUpSchema } from './index';

describe('goalCreateSchema', () => {
  it('apara o título e aplica prioridade padrão', () => {
    expect(goalCreateSchema.parse({ title: '  Juntar ouro  ' })).toEqual({ title: 'Juntar ouro', priority: 3 });
  });

  it('rejeita título vazio ou longo demais', () => {
    expect(goalCreateSchema.safeParse({ title: '   ' }).success).toBe(false);
    expect(goalCreateSchema.safeParse({ title: 'x'.repeat(161) }).success).toBe(false);
  });

  it('rejeita prioridade fora de 1..5', () => {
    expect(goalCreateSchema.safeParse({ title: 'ok', priority: 0 }).success).toBe(false);
    expect(goalCreateSchema.safeParse({ title: 'ok', priority: '6' }).success).toBe(false);
    expect(goalCreateSchema.parse({ title: 'ok', priority: '1' }).priority).toBe(1);
  });
});

describe('focusAreasSchema', () => {
  it('remove duplicatas e mantém a ordem canônica', () => {
    expect(focusAreasSchema.parse(['weekly', 'mounts', 'weekly'])).toEqual(['mounts', 'weekly']);
  });

  it('rejeita área desconhecida', () => {
    expect(focusAreasSchema.safeParse(['mounts', 'hacking']).success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('exige letras e números com pelo menos 8 caracteres', () => {
    expect(signUpSchema.safeParse({ email: 'a@b.co', password: 'abcdefgh' }).success).toBe(false);
    expect(signUpSchema.safeParse({ email: 'a@b.co', password: '12345678' }).success).toBe(false);
    expect(signUpSchema.safeParse({ email: 'a@b.co', password: 'abcd1234' }).success).toBe(true);
  });

  it('rejeita e-mail inválido', () => {
    expect(signUpSchema.safeParse({ email: 'nope', password: 'abcd1234' }).success).toBe(false);
  });
});
