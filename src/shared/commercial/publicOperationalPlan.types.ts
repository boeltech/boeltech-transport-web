/**
 * Contrato snake_case de GET /onboarding/plans (mapBillingPlanToPublicApi).
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
};

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
  };
}
