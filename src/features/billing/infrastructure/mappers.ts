import type {
  BillingArrears,
  BillingEntitlements,
  BillingSubscription,
  BillingUsage,
  ProfitabilityLevel,
} from "../domain/entities";

export interface ApiBillingSubscription {
  plan_code: string;
  plan_name: string;
  status: string;
  billing_cycle: string;
  monthly_price_cents: number;
  included_stamps: number;
  stamps_used_this_period: number;
  quota_policy: string;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  notes: string | null;
  limits: {
    max_users: number | null;
    max_branches: number | null;
    history_months: number | null;
  };
  profitability_level: ProfitabilityLevel;
}

export interface ApiBillingUsage {
  tenant_id: string;
  plan_code: string;
  period_key: string;
  current_period_start: string;
  current_period_end: string;
  included_stamps: number;
  stamps_used: number;
  overage_stamps: number;
  overage_price_cents: number;
  overage_total_cents: number;
  quota_policy: string;
  prepaid_remaining?: number;
  prepaid_consumed?: number;
  history: Array<{
    period_key: string;
    stamps_used: number;
    overage_stamps: number;
  }>;
}

export interface ApiBillingEntitlements {
  direct_entitlements: Array<{
    module_code: string;
    module_name: string;
    kind: string;
    status: string;
    activated_at: string;
    price_locked_cents: number;
    price_tier: "ea" | "ga";
    member_codes: string[];
  }>;
  effective_module_codes: string[];
  profitability_level: ProfitabilityLevel;
  catalog: Array<{
    code: string;
    name: string;
    kind: string;
    is_active_for_tenant: boolean;
    member_codes: string[];
    price_ea_cents: number | null;
    price_ga_cents: number | null;
    maturity: string;
  }>;
  commercial_summary: {
    plan_monthly_price_cents: number;
    modules_total_cents: number;
    overage_total_cents: number;
    subtotal_cents: number;
    iva_cents: number;
    estimated_total_cents: number;
    currency: "MXN";
    period_key: string;
    billing_cycle: string | null;
  };
}

export interface ApiBillingArrearsInvoice {
  id: string;
  period_key: string;
  status: string;
  total_cents: number;
  amount_due_cents: number;
  due_date: string | null;
  days_overdue: number;
  issued_at: string | null;
}

export interface ApiBillingArrears {
  currency: "MXN";
  open_count: number;
  total_open_cents: number;
  oldest_due_date: string | null;
  max_days_overdue: number;
  invoices: ApiBillingArrearsInvoice[];
}

export const mapBillingSubscription = (
  raw: ApiBillingSubscription,
): BillingSubscription => ({
  planCode: raw.plan_code,
  planName: raw.plan_name,
  status: raw.status,
  billingCycle: raw.billing_cycle,
  monthlyPriceCents: raw.monthly_price_cents,
  includedStamps: raw.included_stamps,
  stampsUsedThisPeriod: raw.stamps_used_this_period,
  quotaPolicy: raw.quota_policy,
  currentPeriodStart: raw.current_period_start,
  currentPeriodEnd: raw.current_period_end,
  trialEndsAt: raw.trial_ends_at,
  notes: raw.notes,
  limits: {
    maxUsers: raw.limits.max_users,
    maxBranches: raw.limits.max_branches,
    historyMonths: raw.limits.history_months,
  },
  profitabilityLevel: raw.profitability_level,
});

export const mapBillingUsage = (raw: ApiBillingUsage): BillingUsage => ({
  tenantId: raw.tenant_id,
  planCode: raw.plan_code,
  periodKey: raw.period_key,
  currentPeriodStart: raw.current_period_start,
  currentPeriodEnd: raw.current_period_end,
  includedStamps: raw.included_stamps,
  stampsUsed: raw.stamps_used,
  overageStamps: raw.overage_stamps,
  overagePriceCents: raw.overage_price_cents,
  overageTotalCents: raw.overage_total_cents,
  quotaPolicy: raw.quota_policy,
  prepaidRemaining: raw.prepaid_remaining ?? 0,
  prepaidConsumed: raw.prepaid_consumed ?? 0,
  history: raw.history.map((item) => ({
    periodKey: item.period_key,
    stampsUsed: item.stamps_used,
    overageStamps: item.overage_stamps,
  })),
});

export const mapBillingEntitlements = (
  raw: ApiBillingEntitlements,
): BillingEntitlements => ({
  directEntitlements: raw.direct_entitlements.map((item) => ({
    moduleCode: item.module_code,
    moduleName: item.module_name,
    kind: item.kind,
    status: item.status,
    activatedAt: item.activated_at,
    priceLockedCents: item.price_locked_cents,
    priceTier: item.price_tier,
    memberCodes: item.member_codes,
  })),
  effectiveModuleCodes: raw.effective_module_codes,
  profitabilityLevel: raw.profitability_level,
  catalog: raw.catalog.map((item) => ({
    code: item.code,
    name: item.name,
    kind: item.kind,
    isActiveForTenant: item.is_active_for_tenant,
    memberCodes: item.member_codes,
    priceEaCents: item.price_ea_cents,
    priceGaCents: item.price_ga_cents,
    maturity: item.maturity,
  })),
  commercialSummary: {
    planMonthlyPriceCents: raw.commercial_summary.plan_monthly_price_cents,
    modulesTotalCents: raw.commercial_summary.modules_total_cents,
    overageTotalCents: raw.commercial_summary.overage_total_cents,
    subtotalCents: raw.commercial_summary.subtotal_cents,
    ivaCents: raw.commercial_summary.iva_cents,
    estimatedTotalCents: raw.commercial_summary.estimated_total_cents,
    currency: raw.commercial_summary.currency,
    periodKey: raw.commercial_summary.period_key,
    billingCycle: raw.commercial_summary.billing_cycle,
  },
});

export const mapBillingArrears = (raw: ApiBillingArrears): BillingArrears => ({
  currency: raw.currency,
  openCount: raw.open_count,
  totalOpenCents: raw.total_open_cents,
  oldestDueDate: raw.oldest_due_date,
  maxDaysOverdue: raw.max_days_overdue,
  invoices: raw.invoices.map((invoice) => ({
    id: invoice.id,
    periodKey: invoice.period_key,
    status: invoice.status,
    totalCents: invoice.total_cents,
    amountDueCents: invoice.amount_due_cents,
    dueDate: invoice.due_date,
    daysOverdue: invoice.days_overdue,
    issuedAt: invoice.issued_at,
  })),
});
