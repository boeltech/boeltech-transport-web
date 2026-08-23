/**
 * Identidad de marca canónica (empresa vs producto).
 *
 * - Empresa: Boeltech
 * - Producto (tenant UI): tlamx
 * - Platform (tenant 0): Boeltech Platform — no usa el nombre del producto
 *
 * SoT: docs/design-system/branding-unification-checklist.md §0
 * Lockup: isotipo portal B + wordmark Comfortaa · `brandLockupMetrics.ts`
 */

export const BRAND = {
  companyName: "Boeltech",
  productName: "tlamx",
  /** Monograma tipográfico compact (preferir LatunoMark / portal en chrome). */
  productMonogram: "t",
  productByline: "tlamx by Boeltech",
  productSubtitle: "ERP para empresas de transporte",
  platformName: "Boeltech Platform",
  /** Subtítulo de la consola tenant 0 (no es el producto tlamx). */
  platformSubtitle: "Consola SaaS",
  /** Correo de soporte por defecto (landing + menú Ayuda). */
  supportEmail: "soporte@boeltech.com",
  /** Stack tipográfico display del wordmark (Comfortaa 700 + stroke). */
  displayFontFamily: "Comfortaa, ui-sans-serif, system-ui, sans-serif",
} as const;

export type BrandIdentity = typeof BRAND;
