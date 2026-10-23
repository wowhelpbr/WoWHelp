import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from '@wowhelp/shared';

// Locales internos seguem o banco (en-US, pt-BR); na URL aparecem como /en e /pt-br.
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: {
    mode: 'always',
    prefixes: {
      'en-US': '/en',
      'pt-BR': '/pt-br',
    },
  },
  // Lembra a escolha de idioma por 1 ano (cookie funcional, sem rastreamento).
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});

export type AppLocale = (typeof routing.locales)[number];

export const LOCALE_PREFIX: Record<AppLocale, string> = {
  'en-US': '/en',
  'pt-BR': '/pt-br',
};
