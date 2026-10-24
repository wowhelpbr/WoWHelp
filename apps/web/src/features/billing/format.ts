// Formatação de preço e data da assinatura (horário de Brasília).

export function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
}

/** Quantos meses do plano mensal o anual economiza (arredondado para baixo). */
export function monthsSaved(monthly: number, yearly: number): number {
  return monthly > 0 ? Math.floor((monthly * 12 - yearly) / monthly) : 0;
}
