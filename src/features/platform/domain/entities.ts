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

/** Commercial subscription statuses (tenant_subscriptions.status). */
export const PlatformSubscriptionStatus = {
  TRIALING: "trialing",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  PAUSED: "paused",
  CANCELED: "canceled",
} as const;

export type PlatformSubscriptionStatusType =
  (typeof PlatformSubscriptionStatus)[keyof typeof PlatformSubscriptionStatus];

export const PLATFORM_SUBSCRIPTION_STATUS_VALUES = Object.values(
  PlatformSubscriptionStatus,
) as PlatformSubscriptionStatusType[];

export interface PlatformUserJSON {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: PlatformRoleType;
  scope: "platform";
  /** Present after profile fetch / login that includes MFA fields. */
  mfaEnabled?: boolean;
  mfaEnabledAt?: string | null;
}

/** Challenge MFA tras password OK (sin tokens de sesión aún). */
export interface PlatformMfaChallengeResponse {
  needsMfa: true;
  mfaChallengeToken: string;
  mfaChallengeExpiresAt: string;
}

export type PlatformLoginResult =
  | {
      accessToken: string;
      refreshToken: string;
      user: PlatformUserJSON;
    }
  | PlatformMfaChallengeResponse;

export function isPlatformMfaChallenge(
  result: PlatformLoginResult,
): result is PlatformMfaChallengeResponse {
  return "needsMfa" in result && result.needsMfa === true;
}

export interface PlatformMfaStatus {
  enabled: boolean;
  enabledAt: string | null;
}

export interface PlatformTenantListItem {
  id: string;
  name: string;
  subdomain: string;
  status: PlatformTenantStatusType;
  /** Commercial axis; null when the tenant has no subscription row. */
  subscriptionStatus: string | null;
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

/** Derived admin-activation status from platform GET/POST tenants (ADR-0073). */
export const AdminActivationStatus = {
  PENDING: "pending",
  EMAIL_FAILED: "email_failed",
  EXPIRED: "expired",
  ACTIVATED: "activated",
  NONE: "none",
} as const;

export type AdminActivationStatusType =
  (typeof AdminActivationStatus)[keyof typeof AdminActivationStatus];

export const ADMIN_ACTIVATION_STATUS_LABELS: Record<
  AdminActivationStatusType,
  string
> = {
  pending: "Pendiente",
  email_failed: "Email falló",
  expired: "Expirada",
  activated: "Activado",
  none: "Sin activación",
};

export interface PlatformAdminActivation {
  status: AdminActivationStatusType;
  email: string | null;
  expiresAt: string | null;
  lastSentAt: string | null;
  lastSendError: string | null;
  sendAttempts: number;
}

export interface PlatformTenantAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

export interface PlatformTenantDetail extends PlatformTenantListItem {
  usage: {
    userCount: number;
    branchCount: number;
    tripCount: number;
  };
  adminActivation: PlatformAdminActivation | null;
}

export interface CreatePlatformTenantResult {
  tenant: PlatformTenantListItem;
  admin: PlatformTenantAdmin;
  adminActivation: PlatformAdminActivation;
}

export interface RotateAdminCredentialsPayload {
  password: string;
  resendActivation?: boolean;
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
  subscriptionStatus?: PlatformSubscriptionStatusType;
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

/** Cargo SaaS (CxC) statuses — ADR-0072. */
export const PlatformSaasInvoiceStatus = {
  DRAFT: "draft",
  OPEN: "open",
  PAID: "paid",
  VOID: "void",
} as const;

export type PlatformSaasInvoiceStatusType =
  (typeof PlatformSaasInvoiceStatus)[keyof typeof PlatformSaasInvoiceStatus];

export const PLATFORM_SAAS_INVOICE_STATUS_VALUES = Object.values(
  PlatformSaasInvoiceStatus,
) as PlatformSaasInvoiceStatusType[];

export type PlatformSaasPaymentMethod =
  | "manual"
  | "spei"
  | "card_external"
  | "other";

export interface PlatformSaasInvoiceItem {
  id: string;
  saasInvoiceId: string;
  kind: string;
  code: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  sortOrder: number;
}

export interface PlatformSaasInvoicePayment {
  id: string;
  saasInvoiceId: string;
  tenantId: string;
  amountCents: number;
  paidAt: string;
  method: PlatformSaasPaymentMethod;
  reference: string | null;
  notes: string | null;
  recordedByPlatformUserId: string | null;
  gatewayPaymentId: string | null;
  createdAt: string;
}

export interface PlatformSaasInvoice {
  id: string;
  tenantId: string;
  subscriptionId: string | null;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  status: PlatformSaasInvoiceStatusType;
  currency: string;
  planCode: string;
  stampsIncluded: number;
  stampsUsed: number;
  stampsOverage: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  amountDueCents: number;
  amountPaidCents: number;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  notes: string | null;
  daysOverdue: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSaasArRow extends PlatformSaasInvoice {
  tenantName: string;
  subdomain: string;
  subscriptionStatus: string | null;
}

export interface PlatformSaasInvoiceDetail extends PlatformSaasInvoice {
  items: PlatformSaasInvoiceItem[];
  payments: PlatformSaasInvoicePayment[];
}

export interface PlatformArListQueryParams {
  page?: number;
  pageSize?: number;
  status?: PlatformSaasInvoiceStatusType;
  periodKey?: string;
  tenantId?: string;
  minDaysOverdue?: number;
}

export interface IssuePlatformSaasInvoicePayload {
  periodKey: string;
  status?: "draft" | "open";
  notes?: string | null;
  dueDays?: number;
}

export interface MarkPlatformSaasInvoicePaidPayload {
  paidAt: string;
  method?: PlatformSaasPaymentMethod;
  reference?: string | null;
  notes?: string | null;
  amountCents?: number;
}

export interface VoidPlatformSaasInvoicePayload {
  voidReason?: string | null;
}

/** Preview row from GET /platform/billing/reconciliation (format=json). */
export interface PlatformReconciliationPreview {
  tenantId: string;
  tenantName: string;
  subdomain: string;
  periodKey: string;
  planCode: string | null;
  planName: string | null;
  monthlyPriceCents: number;
  billingCycle: string | null;
  status: string | null;
  includedStamps: number;
  stampsUsed: number;
  overageStamps: number;
  overagePriceCents: number;
  overageTotalCents: number;
  activeModules: string[];
  modulesTotalCents: number;
  subtotalCents: number;
  ivaCents: number;
  totalCents: number;
}

export const PlatformAuditAction = {
  TENANT_CREATED: "tenant_created",
  TENANT_STATUS_CHANGED: "tenant_status_changed",
  TENANT_PLAN_ASSIGNED: "tenant_plan_assigned",
  TENANT_FLEET_DECLARED: "tenant_fleet_declared",
  TENANT_SELF_SERVE_REGISTERED: "tenant_self_serve_registered",
  TRIAL_AUTO_CUT: "trial_auto_cut",
  CATALOG_IMPORT: "catalog_import",
  SUBSCRIPTION_ASSIGNED: "subscription_assigned",
  MODULE_ENTITLED: "module_entitled",
  MODULE_REVOKED: "module_revoked",
  STAMP_PACK_GRANTED: "stamp_pack_granted",
  SAAS_INVOICE_ISSUED: "saas_invoice_issued",
  SAAS_INVOICE_PAID: "saas_invoice_paid",
  SAAS_INVOICE_VOIDED: "saas_invoice_voided",
  SUBSCRIPTION_PAST_DUE_AUTO: "subscription_past_due_auto",
  SUBSCRIPTION_ACTIVE_RESTORED_AUTO: "subscription_active_restored_auto",
} as const;

export type PlatformAuditActionType =
  (typeof PlatformAuditAction)[keyof typeof PlatformAuditAction];

export interface PlatformAuditLogItem {
  id: string;
  platformUserId: string | null;
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
  ar: () => [...platformQueryKeys.all, "ar"] as const,
  arList: (params?: PlatformArListQueryParams) =>
    [...platformQueryKeys.ar(), "list", params] as const,
  tenantSaasInvoices: (tenantId: string) =>
    [...platformQueryKeys.tenants(), "saas-invoices", tenantId] as const,
  tenantSaasInvoice: (tenantId: string, invoiceId: string) =>
    [
      ...platformQueryKeys.tenants(),
      "saas-invoices",
      tenantId,
      invoiceId,
    ] as const,
  tenantReconciliationPreview: (tenantId: string, periodKey: string) =>
    [
      ...platformQueryKeys.tenants(),
      "reconciliation-preview",
      tenantId,
      periodKey,
    ] as const,
} as const;

export function isPlatformOwner(role: PlatformRoleType | undefined): boolean {
  return role === PlatformRole.OWNER;
}
