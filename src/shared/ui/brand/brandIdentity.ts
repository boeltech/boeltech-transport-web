/**
 * Identidad de marca canónica (empresa vs producto).
 *
 * - Empresa: Boeltech
 * - Producto (tenant UI): laTuno
 * - Platform (tenant 0): Boeltech Platform — no usa el nombre del producto
 *
 * SoT de naming: docs/design-system/branding-unification-checklist.md §0
 * Geometría de lockup (safe area): `brandLockupMetrics.ts` + `public/brand/README.md`
 */

export const BRAND = {
  companyName: "Boeltech",
  productName: "laTuno",
  /** Monograma tipográfico compact (preferir LatunoMark en chrome). */
  productMonogram: "T",
  productByline: "laTuno by Boeltech",
  productSubtitle: "ERP para empresas de transporte",
  platformName: "Boeltech Platform",
  /** Subtítulo de la consola tenant 0 (no es el producto laTuno). */
  platformSubtitle: "Consola SaaS",
  /** Correo de soporte por defecto (landing + menú Ayuda). */
  supportEmail: "soporte@boeltech.com",
} as const;

export type BrandIdentity = typeof BRAND;
