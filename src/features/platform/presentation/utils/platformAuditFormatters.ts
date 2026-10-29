import {
  PLATFORM_TENANT_STATUS_LABELS,
  PlatformAuditAction,
  type PlatformAuditLogItem,
  type PlatformBillingPlan,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";
import { resolvePlanDisplayName } from "./formatPlanLabel";
import {
  formatBillingPriceCents,
  getPlatformSubscriptionStatusLabel,
} from "./platformBillingFormatters";

type PlanRef = readonly Pick<PlatformBillingPlan, "code" | "name">[] | undefined;

function getActionLabel(action: string): string {
  const labels = platformCopy.audit.actions as Record<string, string>;
  return labels[action] ?? action;
}

function formatAccessStatus(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "—";
  const normalized = raw === "canceled" ? "cancelled" : raw;
  return (
    PLATFORM_TENANT_STATUS_LABELS[normalized as PlatformTenantStatusType] ?? raw
  );
}

function formatSubscriptionStatus(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  return getPlatformSubscriptionStatusLabel(raw);
}

function resolvePlanLabel(raw: unknown, plans?: PlanRef): string {
  if (typeof raw !== "string" || !raw) return "—";
  return resolvePlanDisplayName(raw, plans);
}

function metadataString(
  metadata: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function metadataNumber(
  metadata: Record<string, unknown>,
  key: string,
): number | null {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatTotalCents(metadata: Record<string, unknown>): string | null {
  const cents = metadataNumber(metadata, "total_cents");
  return cents != null ? formatBillingPriceCents(cents) : null;
}

function formatAmountCents(metadata: Record<string, unknown>): string | null {
  const cents = metadataNumber(metadata, "amount_cents");
  return cents != null ? formatBillingPriceCents(cents) : null;
}

export function getAuditOperatorLabel(item: PlatformAuditLogItem): string {
  if (item.platformUserEmail) return item.platformUserEmail;
  if (item.action === PlatformAuditAction.TENANT_SELF_SERVE_REGISTERED) {
    return platformCopy.audit.selfServeOperator;
  }
  return platformCopy.audit.systemOperator;
}

export function getAuditTenantLabel(
  item: PlatformAuditLogItem,
  filteredTenantLabel?: string | null,
): string {
  if (filteredTenantLabel) return filteredTenantLabel;

  if (
    typeof item.targetTenantSubdomain === "string" &&
    item.targetTenantSubdomain.trim().length > 0
  ) {
    return item.targetTenantSubdomain.trim();
  }

  const legacySubdomain = metadataString(item.metadata, "subdomain");
  if (legacySubdomain) return legacySubdomain;

  const legacyName = metadataString(
    item.metadata,
    "tenant_name",
    "company_name",
    "name",
  );
  if (legacyName) return legacyName;

  return item.targetTenantId
    ? platformCopy.audit.unknownTenant
    : "—";
}

export function getAuditMetadataSummary(
  item: PlatformAuditLogItem,
  plans?: PlanRef,
): string {
  const metadata = item.metadata;
  const copy = platformCopy.audit.metadata;

  switch (item.action) {
    case PlatformAuditAction.TENANT_STATUS_CHANGED:
      return copy.statusChanged(
        formatAccessStatus(metadata.previous_status),
        formatAccessStatus(metadata.status),
        typeof metadata.reason === "string" ? metadata.reason : null,
      );
    case PlatformAuditAction.TENANT_PLAN_ASSIGNED:
      return copy.planAssigned(
        resolvePlanLabel(
          metadata.plan_code ?? metadata.new_plan_code,
          plans,
        ),
      );
    case PlatformAuditAction.TENANT_CREATED:
      return copy.tenantCreated(
        metadataString(metadata, "subdomain") ?? "—",
        typeof metadata.plan_code === "string"
          ? resolvePlanLabel(metadata.plan_code, plans)
          : null,
      );
    case PlatformAuditAction.TENANT_SELF_SERVE_REGISTERED:
      return copy.selfServeRegistered(
        metadataString(metadata, "subdomain") ?? "—",
        typeof metadata.plan_code === "string"
          ? resolvePlanLabel(metadata.plan_code, plans)
          : null,
      );
    case PlatformAuditAction.TENANT_FLEET_DECLARED:
      return copy.fleetDeclared(
        metadataString(metadata, "declared_fleet_band", "band"),
        typeof metadata.declared_fleet_units === "number"
          ? metadata.declared_fleet_units
          : typeof metadata.units === "number"
            ? metadata.units
            : null,
      );
    case PlatformAuditAction.TENANT_ADMIN_ACTIVATION_SENT:
      return copy.activationSent(
        metadataString(metadata, "email"),
        metadata.send_failed === true,
      );
    case PlatformAuditAction.TENANT_ADMIN_ACTIVATION_RESENT:
      return copy.activationResent(
        metadataString(metadata, "email"),
        metadata.send_failed === true,
      );
    case PlatformAuditAction.TENANT_ADMIN_ACTIVATED:
      return copy.adminActivated(metadataString(metadata, "email"));
    case PlatformAuditAction.TENANT_ADMIN_CREDENTIALS_ROTATED:
      return copy.credentialsRotated(
        metadataString(metadata, "email"),
        metadata.resend_activation === true,
      );
    case PlatformAuditAction.TRIAL_AUTO_CUT:
      return copy.trialAutoCut(
        typeof metadata.reason === "string" ? metadata.reason : null,
        typeof metadata.plan_code === "string"
          ? resolvePlanLabel(metadata.plan_code, plans)
          : null,
      );
    case PlatformAuditAction.CATALOG_IMPORT:
      return copy.catalogImport(
        typeof metadata.type_code === "string" ? metadata.type_code : null,
        typeof metadata.version === "string" ? metadata.version : null,
      );
    case PlatformAuditAction.SUBSCRIPTION_ASSIGNED:
      return copy.subscriptionAssigned(
        resolvePlanLabel(metadata.plan_code, plans),
        formatSubscriptionStatus(metadata.status),
      );
    case PlatformAuditAction.MODULE_ENTITLED:
      return copy.moduleEntitled(String(metadata.module_code ?? "—"));
    case PlatformAuditAction.MODULE_REVOKED:
      return copy.moduleRevoked(String(metadata.module_code ?? "—"));
    case PlatformAuditAction.STAMP_PACK_GRANTED:
      return copy.stampPackGranted(
        typeof metadata.catalog_code === "string"
          ? metadata.catalog_code
          : null,
      );
    case PlatformAuditAction.SAAS_INVOICE_ISSUED:
      return copy.saasInvoiceIssued(
        metadataString(metadata, "period_key"),
        formatTotalCents(metadata),
      );
    case PlatformAuditAction.SAAS_INVOICE_PAID:
      return copy.saasInvoicePaid(
        formatTotalCents(metadata),
        metadataString(metadata, "method"),
      );
    case PlatformAuditAction.SAAS_INVOICE_VOIDED:
      return copy.saasInvoiceVoided(metadataString(metadata, "void_reason"));
    case PlatformAuditAction.SUBSCRIPTION_PAST_DUE_AUTO:
      return copy.subscriptionPastDueAuto(
        metadataNumber(metadata, "overdue_open_count"),
      );
    case PlatformAuditAction.SUBSCRIPTION_ACTIVE_RESTORED_AUTO:
      return platformCopy.audit.noDetail;
    case "saas_stripe_charge_failed": {
      const amountLabel = formatAmountCents(metadata);
      const failureCode = metadataString(metadata, "failure_code");
      if (!amountLabel && !failureCode) return platformCopy.audit.noDetail;
      return copy.stripeChargeFailed(amountLabel, failureCode);
    }
    case "saas_stripe_charge_requires_action": {
      const amountLabel = formatAmountCents(metadata);
      return amountLabel
        ? copy.stripeChargeRequiresAction(amountLabel)
        : platformCopy.audit.noDetail;
    }
    case PlatformAuditAction.TENANT_VIEWED:
    case PlatformAuditAction.TENANT_HEALTH_VIEWED:
    case PlatformAuditAction.TENANT_USAGE_VIEWED:
    case PlatformAuditAction.TENANT_SUBSCRIPTION_VIEWED:
    case PlatformAuditAction.TENANT_Q_FACT_VIEWED:
    case PlatformAuditAction.TENANT_ENTITLEMENTS_VIEWED:
    case PlatformAuditAction.TENANT_STAMP_PACKS_VIEWED:
    case PlatformAuditAction.TENANT_SAAS_INVOICES_VIEWED:
    case PlatformAuditAction.TENANT_SAAS_INVOICE_VIEWED:
    case PlatformAuditAction.TENANT_PAYMENT_METHODS_VIEWED:
    case PlatformAuditAction.TENANTS_LISTED:
    case PlatformAuditAction.PLATFORM_METRICS_VIEWED:
    case PlatformAuditAction.PLATFORM_PULSE_VIEWED:
    case PlatformAuditAction.PLATFORM_AR_LISTED:
    case PlatformAuditAction.PLATFORM_AR_CLOSE_RUN_VIEWED:
    case PlatformAuditAction.PLATFORM_AR_CHARGE_RUN_VIEWED:
    case PlatformAuditAction.PLATFORM_BILLING_RECONCILIATION_VIEWED:
    case "tenant_approval_policies_viewed":
      return platformCopy.audit.noDetail;
    case "tenant_demo_seed_applied":
      return typeof metadata.include_draft_trip === "boolean"
        ? copy.demoSeedApplied(metadata.include_draft_trip)
        : platformCopy.audit.noDetail;
    default:
      return platformCopy.audit.noDetail;
  }
}

const DESTRUCTIVE_AUDIT_ACTIONS = new Set<string>([
  PlatformAuditAction.SAAS_INVOICE_VOIDED,
  PlatformAuditAction.MODULE_REVOKED,
]);

/** Danger solo en verbo destructivo: anular, revocar, o dejar el acceso suspendido/cancelado. */
export function isDestructiveAuditAction(
  item: Pick<PlatformAuditLogItem, "action" | "metadata">,
): boolean {
  if (DESTRUCTIVE_AUDIT_ACTIONS.has(item.action)) return true;
  if (item.action !== PlatformAuditAction.TENANT_STATUS_CHANGED) return false;
  const status = item.metadata.status;
  return status === "suspended" || status === "cancelled" || status === "canceled";
}

export { getActionLabel as getAuditActionLabel };
