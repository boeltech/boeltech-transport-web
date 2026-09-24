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

/** Lifecycle unificado derivado (ADR-0097). No se recalcula en cliente. */
export const PlatformLifecycleStage = {
  PROSPECT: "prospect",
  PROVISIONING: "provisioning",
  TRIALING: "trialing",
  ONBOARDING: "onboarding",
  ACTIVE: "active",
  AT_RISK: "at_risk",
  SUSPENDED: "suspended",
  CHURNED: "churned",
  ARCHIVED: "archived",
} as const;

export type PlatformLifecycleStageType =
  (typeof PlatformLifecycleStage)[keyof typeof PlatformLifecycleStage];

export const PLATFORM_LIFECYCLE_STAGE_VALUES = Object.values(
  PlatformLifecycleStage,
) as PlatformLifecycleStageType[];

/** Umbral visual at-risk (mismo que API); no recalcula score. */
export const PLATFORM_HEALTH_AT_RISK_THRESHOLD = 40;

export interface PlatformHealthSignals {
  fiscal: number;
  payment: number;
  adoption: number;
  fleet: number;
  engagement: number;
}

export interface PlatformHealthWeights {
  fiscal: number;
  payment: number;
  adoption: number;
  fleet: number;
  engagement: number;
}

export interface PlatformTenantHealth {
  score: number | null;
  asOf: string | null;
  signals: PlatformHealthSignals | null;
  weights: PlatformHealthWeights;
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
  /** ADR-0097 — null hasta primer refresh MV (R1 → UI "—"). */
  healthScore: number | null;
  lifecycleStage: PlatformLifecycleStageType;
  healthAsOf: string | null;
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
  /** ADR-0097 — breakdown embebido (no recalcular en cliente). */
  health: PlatformTenantHealth;
}

export interface PlatformPulseKpis {
  mrrCents: number;
  currency: string;
  cxcOverdueCents: number;
  tenantsAtRisk: number;
  trialsActive: number;
  stampsIssuedMtd: number;
  motricesAdministered: number;
  nrrPct: number | null;
  trialToPaidPct30d: number | null;
}

export interface PlatformPulseAttentionItem {
  tenantId: string;
  name: string;
  subdomain: string;
  lifecycleStage: PlatformLifecycleStageType;
  healthScore: number | null;
  reasonCodes: string[];
  cxcOverdueCents: number;
  subscriptionStatus: string | null;
  accessStatus: string;
}

export interface PlatformPulse {
  generatedAt: string;
  healthAsOf: string | null;
  kpis: PlatformPulseKpis;
  attentionQueue: PlatformPulseAttentionItem[];
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
  /** SoT v5 — $/motriz (null = legacy flat o Grande cotización). */
  pricePerMotrizCents: number | null;
  /** Timbres incluidos por motriz. Default API 30. */
  stampsPerMotriz: number;
  bandQMin: number | null;
  bandQMax: number | null;
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
  /** ADR-0097 additive filters */
  lifecycleStage?: PlatformLifecycleStageType;
  healthMin?: number;
  healthMax?: number;
  atRisk?: boolean;
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

import type {
  BillingEntitlements,
  BillingSubscription,
  ProfitabilityLevel,
} from "@features/billing/domain/entities";

/** Alias del eje comercial tenant (SoT v5 + ADR-0095 capacity). */
export type PlatformProfitabilityLevel = ProfitabilityLevel;

/**
 * Misma superficie que billing tenant (`BillingSubscription`):
 * motriz (pricePerMotrizCents, qFact, …) + capacity (ADR-0095).
 * Mapper: `mapPlatformTenantSubscription` = `mapBillingSubscription`.
 */
export type PlatformTenantSubscription = BillingSubscription;

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
  idempotencyKey?: string;
}

export interface PlatformModuleCatalogItem {
  code: string;
  name: string;
  kind: string;
  priceEaCents: number | null;
  priceGaCents: number | null;
  memberCodes: string[];
}

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

/** HTTP 1:1 = manual; D7-A auto-issue = auto_period_issue. */
export type PlatformSaasInvoiceOrigin = "manual" | "auto_period_issue";

export type PlatformCloseRunInclude = "actionable" | "policy" | "all";

export type PlatformCloseRunSkipGroup = "actionable" | "policy";

export type PlatformCloseRunSkipReason =
  | "NOT_CUSTOMER"
  | "SUB_NOT_ELIGIBLE"
  | "NO_CUT"
  | "CUT_NO_FLEET"
  | "CUT_QUOTE"
  | "CUT_ERROR"
  | "CUT_NOT_BILLABLE"
  | "MISSING_PLAN_CODE"
  | "MODULES_SNAPSHOT_NULL"
  | "TOTAL_ZERO"
  | "VOID_HOLD"
  | "ISSUE_FAILED";

export interface PlatformCloseRunQueryParams {
  periodKey?: string;
  tenantId?: string;
  include?: PlatformCloseRunInclude;
  page?: number;
  pageSize?: number;
}

export interface PlatformCloseRunSummary {
  ran: boolean;
  ranAt: string | null;
  issuedCount: number;
  consideredCount: number;
  errorsCount: number;
}

export interface PlatformCloseRunCounts {
  actionable: number;
  policy: number;
}

export interface PlatformCloseRunItem {
  tenantId: string;
  tenantName: string;
  subdomain: string;
  skipReason: PlatformCloseRunSkipReason;
  skipGroup: PlatformCloseRunSkipGroup;
  subscriptionStatus: string | null;
  cutStatus: string | null;
  estimatedTotalCents: number;
  hasFrozenAmount: boolean;
  canIssueOverride: boolean;
  existingVoidInvoiceId: string | null;
  nonVoidInvoiceId: string | null;
}

export interface PlatformCloseRun {
  periodKey: string;
  run: PlatformCloseRunSummary;
  counts: PlatformCloseRunCounts;
  items: PlatformCloseRunItem[];
}

/** Stripe-B auto-cargo — GET /platform/billing/ar/charge-run (F2a). */
export type PlatformAutoChargeAttemptOutcome =
  | "charged"
  | "failed"
  | "requires_action"
  | "processing";

export type PlatformAutoChargeItemOutcome =
  | PlatformAutoChargeAttemptOutcome
  | "skipped";

export type PlatformAutoChargeChipKind =
  | PlatformAutoChargeAttemptOutcome
  | "no_payment_method";

export interface PlatformChargeRunQueryParams {
  runId?: string;
  periodKey?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}

export interface PlatformChargeRunSummary {
  ran: boolean;
  id: string | null;
  ranAt: string | null;
  trigger: string | null;
  considered: number;
  charged: number;
  errors: number;
}

export interface PlatformChargeRunCounts {
  charged: number;
  noPaymentMethod: number;
  failed: number;
  requiresAction: number;
  processing: number;
  skippedOther: number;
}

export interface PlatformChargeRunItem {
  tenantId: string;
  tenantName: string;
  subdomain: string;
  saasInvoiceId: string;
  periodKey: string;
  outcome: PlatformAutoChargeItemOutcome;
  skipReason: string | null;
  failureCode: string | null;
  gatewayPaymentId: string | null;
  createdAt: string;
}

export interface PlatformChargeRunAttempt {
  saasInvoiceId: string;
  outcome: PlatformAutoChargeAttemptOutcome;
  skipReason: string | null;
  failureCode: string | null;
  createdAt: string;
}

export interface PlatformChargeRun {
  run: PlatformChargeRunSummary;
  counts: PlatformChargeRunCounts;
  items: PlatformChargeRunItem[];
  latestAttempts: PlatformChargeRunAttempt[];
}

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
  origin: PlatformSaasInvoiceOrigin;
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

/** POST …/saas-invoices/:invoiceId/issue — promote draft → open. */
export interface IssuePlatformSaasInvoiceDraftPayload {
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
  TENANT_ADMIN_ACTIVATION_SENT: "tenant_admin_activation_sent",
  TENANT_ADMIN_ACTIVATION_RESENT: "tenant_admin_activation_resent",
  TENANT_ADMIN_ACTIVATED: "tenant_admin_activated",
  TENANT_ADMIN_CREDENTIALS_ROTATED: "tenant_admin_credentials_rotated",
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
  targetTenantSubdomain: string | null;
  targetTenantName: string | null;
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
  pulse: () => [...platformQueryKeys.all, "pulse"] as const,
  plans: () => [...platformQueryKeys.all, "plans"] as const,
  tenants: () => [...platformQueryKeys.all, "tenants"] as const,
  tenantLists: () => [...platformQueryKeys.tenants(), "list"] as const,
  tenantList: (params?: PlatformTenantsQueryParams) =>
    [...platformQueryKeys.tenantLists(), params] as const,
  tenantDetail: (id: string) =>
    [...platformQueryKeys.tenants(), "detail", id] as const,
  tenantHealth: (id: string) =>
    [...platformQueryKeys.tenants(), "health", id] as const,
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
  arCloseRun: (params?: PlatformCloseRunQueryParams) =>
    [...platformQueryKeys.ar(), "close-run", params] as const,
  arChargeRun: (params?: PlatformChargeRunQueryParams) =>
    [...platformQueryKeys.ar(), "charge-run", params] as const,
  tenantSaasInvoices: (tenantId: string) =>
    [...platformQueryKeys.tenants(), "saas-invoices", tenantId] as const,
  tenantSaasInvoice: (tenantId: string, invoiceId: string) =>
    [
      ...platformQueryKeys.tenants(),
      "saas-invoices",
      tenantId,
      invoiceId,
    ] as const,
  tenantPaymentMethods: (tenantId: string) =>
    [...platformQueryKeys.tenants(), "payment-methods", tenantId] as const,
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
