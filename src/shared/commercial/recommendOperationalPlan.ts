/** Bandas SoT §3.1 / ADR-0069 — tip de tier Operación (lockstep API). */
export const DECLARED_FLEET_BANDS = [
  "1_10",
  "11_30",
  "31_100",
  "100_plus",
] as const;

export type DeclaredFleetBand = (typeof DECLARED_FLEET_BANDS)[number];

/** SoT v5 motriz — default sin banda = Micro (no Esencial v3). */
export const DEFAULT_OPERATIONAL_PLAN_CODE = "operacion_micro";

/**
 * Mapa banda declarada → plan_code v5.
 * Nota TEC: banda UI `1_10` recomienda Micro aunque la banda micro de cobro es 1–5.
 */
export const OPERATIONAL_PLAN_BY_BAND: Record<DeclaredFleetBand, string> = {
  "1_10": "operacion_micro",
  "11_30": "operacion_pequena",
  "31_100": "operacion_mediana",
  "100_plus": "operacion_grande",
};

export function isDeclaredFleetBand(
  value: string,
): value is DeclaredFleetBand {
  return (DECLARED_FLEET_BANDS as readonly string[]).includes(value);
}

/**
 * Recomienda `plan_code` Operación según banda de flota (SoT v5).
 * Sin banda → Micro.
 */
export function recommendOperationalPlanCode(input: {
  band?: DeclaredFleetBand | null;
}): string {
  if (!input.band) return DEFAULT_OPERATIONAL_PLAN_CODE;
  return OPERATIONAL_PLAN_BY_BAND[input.band];
}
