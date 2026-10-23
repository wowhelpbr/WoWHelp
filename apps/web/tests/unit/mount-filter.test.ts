import type { CollectionStatus } from '@wowhelp/shared';
import { describe, expect, it } from 'vitest';
import { filterMounts, parseFilters, sourceOptions } from '@/features/catalog/filter';
import type { MountEntry } from '@/features/catalog/queries';

const m = (externalId: string, name: string, extra: Partial<MountEntry> = {}): MountEntry => ({
  id: externalId,
  externalId,
  source: 'blizzard_api',
  name,
  summary: null,
  sourceType: 'VENDOR',
  sourceName: 'Vendedor',
  faction: null,
  hiddenUntilCollected: false,
  fetchedAt: null,
  lastReviewedAt: null,
  imageUrl: null,
  kind: 'mount',
  category: null,
  categoryName: null,
  ...extra,
});

const mounts = [
  m('1', 'Lobo Cinzento', { faction: 'HORDE', sourceType: 'DROP', sourceName: 'Saque' }),
  m('2', 'Cavalo Pardo', { faction: 'ALLIANCE' }),
  m('3', 'Dragão Neutro'),
  m('4', 'Montaria Escondida', { hiddenUntilCollected: true }),
];

const none = { q: '', source: '', category: '', faction: '' as const, status: '' as const };

describe('filterMounts', () => {
  it('esconde as ocultas até coletar', () => {
    expect(filterMounts(mounts, none).map((x) => x.externalId)).toEqual(['1', '2', '3']);
    expect(
      filterMounts(mounts, none, (id) => (id === '4' ? 'collected' : 'unknown')).map((x) => x.externalId),
    ).toContain('4');
  });

  it('busca ignora acento e maiúsculas', () => {
    expect(filterMounts(mounts, { ...none, q: 'dragao' }).map((x) => x.externalId)).toEqual(['3']);
  });

  it('facção mostra neutras e as da facção escolhida', () => {
    expect(filterMounts(mounts, { ...none, faction: 'HORDE' }).map((x) => x.externalId)).toEqual(['1', '3']);
  });

  it('filtra por origem e por status', () => {
    expect(filterMounts(mounts, { ...none, source: 'DROP' }).map((x) => x.externalId)).toEqual(['1']);
    const statusOf = (id: string): CollectionStatus => (id === '2' ? 'collected' : 'unknown');
    expect(filterMounts(mounts, { ...none, status: 'collected' }, statusOf).map((x) => x.externalId)).toEqual(['2']);
  });
});

describe('parseFilters', () => {
  it('aceita só valores conhecidos', () => {
    expect(
      parseFilters({ q: 'x', source: 'DROP', category: 'BEAST', faction: 'HORDE', status: 'unknown', page: '2' }),
    ).toEqual({
      q: 'x',
      source: 'DROP',
      category: 'BEAST',
      faction: 'HORDE',
      status: 'unknown',
      page: 2,
    });
    expect(parseFilters({ source: 'drop;--', faction: 'ORC', status: 'yes', page: '-1' })).toMatchObject({
      source: '',
      faction: '',
      status: '',
      page: 1,
    });
  });
});

describe('sourceOptions', () => {
  it('usa o rótulo traduzido da API', () => {
    expect(sourceOptions(mounts)).toEqual([
      { value: 'DROP', label: 'Saque' },
      { value: 'VENDOR', label: 'Vendedor' },
    ]);
  });
});
