/**
 * Contrato snake_case de GET /onboarding/plans (mapBillingPlanToPublicApi).
 * SoT v5: campos motriz opcionales para payloads legacy / parciales.
 */
export type ApiPublicOperationalPlan = {
  code: string;
  name: string;
  monthly_price_cents: number;
  annual_price_cents: number | null;
  included_stamps: number;
  overage_price_cents: number;
  quota_policy: string;
  max_users: number | null;
  max_branches: number | null;
  history_months: number | null;
  features: Record<string, unknown>;
  /** $/motriz en centavos; null = cotización o plan legacy flat. */
  price_per_motriz_cents?: number | null;
  /** Timbres incluidos por motriz (bolsa = stamps × Q). */
  stamps_per_motriz?: number;
  band_q_min?: number | null;
  band_q_max?: number | null;
};

export type PublicOperationalPlan = {
  code: string;
  name: string;
  monthlyPriceCents: number;
  annualPriceCents: number | null;
  includedStamps: number;
  overagePriceCents: number;
  quotaPolicy: string;
  maxUsers: number | null;
  maxBranches: number | null;
  historyMonths: number | null;
  features: Record<string, unknown>;
  pricePerMotrizCents: number | null;
  stampsPerMotriz: number;
  bandQMin: number | null;
  bandQMax: number | null;
};

const V5_MOTRIZ_PLAN_CODES = new Set([
  "operacion_micro",
  "operacion_pequena",
  "operacion_mediana",
  "operacion_grande",
]);

/** Plan cobrado o cotizado por motriz (SoT v5), no flat legacy. */
export function isPublicMotrizPlan(
  plan: Pick<
    PublicOperationalPlan,
    "code" | "pricePerMotrizCents" | "bandQMin" | "stampsPerMotriz"
  >,
): boolean {
  if (V5_MOTRIZ_PLAN_CODES.has(plan.code)) return true;
  if (plan.bandQMin != null) return true;
  if (plan.pricePerMotrizCents != null && plan.pricePerMotrizCents > 0) {
    return true;
  }
  return false;
}

export function mapApiPublicOperationalPlan(
  raw: ApiPublicOperationalPlan,
): PublicOperationalPlan {
  return {
    code: raw.code,
    name: raw.name,
    monthlyPriceCents: raw.monthly_price_cents,
    annualPriceCents: raw.annual_price_cents,
    includedStamps: raw.included_stamps,
    overagePriceCents: raw.overage_price_cents,
    quotaPolicy: raw.quota_policy,
    maxUsers: raw.max_users,
    maxBranches: raw.max_branches,
    historyMonths: raw.history_months,
    features: raw.features ?? {},
    pricePerMotrizCents: raw.price_per_motriz_cents ?? null,
    stampsPerMotriz: raw.stamps_per_motriz ?? 0,
    bandQMin: raw.band_q_min ?? null,
    bandQMax: raw.band_q_max ?? null,
  };
}
