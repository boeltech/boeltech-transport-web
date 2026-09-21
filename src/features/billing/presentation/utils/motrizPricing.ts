import type { BillingSubscription } from "../../domain/entities";

/** Bandas SoT v5 (ADR-0094 / propuesta-planes-v5-motriz). */
export type MotrizBandId = "micro" | "pequena" | "mediana" | "grande";

const V5_PLAN_BAND: Record<string, MotrizBandId> = {
  operacion_micro: "micro",
  operacion_pequena: "pequena",
  operacion_mediana: "mediana",
  operacion_grande: "grande",
};

/**
 * Cobro por motriz activo: banda en plan o precio/Q publicados (SoT v5).
 * Planes legacy flat no tienen band_q_* ni price_per_motriz.
 */
export function isMotrizPricing(
  sub: Pick<
    BillingSubscription,
    "planCode" | "pricePerMotrizCents" | "bandQMin" | "bandQMax"
  >,
): boolean {
  if (V5_PLAN_BAND[sub.planCode]) return true;
  if (sub.bandQMin != null) return true;
  if (sub.pricePerMotrizCents != null && sub.pricePerMotrizCents > 0) {
    return true;
  }
  return false;
}

/**
 * Resuelve banda por plan code, rangos del plan o Q_fact (SoT §3.1).
 */
export function resolveMotrizBand(
  sub: Pick<
    BillingSubscription,
    "planCode" | "bandQMin" | "bandQMax" | "pricePerMotrizCents" | "qFact"
  >,
): MotrizBandId | null {
  const fromCode = V5_PLAN_BAND[sub.planCode];
  if (fromCode) return fromCode;

  const q = sub.qFact;
  if (q != null && Number.isFinite(q) && q >= 1) {
    if (q <= 5) return "micro";
    if (q <= 30) return "pequena";
    if (q <= 100) return "mediana";
    return "grande";
  }

  if (sub.bandQMin != null) {
    if (sub.bandQMin >= 101) return "grande";
    if (sub.bandQMin >= 31) return "mediana";
    if (sub.bandQMin >= 6) return "pequena";
    return "micro";
  }

  // Cotización Grande: P null + sin min explícito en legacy
  if (
    sub.pricePerMotrizCents == null &&
    sub.bandQMax == null &&
    sub.bandQMin == null
  ) {
    return null;
  }

  return null;
}

/** Cargo base = Q_fact × P_banda. Null si cotización o faltan datos. */
export function computeMotrizCargoCents(
  qFact: number | null | undefined,
  pricePerMotrizCents: number | null | undefined,
): number | null {
  if (
    qFact == null ||
    !Number.isFinite(qFact) ||
    qFact < 0 ||
    pricePerMotrizCents == null ||
    pricePerMotrizCents <= 0
  ) {
    return null;
  }
  return Math.round(qFact * pricePerMotrizCents);
}

/**
 * Bolsa del mes = stamps_per_motriz × Q.
 * Si no hay Q, usa includedStamps del API cuando > 0.
 */
export function computeBolsaStamps(input: {
  qFact: number | null | undefined;
  stampsPerMotriz: number;
  includedStamps?: number | null;
}): number | null {
  const { qFact, stampsPerMotriz, includedStamps } = input;
  if (qFact != null && Number.isFinite(qFact) && qFact >= 0 && stampsPerMotriz > 0) {
    return stampsPerMotriz * qFact;
  }
  if (includedStamps != null && includedStamps > 0) return includedStamps;
  return null;
}

export function formatBandQRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max == null) return `${min}+`;
  if (min != null && max != null) return `${min}–${max}`;
  if (max != null) return `hasta ${max}`;
  return null;
}
