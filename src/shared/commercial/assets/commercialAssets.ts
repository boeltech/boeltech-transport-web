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
  "product-preview-fleet",
  "product-preview-trips",
  "product-preview-clients",
  "product-preview-billing",
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

/** Dimensiones de los crops A3 actuales (recaptura staging pendiente). */
const A3_PREVIEW = { width: 1024, height: 510 } as const;

export const commercialAssets: Record<CommercialAssetId, CommercialAsset> = {
  /** Hero / fallback genérico — mismo crop que Viajes hasta recaptura. */
  "product-preview-dashboard": {
    id: "product-preview-dashboard",
    src: "/commercial/product/product-preview-trips.png",
    alt: "Detalle de viaje en tlamx: flota, ruta y operación",
    ...A3_PREVIEW,
    kind: "product-preview",
    enabled: true,
  },
  "product-preview-fleet": {
    id: "product-preview-fleet",
    src: "/commercial/product/product-preview-fleet.png",
    alt: "Listado de vehículos en tlamx: flota e inventario operativo",
    ...A3_PREVIEW,
    kind: "product-preview",
    enabled: true,
  },
  "product-preview-trips": {
    id: "product-preview-trips",
    src: "/commercial/product/product-preview-trips.png",
    alt: "Detalle de viaje en tlamx: unidad, operador y seguimiento",
    ...A3_PREVIEW,
    kind: "product-preview",
    enabled: true,
  },
  "product-preview-clients": {
    id: "product-preview-clients",
    src: "/commercial/product/product-preview-clients.png",
    alt: "Directorio de clientes en tlamx",
    ...A3_PREVIEW,
    kind: "product-preview",
    enabled: true,
  },
  "product-preview-billing": {
    id: "product-preview-billing",
    src: "/commercial/product/product-preview-billing.png",
    alt: "Viajes por facturar en tlamx: ciclo fiscal ligado a la operación",
    ...A3_PREVIEW,
    kind: "product-preview",
    enabled: true,
  },
  "og-default": {
    id: "og-default",
    src: "/commercial/og/og-default.webp",
    alt: "tlamx — ERP para empresas de transporte en México",
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
