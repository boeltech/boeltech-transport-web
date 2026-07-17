export type ProfitabilityLevel =
  | "L0"
  | "L0.5"
  | "L1"
  | "L2"
  | "L3"
  | "L4";

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
  limits: {
    maxUsers: number | null;
    maxBranches: number | null;
    historyMonths: number | null;
  };
  profitabilityLevel: ProfitabilityLevel;
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

export const billingQueryKeys = {
  all: ["billing-saas"] as const,
  subscription: () => [...billingQueryKeys.all, "subscription"] as const,
  usage: () => [...billingQueryKeys.all, "usage"] as const,
  entitlements: () => [...billingQueryKeys.all, "entitlements"] as const,
};

export const INTERNAL_STAFF_MODULE_CODE = "internal_staff_compensation";
