export type ProfitabilityLevel = "L0" | "L1" | "L2" | "L3" | "L4";

/** ADR-0095 — snapshot usage/cupo de una dimensión (users | branches). */
export type BillingCapacityStatus = "within_limit" | "over_limit";

export interface BillingCapacityDimension {
  granted: number | null;
  /** null = desconocido (payload legacy sin `capacity`). */
  usage: number | null;
  limitReached: boolean;
  overQuota: boolean;
  overQuotaCount: number;
  status: BillingCapacityStatus;
}

/** ADR-0095 — capacidad operativa dual-rail (granted sticky + usage). */
export interface BillingCapacity {
  bandCode: string;
  pendingBandCode: string | null;
  users: BillingCapacityDimension;
  branches: BillingCapacityDimension;
  historyMonths: {
    granted: number | null;
  };
}

export interface BillingSubscription {
  planCode: string;
  planName: string;
  status: string;
  billingCycle: string;
  monthlyPriceCents: number;
  includedStamps: number;
  stampsUsedThisPeriod: number;
  quotaPolicy: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  notes: string | null;
  /** Granted caps (ADR-0095: mismos valores que capacity.*.granted). */
  limits: {
    maxUsers: number | null;
    maxBranches: number | null;
    historyMonths: number | null;
  };
  /** ADR-0095 — banda de capacidad granted (sticky). */
  capacityBandCode: string;
  /** ADR-0095 — downgrade diferido; null si no hay pending. */
  pendingCapacityBandCode: string | null;
  /** ADR-0095 — snapshot usage/over_quota (mapper sintetiza si API legacy). */
  capacity: BillingCapacity;
  profitabilityLevel: ProfitabilityLevel;
  /** SoT v5 — $/motriz (null = legacy o Grande cotización). */
  pricePerMotrizCents: number | null;
  /** Timbres incluidos por motriz (bolsa = stampsPerMotriz × Q). Default API 30. */
  stampsPerMotriz: number;
  bandQMin: number | null;
  bandQMax: number | null;
  /** Overage unitario de la banda (¢ / timbre extra). */
  overagePriceCents: number;
  /** Motrizes facturables del periodo CDMX actual. */
  qFact: number | null;
}

export interface BillingUsageHistoryItem {
  periodKey: string;
  stampsUsed: number;
  overageStamps: number;
}

export interface BillingUsage {
  tenantId: string;
  planCode: string;
  periodKey: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  includedStamps: number;
  stampsUsed: number;
  overageStamps: number;
  overagePriceCents: number;
  overageTotalCents: number;
  quotaPolicy: string;
  prepaidRemaining: number;
  prepaidConsumed: number;
  history: BillingUsageHistoryItem[];
}

export interface BillingEntitlementItem {
  moduleCode: string;
  moduleName: string;
  kind: string;
  status: string;
  activatedAt: string;
  priceLockedCents: number;
  priceTier: "ea" | "ga";
  memberCodes: string[];
}

export interface BillingCatalogItem {
  code: string;
  name: string;
  kind: string;
  isActiveForTenant: boolean;
  memberCodes: string[];
  priceEaCents: number | null;
  priceGaCents: number | null;
  maturity: string;
}

export interface BillingCommercialSummary {
  planMonthlyPriceCents: number;
  modulesTotalCents: number;
  overageTotalCents: number;
  subtotalCents: number;
  ivaCents: number;
  estimatedTotalCents: number;
  currency: "MXN";
  periodKey: string;
  billingCycle: string | null;
}

export interface BillingEntitlements {
  directEntitlements: BillingEntitlementItem[];
  effectiveModuleCodes: string[];
  profitabilityLevel: ProfitabilityLevel;
  catalog: BillingCatalogItem[];
  commercialSummary: BillingCommercialSummary;
}

/** Cargo SaaS open del ledger AR (GET /billing/arrears). */
export interface BillingArrearsInvoice {
  id: string;
  periodKey: string;
  status: string;
  totalCents: number;
  amountDueCents: number;
  dueDate: string | null;
  daysOverdue: number;
  issuedAt: string | null;
}

export interface BillingArrears {
  currency: "MXN";
  openCount: number;
  totalOpenCents: number;
  oldestDueDate: string | null;
  maxDaysOverdue: number;
  invoices: BillingArrearsInvoice[];
}

/** Slim staff access (GET /billing/access) — no prices / arrears. */
export interface BillingAccess {
  subscriptionStatus: string | null;
  isOperational: boolean;
  trialEndsAt: string | null;
  planName: string | null;
  effectiveModuleCodes: string[];
}

/**
 * Método de pago enmascarado (GET /billing/payment-methods).
 * Frontera ADR-0076: cargo suscripción SaaS Boeltech→tenant — no CFDI de flete.
 */
export interface BillingPaymentMethod {
  id: string;
  tenantId: string;
  gateway: string;
  gatewayPaymentMethodId: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSetupIntent {
  clientSecret: string;
  customerId: string;
  setupIntentId: string;
}

export type SaasPayStatus =
  | "paid"
  | "requires_action"
  | "processing"
  | "failed";

/** Resultado de POST /billing/saas-invoices/:id/pay */
export interface SaasInvoicePayResult {
  saasInvoiceId: string;
  status: SaasPayStatus;
  gatewayPaymentId: string;
  amountCents?: number;
  clientSecret?: string | null;
}

export const billingQueryKeys = {
  all: ["billing-saas"] as const,
  access: () => [...billingQueryKeys.all, "access"] as const,
  subscription: () => [...billingQueryKeys.all, "subscription"] as const,
  usage: () => [...billingQueryKeys.all, "usage"] as const,
  entitlements: () => [...billingQueryKeys.all, "entitlements"] as const,
  arrears: () => [...billingQueryKeys.all, "arrears"] as const,
  paymentMethods: () => [...billingQueryKeys.all, "payment-methods"] as const,
};
