// Tipos de colecionável com catálogo oficial e a rota de cada um.
export const CATALOG_KINDS = ['mount', 'pet', 'toy'] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export const CATALOG_PATH: Record<CatalogKind, '/mounts' | '/pets' | '/toys'> = {
  mount: '/mounts',
  pet: '/pets',
  toy: '/toys',
};

/** Brinquedos só têm o ícone oficial (pequeno); montarias e mascotes têm o modelo renderizado. */
export const IMAGE_MODE: Record<CatalogKind, 'render' | 'icon'> = { mount: 'render', pet: 'render', toy: 'icon' };

export const isCatalogKind = (v: unknown): v is CatalogKind =>
  typeof v === 'string' && (CATALOG_KINDS as readonly string[]).includes(v);
