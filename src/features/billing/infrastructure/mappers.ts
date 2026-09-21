import type {
  BillingAccess,
  BillingArrears,
  BillingCapacity,
  BillingCapacityDimension,
  BillingCapacityStatus,
  BillingEntitlements,
  BillingPaymentMethod,
  BillingSetupIntent,
  BillingSubscription,
  BillingUsage,
  ProfitabilityLevel,
  SaasInvoicePayResult,
  SaasPayStatus,
} from "../domain/entities";

export interface ApiBillingCapacityDimension {
  granted: number | null;
  usage: number;
  limit_reached: boolean;
  over_quota: boolean;
  over_quota_count: number;
  status: BillingCapacityStatus;
}

export interface ApiBillingCapacity {
  band_code: string;
  pending_band_code: string | null;
  users: ApiBillingCapacityDimension;
  branches: ApiBillingCapacityDimension;
  history_months: {
    granted: number | null;
  };
}

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
  /** ADR-0095 — opcionales por compat con payloads legacy. */
  capacity_band_code?: string;
  pending_capacity_band_code?: string | null;
  capacity?: ApiBillingCapacity;
  profitability_level: ProfitabilityLevel;
  /** SoT v5 — opcionales por compat con payloads legacy. */
  price_per_motriz_cents?: number | null;
  stamps_per_motriz?: number;
  band_q_min?: number | null;
  band_q_max?: number | null;
  overage_price_cents?: number;
  q_fact?: number | null;
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

export interface ApiBillingAccess {
  subscription_status: string | null;
  is_operational: boolean;
  trial_ends_at: string | null;
  plan_name: string | null;
  effective_module_codes: string[];
}

export const mapBillingAccess = (raw: ApiBillingAccess): BillingAccess => ({
  subscriptionStatus: raw.subscription_status,
  isOperational: raw.is_operational,
  trialEndsAt: raw.trial_ends_at,
  planName: raw.plan_name,
  effectiveModuleCodes: raw.effective_module_codes,
});

const DEFAULT_STAMPS_PER_MOTRIZ = 30;

const mapCapacityDimension = (
  raw: ApiBillingCapacityDimension,
): BillingCapacityDimension => ({
  granted: raw.granted,
  usage: raw.usage,
  limitReached: raw.limit_reached,
  overQuota: raw.over_quota,
  overQuotaCount: raw.over_quota_count,
  status: raw.status,
});

/** Legacy: granted desde limits; usage desconocido; sin over_quota inventado. */
const synthesizeLegacyCapacity = (
  planCode: string,
  capacityBandCode: string | undefined,
  pendingBandCode: string | null | undefined,
  limits: {
    max_users: number | null;
    max_branches: number | null;
    history_months: number | null;
  },
): BillingCapacity => {
  const within = (): BillingCapacityDimension => ({
    granted: null,
    usage: null,
    limitReached: false,
    overQuota: false,
    overQuotaCount: 0,
    status: "within_limit",
  });

  return {
    bandCode: capacityBandCode || planCode,
    pendingBandCode: pendingBandCode ?? null,
    users: { ...within(), granted: limits.max_users },
    branches: { ...within(), granted: limits.max_branches },
    historyMonths: { granted: limits.history_months },
  };
};

export const mapBillingCapacity = (
  raw: ApiBillingCapacity,
): BillingCapacity => ({
  bandCode: raw.band_code,
  pendingBandCode: raw.pending_band_code,
  users: mapCapacityDimension(raw.users),
  branches: mapCapacityDimension(raw.branches),
  historyMonths: { granted: raw.history_months.granted },
});

export const mapBillingSubscription = (
  raw: ApiBillingSubscription,
): BillingSubscription => {
  const capacityBandCode = raw.capacity_band_code ?? raw.plan_code;
  const pendingCapacityBandCode = raw.pending_capacity_band_code ?? null;
  const capacity = raw.capacity
    ? mapBillingCapacity(raw.capacity)
    : synthesizeLegacyCapacity(
        raw.plan_code,
        raw.capacity_band_code,
        raw.pending_capacity_band_code,
        raw.limits,
      );

  return {
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
    capacityBandCode,
    pendingCapacityBandCode,
    capacity,
    profitabilityLevel: raw.profitability_level,
    pricePerMotrizCents: raw.price_per_motriz_cents ?? null,
    stampsPerMotriz:
      raw.stamps_per_motriz != null && raw.stamps_per_motriz > 0
        ? raw.stamps_per_motriz
        : DEFAULT_STAMPS_PER_MOTRIZ,
    bandQMin: raw.band_q_min ?? null,
    bandQMax: raw.band_q_max ?? null,
    overagePriceCents: raw.overage_price_cents ?? 0,
    qFact: raw.q_fact ?? null,
  };
};

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

export interface ApiBillingPaymentMethod {
  id: string;
  tenant_id: string;
  gateway: string;
  gateway_payment_method_id: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiBillingSetupIntent {
  client_secret: string;
  customer_id: string;
  setup_intent_id: string;
}

export interface ApiSaasInvoicePayResult {
  saas_invoice_id: string;
  status: SaasPayStatus | string;
  gateway_payment_id: string;
  amount_cents?: number;
  client_secret?: string | null;
}

/** Function declarations (not const) so ESM live bindings resolve under barrel/HMR load. */
export function mapBillingPaymentMethod(
  raw: ApiBillingPaymentMethod,
): BillingPaymentMethod {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    gateway: raw.gateway,
    gatewayPaymentMethodId: raw.gateway_payment_method_id,
    brand: raw.brand,
    last4: raw.last4,
    expMonth: raw.exp_month,
    expYear: raw.exp_year,
    isDefault: raw.is_default,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function mapBillingSetupIntent(
  raw: ApiBillingSetupIntent,
): BillingSetupIntent {
  return {
    clientSecret: raw.client_secret,
    customerId: raw.customer_id,
    setupIntentId: raw.setup_intent_id,
  };
}

export function mapSaasInvoicePayResult(
  raw: ApiSaasInvoicePayResult,
): SaasInvoicePayResult {
  return {
    saasInvoiceId: raw.saas_invoice_id,
    status: raw.status as SaasPayStatus,
    gatewayPaymentId: raw.gateway_payment_id,
    amountCents: raw.amount_cents,
    clientSecret: raw.client_secret ?? null,
  };
}
