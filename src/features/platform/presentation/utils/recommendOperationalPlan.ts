/** Bandas SoT §3.1 / ADR-0069 — tip de tier Operación (lockstep API). */
export const DECLARED_FLEET_BANDS = [
  "1_10",
  "11_30",
  "31_100",
  "100_plus",
] as const;

export type DeclaredFleetBand = (typeof DECLARED_FLEET_BANDS)[number];

export const DEFAULT_OPERATIONAL_PLAN_CODE = "operacion_esencial";

export const OPERATIONAL_PLAN_BY_BAND: Record<
  DeclaredFleetBand,
  string
> = {
  "1_10": "operacion_esencial",
  "11_30": "operacion_crecimiento",
  "31_100": "operacion_escala",
  "100_plus": "operacion_corporativo",
};

export function isDeclaredFleetBand(
  value: string,
): value is DeclaredFleetBand {
  return (DECLARED_FLEET_BANDS as readonly string[]).includes(value);
}

/**
 * Recomienda `plan_code` Operación según banda de flota.
 * Sin banda → Esencial (menor fricción / SoT §9.4).
 */
export function recommendOperationalPlanCode(input: {
  band?: DeclaredFleetBand | null;
}): string {
  if (!input.band) return DEFAULT_OPERATIONAL_PLAN_CODE;
  return OPERATIONAL_PLAN_BY_BAND[input.band];
}
