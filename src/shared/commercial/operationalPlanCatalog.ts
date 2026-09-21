/**
 * Catálogo estático de planes Operación (fallback embudo público).
 * Preferir `usePublicOperationalPlans` en landing/registro/onboarding.
 * SoT v5 motriz — Q×P + matriz cupos (5/15/40 · 1/3/10 · 12/24/36).
 */
import type { DeclaredFleetBand } from "./recommendOperationalPlan";

export type OperationalPlanCatalogItem = {
  code: string;
  name: string;
  /** Nombre corto para cards de pricing (sin prefijo «Operación»). */
  shortName: string;
  /** Importe tipográfico principal, p. ej. "$389" o "Cotización". */
  priceAmount: string;
  /** Sufijo de periodo, p. ej. "/motriz · mes" o "" (cotización). */
  pricePeriod: string;
  unitsLabel: string;
  priceLabel: string;
  usersLabel: string;
  branchesLabel: string;
  stampsLabel: string;
  /** Capacidad compacta para badges en cards. */
  usersBadge: string;
  branchesBadge: string;
  stampsBadge: string;
  /** Historial consultable (F2 landing); opcional en fallback estático. */
  historyLabel?: string;
};

export const OPERATIONAL_PLAN_CATALOG: readonly OperationalPlanCatalogItem[] = [
  {
    code: "operacion_micro",
    name: "Operación Micro",
    shortName: "Micro",
    priceAmount: "$389",
    pricePeriod: "/motriz · mes",
    unitsLabel: "1–5 unidades",
    priceLabel: "$389 / motriz · mes",
    usersLabel: "5 usuarios",
    branchesLabel: "1 sucursal",
    stampsLabel: "30 timbres/motriz",
    usersBadge: "5",
    branchesBadge: "1",
    stampsBadge: "30",
    historyLabel: "12 meses consultable",
  },
  {
    code: "operacion_pequena",
    name: "Operación Pequeña",
    shortName: "Pequeña",
    priceAmount: "$319",
    pricePeriod: "/motriz · mes",
    unitsLabel: "6–30 unidades",
    priceLabel: "$319 / motriz · mes",
    usersLabel: "15 usuarios",
    branchesLabel: "3 sucursales",
    stampsLabel: "30 timbres/motriz",
    usersBadge: "15",
    branchesBadge: "3",
    stampsBadge: "30",
    historyLabel: "24 meses",
  },
  {
    code: "operacion_mediana",
    name: "Operación Mediana",
    shortName: "Mediana",
    priceAmount: "$299",
    pricePeriod: "/motriz · mes",
    unitsLabel: "31–100 unidades",
    priceLabel: "$299 / motriz · mes",
    usersLabel: "40 usuarios",
    branchesLabel: "10 sucursales",
    stampsLabel: "30 timbres/motriz",
    usersBadge: "40",
    branchesBadge: "10",
    stampsBadge: "30",
    historyLabel: "36 meses",
  },
  {
    code: "operacion_grande",
    name: "Operación Grande",
    shortName: "Grande",
    priceAmount: "Cotización",
    pricePeriod: "",
    unitsLabel: "101+ unidades",
    priceLabel: "Cotización",
    usersLabel: "Según SOW",
    branchesLabel: "SOW",
    stampsLabel: "30 timbres/motriz o SOW",
    usersBadge: "SOW",
    branchesBadge: "SOW",
    stampsBadge: "30",
    historyLabel: "SOW",
  },
] as const;

/** Etiquetas de banda declarada en UI (Register/Onboarding). Códigos DeclaredFleetBand intactos. */
export const FLEET_BAND_LABELS: Record<DeclaredFleetBand, string> = {
  "1_10": "1–10 unidades",
  "11_30": "11–30 unidades",
  "31_100": "31–100 unidades",
  "100_plus": "Más de 100 unidades",
};

export function getOperationalPlanByCode(
  code: string | null | undefined,
): OperationalPlanCatalogItem {
  return (
    OPERATIONAL_PLAN_CATALOG.find((p) => p.code === code) ??
    OPERATIONAL_PLAN_CATALOG[0]!
  );
}
