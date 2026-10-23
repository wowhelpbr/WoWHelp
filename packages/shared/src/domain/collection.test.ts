import { describe, expect, it } from 'vitest';
import { getFreshness, normalizeCollectionStatus, resolveCollectionStatus } from './collection';

describe('normalizeCollectionStatus', () => {
  it('mantém os três estados válidos', () => {
    expect(normalizeCollectionStatus('collected')).toBe('collected');
    expect(normalizeCollectionStatus('not_collected')).toBe('not_collected');
    expect(normalizeCollectionStatus('unknown')).toBe('unknown');
  });

  it.each([undefined, null, '', 'missing', 0, false, {}])(
    'valor ausente ou estranho (%s) vira unknown, nunca not_collected',
    (value) => {
      expect(normalizeCollectionStatus(value)).toBe('unknown');
    },
  );
});

describe('resolveCollectionStatus', () => {
  it('sem observações é unknown', () => {
    expect(resolveCollectionStatus([]).status).toBe('unknown');
  });

  it('unknown mais recente não apaga um estado conhecido', () => {
    const result = resolveCollectionStatus([
      { status: 'collected', source: 'blizzard_api', observedAt: '2026-10-01T00:00:00Z' },
      { status: 'unknown', source: 'addon_import', observedAt: '2026-10-20T00:00:00Z' },
    ]);
    expect(result.status).toBe('collected');
  });

  it('vence a observação conhecida mais recente', () => {
    const result = resolveCollectionStatus([
      { status: 'not_collected', source: 'blizzard_api', observedAt: '2026-10-01T00:00:00Z' },
      { status: 'collected', source: 'manual', observedAt: '2026-10-02T00:00:00Z' },
    ]);
    expect(result).toMatchObject({ status: 'collected', source: 'manual' });
  });

  it('em empate de horário vence a fonte mais confiável', () => {
    const result = resolveCollectionStatus([
      { status: 'collected', source: 'manual', observedAt: '2026-10-01T00:00:00Z' },
      { status: 'not_collected', source: 'blizzard_api', observedAt: '2026-10-01T00:00:00Z' },
    ]);
    expect(result.source).toBe('blizzard_api');
  });

  it('ignora datas inválidas', () => {
    const result = resolveCollectionStatus([{ status: 'collected', source: 'manual', observedAt: 'ontem' }]);
    expect(result.status).toBe('unknown');
  });
});

describe('getFreshness', () => {
  const now = new Date('2026-10-23T12:00:00Z');

  it('sem data é unknown', () => {
    expect(getFreshness(null, now, 24)).toBe('unknown');
    expect(getFreshness('não é data', now, 24)).toBe('unknown');
  });

  it('dentro da janela é fresh, fora é stale', () => {
    expect(getFreshness('2026-10-23T00:00:00Z', now, 24)).toBe('fresh');
    expect(getFreshness('2026-10-21T00:00:00Z', now, 24)).toBe('stale');
  });
});
