export const PlatformRole = {
  OWNER: "platform_owner",
  SUPPORT: "platform_support",
} as const;

export type PlatformRoleType =
  (typeof PlatformRole)[keyof typeof PlatformRole];

export const PlatformTenantStatus = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  CANCELLED: "cancelled",
} as const;

export type PlatformTenantStatusType =
  (typeof PlatformTenantStatus)[keyof typeof PlatformTenantStatus];

export const PLATFORM_TENANT_STATUS_LABELS: Record<
  PlatformTenantStatusType,
  string
> = {
  [PlatformTenantStatus.ACTIVE]: "Activo",
  [PlatformTenantStatus.SUSPENDED]: "Suspendido",
  [PlatformTenantStatus.CANCELLED]: "Cancelado",
};

export interface PlatformUserJSON {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: PlatformRoleType;
  scope: "platform";
}

export interface PlatformTenantListItem {
  id: string;
  name: string;
  subdomain: string;
  status: PlatformTenantStatusType;
  planCode: string | null;
  planName: string | null;
  declaredFleetBand: string | null;
  declaredFleetUnits: number | null;
  userCount: number;
  branchCount: number;
  tripCount: number;
  createdAt: string;
  suspendedAt: string | null;
}

export interface PlatformTenantDetail extends PlatformTenantListItem {
  usage: {
    userCount: number;
    branchCount: number;
    tripCount: number;
  };
}

export interface PlatformBillingPlan {
  code: string;
  name: string;
  maxUsers: number | null;
  maxBranches: number | null;
  historyMonths: number | null;
  isActive: boolean;
  monthlyPriceCents: number;
  annualPriceCents: number | null;
  includedStamps: number;
  overagePriceCents: number;
  quotaPolicy: string;
  features: Record<string, unknown>;
}

export interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  tenantsByPlan: Record<string, number>;
  totalUsers: number;
  tenantsCreatedLast30Days: number;
}

export interface PlatformTenantsQueryParams {
  page?: number;
  limit?: number;
  status?: PlatformTenantStatusType;
  planCode?: string;
  search?: string;
}

export interface CreatePlatformTenantPayload {
  company: { name: string; subdomain: string };
  admin: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
  planCode?: string;
  declaredFleetBand?: string | null;
  declaredFleetUnits?: number | null;
}

export interface UpdateDeclaredFleetPayload {
  declaredFleetBand?: string | null;
  declaredFleetUnits?: number | null;
}

export interface UpdatePlatformTenantStatusPayload {
  status: PlatformTenantStatusType;
  reason?: string;
}

export type PlatformProfitabilityLevel =
  | "L0"
  | "L0.5"
  | "L1"
  | "L2"
  | "L3"
  | "L4";

export interface PlatformTenantSubscription {
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
  profitabilityLevel: PlatformProfitabilityLevel;
}

export interface PlatformTenantStampUsage {
  tenantId: string;
  planCode: string;
  periodKey: string;
  includedStamps: number;
  stampsUsed: number;
  overageStamps: number;
  overageTotalCents: number;
  quotaPolicy: string;
  prepaidRemaining: number;
  prepaidConsumed: number;
}

export interface PlatformStampPackCatalogItem {
  code: string;
  name: string;
  stamps: number;
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
}

export interface PlatformTenantStampPack {
  id: string;
  tenantId: string;
  catalogCode: string;
  stampsPurchased: number;
  stampsRemaining: number;
  priceCents: number;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PlatformTenantStampPackBalance {
  prepaidRemaining: number;
  prepaidPurchased: number;
  prepaidConsumed: number;
  packs: PlatformTenantStampPack[];
}

export interface GrantPlatformStampPackPayload {
  catalogCode: string;
  notes?: string | null;
}

export interface PlatformModuleCatalogItem {
  code: string;
  name: string;
  kind: string;
  priceEaCents: number | null;
  priceGaCents: number | null;
  memberCodes: string[];
}

import type { BillingEntitlements } from "@features/billing/domain/entities";

export type PlatformTenantEntitlements = BillingEntitlements;

export interface UpsertPlatformTenantSubscriptionPayload {
  planCode: string;
  status?: string;
  billingCycle?: string;
  trialEndsAt?: string | null;
  notes?: string | null;
}

export interface MutatePlatformEntitlementPayload {
  moduleCode: string;
  action: "activate" | "deactivate";
}

export const PlatformAuditAction = {
  TENANT_CREATED: "tenant_created",
  TENANT_STATUS_CHANGED: "tenant_status_changed",
  TENANT_PLAN_ASSIGNED: "tenant_plan_assigned",
  CATALOG_IMPORT: "catalog_import",
  SUBSCRIPTION_ASSIGNED: "subscription_assigned",
  MODULE_ENTITLED: "module_entitled",
  MODULE_REVOKED: "module_revoked",
} as const;

export type PlatformAuditActionType =
  (typeof PlatformAuditAction)[keyof typeof PlatformAuditAction];

export interface PlatformAuditLogItem {
  id: string;
  platformUserId: string;
  platformUserEmail: string | null;
  action: string;
  targetTenantId: string | null;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformAuditLogQueryParams {
  page?: number;
  limit?: number;
  action?: string;
  targetTenantId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export const platformQueryKeys = {
  all: ["platform"] as const,
  profile: () => [...platformQueryKeys.all, "profile"] as const,
  metrics: () => [...platformQueryKeys.all, "metrics"] as const,
  plans: () => [...platformQueryKeys.all, "plans"] as const,
  tenants: () => [...platformQueryKeys.all, "tenants"] as const,
  tenantLists: () => [...platformQueryKeys.tenants(), "list"] as const,
  tenantList: (params?: PlatformTenantsQueryParams) =>
    [...platformQueryKeys.tenantLists(), params] as const,
  tenantDetail: (id: string) =>
    [...platformQueryKeys.tenants(), "detail", id] as const,
  tenantSubscription: (id: string) =>
    [...platformQueryKeys.tenants(), "subscription", id] as const,
  tenantStampUsage: (id: string) =>
    [...platformQueryKeys.tenants(), "stamp-usage", id] as const,
  tenantEntitlements: (id: string) =>
    [...platformQueryKeys.tenants(), "entitlements", id] as const,
  tenantStampPacks: (id: string) =>
    [...platformQueryKeys.tenants(), "stamp-packs", id] as const,
  stampPackCatalog: () => [...platformQueryKeys.all, "stamp-pack-catalog"] as const,
  modules: () => [...platformQueryKeys.all, "modules"] as const,
  auditLog: () => [...platformQueryKeys.all, "audit-log"] as const,
  auditLogList: (params?: PlatformAuditLogQueryParams) =>
    [...platformQueryKeys.auditLog(), params] as const,
} as const;

export function isPlatformOwner(role: PlatformRoleType | undefined): boolean {
  return role === PlatformRole.OWNER;
}
