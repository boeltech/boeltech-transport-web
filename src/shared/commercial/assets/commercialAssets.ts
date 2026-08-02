/**
 * Catálogo tipado de assets comerciales (L0/L1).
 * Namespace: commercial.assets.*
 *
 * Añadir asset: archivo en public/commercial/ → entrada aquí → CommercialImage.
 * Ver public/commercial/README.md.
 */

export const COMMERCIAL_ASSET_KINDS = [
  "product-preview",
  "hero",
  "og",
] as const;

export type CommercialAssetKind = (typeof COMMERCIAL_ASSET_KINDS)[number];

export const COMMERCIAL_ASSET_IDS = [
  "product-preview-dashboard",
  "og-default",
] as const;

export type CommercialAssetId = (typeof COMMERCIAL_ASSET_IDS)[number];

export type CommercialAsset = {
  id: CommercialAssetId;
  /** Path público bajo /commercial/... */
  src: string;
  alt: string;
  width: number;
  height: number;
  kind: CommercialAssetKind;
  /**
   * Feature flag implícita (D4): si false, consumidores conservan mock CSS
   * o no renderizan. Activar solo cuando el archivo exista en public/.
   */
  enabled: boolean;
};

export const commercialAssets: Record<CommercialAssetId, CommercialAsset> = {
  "product-preview-dashboard": {
    id: "product-preview-dashboard",
    src: "/commercial/product/product-preview-dashboard.webp",
    alt: "Vista de operaciones en Tlama: viajes recientes y señal de timbrado fiscal",
    width: 1200,
    height: 750,
    kind: "product-preview",
    enabled: false,
  },
  "og-default": {
    id: "og-default",
    src: "/commercial/og/og-default.webp",
    alt: "Tlama — ERP para empresas de transporte en México",
    width: 1200,
    height: 630,
    kind: "og",
    enabled: false,
  },
};

export function getCommercialAsset(id: CommercialAssetId): CommercialAsset {
  return commercialAssets[id];
}

export function isCommercialAssetEnabled(id: CommercialAssetId): boolean {
  return commercialAssets[id].enabled;
}
