import type {
  PlatformBillingPlan,
  PlatformMetrics,
  PlatformTenantDetail,
  PlatformTenantListItem,
  PlatformUserJSON,
  PlatformAuditLogItem,
  PlatformTenantSubscription,
  PlatformTenantStampUsage,
  PlatformTenantEntitlements,
  PlatformModuleCatalogItem,
  PlatformStampPackCatalogItem,
  PlatformTenantStampPack,
  PlatformTenantStampPackBalance,
  PlatformSaasInvoice,
  PlatformSaasInvoiceDetail,
  PlatformSaasInvoiceItem,
  PlatformSaasInvoicePayment,
  PlatformSaasArRow,
  PlatformSaasInvoiceStatusType,
  PlatformSaasPaymentMethod,
  PlatformReconciliationPreview,
} from "../domain/entities";
import {
  mapBillingEntitlements,
  mapBillingSubscription,
  type ApiBillingEntitlements,
  type ApiBillingSubscription,
  type ApiBillingUsage,
} from "@features/billing/infrastructure/mappers";

export interface ApiPlatformUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  platform_role: string;
  scope: "platform";
  mfa_enabled?: boolean;
  mfa_enabled_at?: string | null;
}

export interface ApiPlatformMfaChallenge {
  needs_mfa: true;
  mfa_challenge_token: string;
  mfa_challenge_expires_at: string;
}

export type ApiPlatformLoginData =
  | {
      needs_mfa?: false;
      access_token: string;
      refresh_token: string;
      user: ApiPlatformUser;
    }
  | ApiPlatformMfaChallenge;

export interface ApiPlatformTenantListItem {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  subscription_status?: string | null;
  plan_code: string | null;
  plan_name: string | null;
  declared_fleet_band?: string | null;
  declared_fleet_units?: number | null;
  user_count: number;
  branch_count: number;
  trip_count: number;
  created_at: string;
  suspended_at: string | null;
}

export interface ApiPlatformMetrics {
  total_tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  tenants_by_plan: Record<string, number>;
  total_users: number;
  tenants_created_last_30_days: number;
}

export interface ApiPlatformBillingPlan {
  code: string;
  name: string;
  max_users: number | null;
  max_branches: number | null;
  history_months: number | null;
  is_active: boolean;
  monthly_price_cents?: number;
  annual_price_cents?: number | null;
  included_stamps?: number;
  overage_price_cents?: number;
  quota_policy?: string;
  features?: Record<string, unknown>;
}

export const mapPlatformUser = (raw: ApiPlatformUser): PlatformUserJSON => ({
  id: raw.id,
  email: raw.email,
  firstName: raw.first_name,
  lastName: raw.last_name,
  platformRole: raw.platform_role as PlatformUserJSON["platformRole"],
  scope: raw.scope,
  mfaEnabled: raw.mfa_enabled,
  mfaEnabledAt: raw.mfa_enabled_at ?? null,
});

export const isApiPlatformMfaChallenge = (
  data: ApiPlatformLoginData,
): data is ApiPlatformMfaChallenge =>
  "needs_mfa" in data && data.needs_mfa === true;

export const mapPlatformTenantListItem = (
  raw: ApiPlatformTenantListItem,
): PlatformTenantListItem => ({
  id: raw.id,
  name: raw.name,
  subdomain: raw.subdomain,
  status: raw.status as PlatformTenantListItem["status"],
  subscriptionStatus: raw.subscription_status ?? null,
  planCode: raw.plan_code,
  planName: raw.plan_name,
  declaredFleetBand: raw.declared_fleet_band ?? null,
  declaredFleetUnits:
    raw.declared_fleet_units != null ? Number(raw.declared_fleet_units) : null,
  userCount: raw.user_count,
  branchCount: raw.branch_count,
  tripCount: raw.trip_count,
  createdAt: raw.created_at,
  suspendedAt: raw.suspended_at,
});

export const mapPlatformTenantDetail = (
  raw: ApiPlatformTenantListItem & {
    usage?: { user_count: number; branch_count: number; trip_count: number };
  },
): PlatformTenantDetail => ({
  ...mapPlatformTenantListItem(raw),
  usage: raw.usage
    ? {
        userCount: raw.usage.user_count,
        branchCount: raw.usage.branch_count,
        tripCount: raw.usage.trip_count,
      }
    : {
        userCount: raw.user_count,
        branchCount: raw.branch_count,
        tripCount: raw.trip_count,
      },
});

export const mapPlatformMetrics = (raw: ApiPlatformMetrics): PlatformMetrics => ({
  totalTenants: raw.total_tenants,
  activeTenants: raw.active_tenants,
  suspendedTenants: raw.suspended_tenants,
  tenantsByPlan: raw.tenants_by_plan,
  totalUsers: raw.total_users,
  tenantsCreatedLast30Days: raw.tenants_created_last_30_days,
});

export const mapPlatformBillingPlan = (
  raw: ApiPlatformBillingPlan,
): PlatformBillingPlan => ({
  code: raw.code,
  name: raw.name,
  maxUsers: raw.max_users,
  maxBranches: raw.max_branches,
  historyMonths: raw.history_months,
  isActive: raw.is_active,
  monthlyPriceCents: raw.monthly_price_cents ?? 0,
  annualPriceCents: raw.annual_price_cents ?? null,
  includedStamps: raw.included_stamps ?? 0,
  overagePriceCents: raw.overage_price_cents ?? 0,
  quotaPolicy: raw.quota_policy ?? "soft_cap",
  features: raw.features ?? {},
});

export const toApiCreatePlatformTenant = (payload: {
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
}) => ({
  company: payload.company,
  admin: {
    email: payload.admin.email,
    password: payload.admin.password,
    first_name: payload.admin.firstName,
    last_name: payload.admin.lastName,
  },
  ...(payload.planCode ? { plan_code: payload.planCode } : {}),
  ...(payload.declaredFleetBand
    ? { declared_fleet_band: payload.declaredFleetBand }
    : {}),
  ...(payload.declaredFleetUnits != null
    ? { declared_fleet_units: payload.declaredFleetUnits }
    : {}),
});

export const toApiUpdateDeclaredFleet = (payload: {
  declaredFleetBand?: string | null;
  declaredFleetUnits?: number | null;
}) => ({
  ...(payload.declaredFleetBand !== undefined
    ? { declared_fleet_band: payload.declaredFleetBand }
    : {}),
  ...(payload.declaredFleetUnits !== undefined
    ? { declared_fleet_units: payload.declaredFleetUnits }
    : {}),
});

export const toApiUpdatePlatformTenantStatus = (payload: {
  status: string;
  reason?: string;
}) => ({
  status: payload.status,
  ...(payload.reason ? { reason: payload.reason } : {}),
});

export type ApiPlatformAuditLogItem = {
  id: string;
  platform_user_id: string | null;
  platform_user_email: string | null;
  action: string;
  target_tenant_id: string | null;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const mapPlatformAuditLogItem = (
  raw: ApiPlatformAuditLogItem,
): PlatformAuditLogItem => ({
  id: raw.id,
  platformUserId: raw.platform_user_id ?? null,
  platformUserEmail: raw.platform_user_email,
  action: raw.action,
  targetTenantId: raw.target_tenant_id,
  targetType: raw.target_type,
  targetId: raw.target_id,
  metadata: raw.metadata ?? {},
  createdAt: raw.created_at,
});

export const mapPlatformTenantSubscription = (
  raw: ApiBillingSubscription,
): PlatformTenantSubscription => mapBillingSubscription(raw);

export const mapPlatformTenantStampUsage = (
  raw: ApiBillingUsage,
): PlatformTenantStampUsage => ({
  tenantId: raw.tenant_id,
  planCode: raw.plan_code,
  periodKey: raw.period_key,
  includedStamps: raw.included_stamps,
  stampsUsed: raw.stamps_used,
  overageStamps: raw.overage_stamps,
  overageTotalCents: raw.overage_total_cents,
  quotaPolicy: raw.quota_policy,
  prepaidRemaining: raw.prepaid_remaining ?? 0,
  prepaidConsumed: raw.prepaid_consumed ?? 0,
});

export const mapPlatformStampPackCatalogItem = (raw: {
  code: string;
  name: string;
  stamps: number;
  price_cents: number;
  is_active: boolean;
  sort_order: number;
}): PlatformStampPackCatalogItem => ({
  code: raw.code,
  name: raw.name,
  stamps: raw.stamps,
  priceCents: raw.price_cents,
  isActive: raw.is_active,
  sortOrder: raw.sort_order,
});

export const mapPlatformTenantStampPack = (raw: {
  id: string;
  tenant_id: string;
  catalog_code: string;
  stamps_purchased: number;
  stamps_remaining: number;
  price_cents: number;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}): PlatformTenantStampPack => ({
  id: raw.id,
  tenantId: raw.tenant_id,
  catalogCode: raw.catalog_code,
  stampsPurchased: raw.stamps_purchased,
  stampsRemaining: raw.stamps_remaining,
  priceCents: raw.price_cents,
  expiresAt: raw.expires_at,
  notes: raw.notes,
  createdAt: raw.created_at,
});

export const mapPlatformTenantStampPackBalance = (raw: {
  prepaid_remaining: number;
  prepaid_purchased: number;
  prepaid_consumed: number;
  packs: Array<{
    id: string;
    tenant_id: string;
    catalog_code: string;
    stamps_purchased: number;
    stamps_remaining: number;
    price_cents: number;
    expires_at: string | null;
    notes: string | null;
    created_at: string;
  }>;
}): PlatformTenantStampPackBalance => ({
  prepaidRemaining: raw.prepaid_remaining,
  prepaidPurchased: raw.prepaid_purchased,
  prepaidConsumed: raw.prepaid_consumed,
  packs: raw.packs.map(mapPlatformTenantStampPack),
});

export const mapPlatformTenantEntitlements = (
  raw: ApiBillingEntitlements,
): PlatformTenantEntitlements => mapBillingEntitlements(raw);

export const mapPlatformModuleCatalogItem = (raw: {
  code: string;
  name: string;
  kind: string;
  price_ea_cents: number | null;
  price_ga_cents: number | null;
  member_codes: string[];
}): PlatformModuleCatalogItem => ({
  code: raw.code,
  name: raw.name,
  kind: raw.kind,
  priceEaCents: raw.price_ea_cents,
  priceGaCents: raw.price_ga_cents,
  memberCodes: raw.member_codes,
});

export interface ApiPlatformSaasInvoiceItem {
  id: string;
  saas_invoice_id: string;
  kind: string;
  code: string | null;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  sort_order: number;
}

export interface ApiPlatformSaasInvoicePayment {
  id: string;
  saas_invoice_id: string;
  tenant_id: string;
  amount_cents: number;
  paid_at: string;
  method: string;
  reference: string | null;
  notes: string | null;
  recorded_by_platform_user_id: string | null;
  gateway_payment_id: string | null;
  created_at: string;
}

export interface ApiPlatformSaasInvoice {
  id: string;
  tenant_id: string;
  subscription_id: string | null;
  period_key: string;
  period_start: string;
  period_end: string;
  status: string;
  currency: string;
  plan_code: string;
  stamps_included: number;
  stamps_used: number;
  stamps_overage: number;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  amount_due_cents: number;
  amount_paid_cents: number;
  issued_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
  notes: string | null;
  days_overdue: number;
  created_at: string;
  updated_at: string;
}

export interface ApiPlatformSaasArRow extends ApiPlatformSaasInvoice {
  tenant_name: string;
  subdomain: string;
  subscription_status: string | null;
}

export interface ApiPlatformSaasInvoiceDetail extends ApiPlatformSaasInvoice {
  items: ApiPlatformSaasInvoiceItem[];
  payments: ApiPlatformSaasInvoicePayment[];
}

export interface ApiPlatformReconciliationRow {
  tenant_id: string;
  tenant_name: string;
  subdomain: string;
  period_key: string;
  plan_code: string | null;
  plan_name: string | null;
  monthly_price_cents: number;
  billing_cycle: string | null;
  status: string | null;
  included_stamps: number;
  stamps_used: number;
  overage_stamps: number;
  overage_price_cents: number;
  overage_total_cents: number;
  active_modules: string[];
  modules_total_cents: number;
  subtotal_cents: number;
  iva_cents: number;
  total_cents: number;
}

export const mapPlatformSaasInvoiceItem = (
  raw: ApiPlatformSaasInvoiceItem,
): PlatformSaasInvoiceItem => ({
  id: raw.id,
  saasInvoiceId: raw.saas_invoice_id,
  kind: raw.kind,
  code: raw.code,
  description: raw.description,
  quantity: raw.quantity,
  unitPriceCents: raw.unit_price_cents,
  totalCents: raw.total_cents,
  sortOrder: raw.sort_order,
});

export const mapPlatformSaasInvoicePayment = (
  raw: ApiPlatformSaasInvoicePayment,
): PlatformSaasInvoicePayment => ({
  id: raw.id,
  saasInvoiceId: raw.saas_invoice_id,
  tenantId: raw.tenant_id,
  amountCents: raw.amount_cents,
  paidAt: raw.paid_at,
  method: raw.method as PlatformSaasPaymentMethod,
  reference: raw.reference,
  notes: raw.notes,
  recordedByPlatformUserId: raw.recorded_by_platform_user_id,
  gatewayPaymentId: raw.gateway_payment_id,
  createdAt: raw.created_at,
});

export const mapPlatformSaasInvoice = (
  raw: ApiPlatformSaasInvoice,
): PlatformSaasInvoice => ({
  id: raw.id,
  tenantId: raw.tenant_id,
  subscriptionId: raw.subscription_id,
  periodKey: raw.period_key,
  periodStart: raw.period_start,
  periodEnd: raw.period_end,
  status: raw.status as PlatformSaasInvoiceStatusType,
  currency: raw.currency,
  planCode: raw.plan_code,
  stampsIncluded: raw.stamps_included,
  stampsUsed: raw.stamps_used,
  stampsOverage: raw.stamps_overage,
  subtotalCents: raw.subtotal_cents,
  taxCents: raw.tax_cents,
  totalCents: raw.total_cents,
  amountDueCents: raw.amount_due_cents,
  amountPaidCents: raw.amount_paid_cents,
  issuedAt: raw.issued_at,
  dueDate: raw.due_date,
  paidAt: raw.paid_at,
  voidedAt: raw.voided_at,
  voidReason: raw.void_reason,
  notes: raw.notes,
  daysOverdue: raw.days_overdue,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

export const mapPlatformSaasArRow = (
  raw: ApiPlatformSaasArRow,
): PlatformSaasArRow => ({
  ...mapPlatformSaasInvoice(raw),
  tenantName: raw.tenant_name,
  subdomain: raw.subdomain,
  subscriptionStatus: raw.subscription_status,
});

export const mapPlatformSaasInvoiceDetail = (
  raw: ApiPlatformSaasInvoiceDetail,
): PlatformSaasInvoiceDetail => ({
  ...mapPlatformSaasInvoice(raw),
  items: (raw.items ?? []).map(mapPlatformSaasInvoiceItem),
  payments: (raw.payments ?? []).map(mapPlatformSaasInvoicePayment),
});

export const mapPlatformReconciliationPreview = (
  raw: ApiPlatformReconciliationRow,
): PlatformReconciliationPreview => ({
  tenantId: raw.tenant_id,
  tenantName: raw.tenant_name,
  subdomain: raw.subdomain,
  periodKey: raw.period_key,
  planCode: raw.plan_code,
  planName: raw.plan_name,
  monthlyPriceCents: raw.monthly_price_cents,
  billingCycle: raw.billing_cycle,
  status: raw.status,
  includedStamps: raw.included_stamps,
  stampsUsed: raw.stamps_used,
  overageStamps: raw.overage_stamps,
  overagePriceCents: raw.overage_price_cents,
  overageTotalCents: raw.overage_total_cents,
  activeModules: raw.active_modules ?? [],
  modulesTotalCents: raw.modules_total_cents,
  subtotalCents: raw.subtotal_cents,
  ivaCents: raw.iva_cents,
  totalCents: raw.total_cents,
});
