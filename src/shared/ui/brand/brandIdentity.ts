/**
 * Identidad de marca canónica (empresa vs producto).
 *
 * - Empresa: Boeltech
 * - Producto (tenant UI): Tlama
 * - Platform (tenant 0): Boeltech Platform — no usa el nombre del producto
 *
 * SoT de naming: docs/design-system/branding-unification-checklist.md §0
 */

export const BRAND = {
  companyName: "Boeltech",
  productName: "Tlama",
  productMonogram: "T",
  productByline: "Tlama by Boeltech",
  productSubtitle: "ERP para empresas de transporte",
  platformName: "Boeltech Platform",
  /** Subtítulo de la consola tenant 0 (no es el producto Tlama). */
  platformSubtitle: "Consola SaaS",
  /** Correo de soporte por defecto (landing + menú Ayuda). */
  supportEmail: "soporte@boeltech.com",
} as const;

export type BrandIdentity = typeof BRAND;
