import type { routing } from '@/i18n/routing';
import type messages from '../messages/en-US.json';

// Mensagens e locales tipados: chave inexistente vira erro de compilação.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
