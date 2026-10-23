/** Junta classes condicionais. Sem dependência extra: só filtra falsy. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
