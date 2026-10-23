import { describe, expect, it } from 'vitest';
import { currentCycle, planSession, type PlanCandidate } from './resets';

describe('currentCycle', () => {
  it('Américas: semana começa terça 15:00 UTC', () => {
    // Quinta 23/10/2026 → semana começou terça 20/10 15:00 UTC.
    const c = currentCycle('us', 'weekly', new Date('2026-10-23T12:00:00Z'));
    expect(c.key).toBe('us-w-2026-10-20');
    expect(c.startsAt.toISOString()).toBe('2026-10-20T15:00:00.000Z');
    expect(c.endsAt.toISOString()).toBe('2026-10-27T15:00:00.000Z');
  });

  it('terça antes das 15:00 UTC ainda é a semana anterior', () => {
    expect(currentCycle('us', 'weekly', new Date('2026-10-27T14:59:00Z')).key).toBe('us-w-2026-10-20');
    expect(currentCycle('us', 'weekly', new Date('2026-10-27T15:00:00Z')).key).toBe('us-w-2026-10-27');
  });

  it('Europa: quarta 04:00 UTC (oficial)', () => {
    const c = currentCycle('eu', 'weekly', new Date('2026-10-23T12:00:00Z'));
    expect(c.startsAt.toISOString()).toBe('2026-10-21T04:00:00.000Z');
  });

  it('diário vira no horário do reset', () => {
    expect(currentCycle('us', 'daily', new Date('2026-10-23T14:00:00Z')).key).toBe('us-d-2026-10-22');
    expect(currentCycle('us', 'daily', new Date('2026-10-23T16:00:00Z')).key).toBe('us-d-2026-10-23');
  });
});

describe('planSession', () => {
  const c = (id: string, minutes: number | null, priority = 3, endsAt?: string): PlanCandidate => ({
    id,
    kind: 'task',
    title: id,
    estimatedMinutes: minutes,
    priority,
    endsAt: endsAt ? new Date(endsAt) : undefined,
  });

  it('enche até o tempo escolhido sem passar', () => {
    const plan = planSession(30, [c('a', 20), c('b', 15), c('c', 10)]);
    expect(plan.items.map((i) => i.id)).toEqual(['c', 'b']);
    expect(plan.plannedMinutes).toBe(25);
    expect(plan.leftover.map((i) => i.id)).toEqual(['a']);
  });

  it('o que vence antes vem primeiro, depois prioridade', () => {
    const plan = planSession(60, [c('normal', 10, 1), c('vence', 10, 5, '2026-10-27T15:00:00Z')]);
    expect(plan.items.map((i) => i.id)).toEqual(['vence', 'normal']);
  });

  it('itens sem estimativa ficam à parte e não contam', () => {
    const plan = planSession(15, [c('sem', null), c('com', 15)]);
    expect(plan.items.map((i) => i.id)).toEqual(['com']);
    expect(plan.unestimated.map((i) => i.id)).toEqual(['sem']);
  });

  it('é estável para a mesma entrada', () => {
    const input = [c('x', 10), c('y', 10), c('z', 10)];
    expect(planSession(20, input).items.map((i) => i.id)).toEqual(
      planSession(20, [...input].reverse()).items.map((i) => i.id),
    );
  });
});
