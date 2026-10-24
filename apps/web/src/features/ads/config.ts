// Anúncios (Google AdSense), no modelo do Wowhead: banners para quem não
// assina. Tudo desligado até existir NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-...).
// Regras dos termos da API da Blizzard: nenhum dado da Blizzard vai para o
// anúncio, nada de segmentar por dados do jogador e nada de anúncio
// obrigatório (vídeo) antes de liberar um recurso.

const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

/** ca-pub-XXXXXXXXXXXXXXXX, ou null se os anúncios estão desligados. */
export const ADSENSE_CLIENT: string | null = /^ca-pub-\d{16}$/.test(client) ? client : null;

const slot = (v: string | undefined) => (v && /^\d{6,20}$/.test(v) ? v : null);

/**
 * Blocos de anúncio criados no painel do AdSense (um por lugar do site).
 * Sem o número do bloco, o lugar fica vazio (os "anúncios automáticos" do
 * AdSense ainda podem aparecer, se ligados no painel).
 */
export const AD_SLOTS = {
  home: slot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME),
  catalog: slot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATALOG),
  community: slot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_COMMUNITY),
} as const;

export type AdPlacement = keyof typeof AD_SLOTS;

export const CONSENT_COOKIE = 'wowhelp_consent';
export type ConsentChoice = 'all' | 'essential';
export const CONSENT_EVENT = 'wowhelp:consent';
