/** Bandas SoT v5 para un alta nueva. Lockstep con el API. */
export const DECLARED_FLEET_BANDS = [
  "1_5",
  "6_30",
  "31_100",
  "100_plus",
] as const;

/** Declaración anterior: un GET puede traerlas; un alta nueva no las ofrece. */
export const LEGACY_DECLARED_FLEET_BANDS = ["1_10", "11_30"] as const;

export type DeclaredFleetBand =
  | (typeof DECLARED_FLEET_BANDS)[number]
  | (typeof LEGACY_DECLARED_FLEET_BANDS)[number];

/** SoT v5 motriz — default sin banda = Micro (no Esencial v3). */
export const DEFAULT_OPERATIONAL_PLAN_CODE = "operacion_micro";

/** Banda declarada → plan_code v5. `1_10` y `11_30` solo si la declaración ya estaba guardada. */
export const OPERATIONAL_PLAN_BY_BAND: Record<DeclaredFleetBand, string> = {
  "1_5": "operacion_micro",
  "6_30": "operacion_pequena",
  "31_100": "operacion_mediana",
  "100_plus": "operacion_grande",
  "1_10": "operacion_micro",
  "11_30": "operacion_pequena",
};

const RECOGNIZED_DECLARED_FLEET_BANDS: readonly string[] = [
  ...DECLARED_FLEET_BANDS,
  ...LEGACY_DECLARED_FLEET_BANDS,
];

export function isDeclaredFleetBand(
  value: string,
): value is DeclaredFleetBand {
  return RECOGNIZED_DECLARED_FLEET_BANDS.includes(value);
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
