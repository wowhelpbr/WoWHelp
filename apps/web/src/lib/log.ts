import 'server-only';

// Eventos de produto e erros em JSON de uma linha (aparecem nos logs da
// Vercel). Lista fechada de eventos (planning/docs/09, Observabilidade).
// NUNCA passar token, e-mail, nome de personagem, id de usuário nem conteúdo
// de arquivo: só códigos e contagens.
export type ProductEvent =
  | 'objective_created'
  | 'battlenet_link_succeeded'
  | 'battlenet_link_failed'
  | 'addon_import_succeeded'
  | 'addon_import_failed'
  | 'account_exported'
  | 'account_deleted'
  | 'supporter_checkout_started'
  | 'supporter_checkout_failed'
  | 'supporter_portal_failed'
  | 'supporter_synced'
  | 'supporter_webhook_failed'
  | 'supporter_cancel_failed';

type Fields = Record<string, string | number | boolean | null>;

export function logEvent(event: ProductEvent, fields: Fields = {}): void {
  console.log(JSON.stringify({ level: 'info', event, at: new Date().toISOString(), ...fields }));
}
