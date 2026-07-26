/**
 * Catálogo estático de planes Operación (SoT v3.2 §3.1).
 * Fallback del embudo público cuando GET /onboarding/plans falla o está vacío.
 * Preferir `usePublicOperationalPlans` en landing/registro/onboarding.
 */
import {
  DEFAULT_OPERATIONAL_PLAN_CODE,
  type DeclaredFleetBand,
} from "./recommendOperationalPlan";

export type OperationalPlanCatalogItem = {
  code: string;
  name: string;
  /** Nombre corto para cards de pricing (sin prefijo «Operación»). */
  shortName: string;
  /** Importe tipográfico principal, p. ej. "$749" o "desde $3,999". */
  priceAmount: string;
  /** Sufijo de periodo, p. ej. "/mes". */
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
};

export const OPERATIONAL_PLAN_CATALOG: readonly OperationalPlanCatalogItem[] = [
  {
    code: "operacion_esencial",
    name: "Operación Esencial",
    shortName: "Esencial",
    priceAmount: "$749",
    pricePeriod: "/mes",
    unitsLabel: "1–10 unidades",
    priceLabel: "$749 / mes",
    usersLabel: "3 usuarios",
    branchesLabel: "1 sucursal",
    stampsLabel: "120 timbres/mes",
    usersBadge: "3",
    branchesBadge: "1",
    stampsBadge: "120",
  },
  {
    code: "operacion_crecimiento",
    name: "Operación Crecimiento",
    shortName: "Crecimiento",
    priceAmount: "$1,499",
    pricePeriod: "/mes",
    unitsLabel: "11–30 unidades",
    priceLabel: "$1,499 / mes",
    usersLabel: "10 usuarios",
    branchesLabel: "3 sucursales",
    stampsLabel: "380 timbres/mes",
    usersBadge: "10",
    branchesBadge: "3",
    stampsBadge: "380",
  },
  {
    code: "operacion_escala",
    name: "Operación Escala",
    shortName: "Escala",
    priceAmount: "$2,699",
    pricePeriod: "/mes",
    unitsLabel: "31–100 unidades",
    priceLabel: "$2,699 / mes",
    usersLabel: "30 usuarios",
    branchesLabel: "10 sucursales",
    stampsLabel: "1,200 timbres/mes",
    usersBadge: "30",
    branchesBadge: "10",
    stampsBadge: "1,200",
  },
  {
    code: "operacion_corporativo",
    name: "Operación Corporativo",
    shortName: "Corporativo",
    priceAmount: "desde $3,999",
    pricePeriod: "/mes",
    unitsLabel: "100+ unidades",
    priceLabel: "desde $3,999 / mes",
    usersLabel: "Usuarios ilimitados",
    branchesLabel: "Sucursales ilimitadas",
    stampsLabel: "≥1,500 timbres/mes",
    usersBadge: "∞",
    branchesBadge: "∞",
    stampsBadge: "≥1,500",
  },
] as const;

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
    OPERATIONAL_PLAN_CATALOG.find(
      (p) => p.code === DEFAULT_OPERATIONAL_PLAN_CODE,
    )!
  );
}
