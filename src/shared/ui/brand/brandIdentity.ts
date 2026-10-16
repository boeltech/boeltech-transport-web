/**
 * Identidad de marca canónica (empresa vs producto).
 *
 * - Empresa: Boeltech
 * - Producto (tenant UI): tlamx
 * - Platform (tenant 0): Boeltech Platform — no usa el nombre del producto
 *
 * SoT: docs/design-system/branding-unification-checklist.md §0
 * Lockup: isotipo portal B + wordmark Schibsted Grotesk · `brandLockupMetrics.ts`
 * Decisión brand 2026-10-15: Opción B (ops) · Schibsted unifica wordmark + display /welcome.
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
  /** Stack tipográfico display del wordmark (Schibsted Grotesk 700). */
  displayFontFamily:
    '"Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif',
} as const;

export type BrandIdentity = typeof BRAND;
