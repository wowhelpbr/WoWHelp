import { describe, expect, it } from 'vitest';
import { mountStatusFor, type StoredObservation } from './mount-status';

const now = new Date('2026-10-23T12:00:00Z');
const recent = '2026-10-22T12:00:00Z';
const old = '2026-09-01T12:00:00Z';

const obs = (
  id: string,
  source: StoredObservation['source'],
  status: StoredObservation['status'] = 'collected',
  at = recent,
) => ({
  externalItemId: id,
  status,
  source,
  observedAt: at,
});

describe('mountStatusFor', () => {
  it('sem sincronização e sem marcação: desconhecido', () => {
    expect(mountStatusFor('6', [], { syncedAt: null, now }).status).toBe('unknown');
  });

  it('na lista da Blizzard: coletada', () => {
    expect(mountStatusFor('6', [obs('6', 'blizzard_api')], { syncedAt: recent, now })).toMatchObject({
      status: 'collected',
      source: 'blizzard_api',
    });
  });

  it('fora da lista com sincronização válida: não obtida', () => {
    expect(mountStatusFor('7', [obs('6', 'blizzard_api')], { syncedAt: recent, now })).toMatchObject({
      status: 'not_collected',
      source: 'blizzard_api',
    });
  });

  it('fora da lista com sincronização vencida: desconhecido', () => {
    expect(mountStatusFor('7', [], { syncedAt: old, now }).status).toBe('unknown');
  });

  it('marcação manual mais recente vence a sincronização antiga', () => {
    const manual = obs('7', 'manual', 'collected', '2026-10-23T10:00:00Z');
    expect(mountStatusFor('7', [manual], { syncedAt: recent, now })).toMatchObject({
      status: 'collected',
      source: 'manual',
    });
  });

  it('sincronização futura (relógio errado) não vale', () => {
    expect(mountStatusFor('7', [], { syncedAt: '2027-01-01T00:00:00Z', now }).status).toBe('unknown');
  });
});
