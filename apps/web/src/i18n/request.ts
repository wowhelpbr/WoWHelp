import * as rootParams from 'next/root-params';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  // Route Handlers e Server Actions passam o locale explicitamente;
  // páginas e layouts leem do segmento raiz [locale].
  let resolved = locale;
  if (!resolved) {
    const param = await rootParams.locale();
    resolved = hasLocale(routing.locales, param) ? param : routing.defaultLocale;
  }

  return {
    locale: resolved,
    messages: (await import(`../../messages/${resolved}.json`)).default,
    timeZone: 'UTC',
  };
});
