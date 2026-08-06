import {
  PLATFORM_TENANT_STATUS_LABELS,
  PlatformAuditAction,
  type PlatformAuditLogItem,
  type PlatformBillingPlan,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";
import { resolvePlanDisplayName } from "./formatPlanLabel";
import { getPlatformSubscriptionStatusLabel } from "./platformBillingFormatters";

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

export function getAuditOperatorLabel(item: PlatformAuditLogItem): string {
  if (item.platformUserEmail) return item.platformUserEmail;
  if (item.action === PlatformAuditAction.TENANT_SELF_SERVE_REGISTERED) {
    return platformCopy.audit.selfServeOperator;
  }
  return platformCopy.audit.systemOperator;
}

export function getAuditTenantLabel(
  item: PlatformAuditLogItem,
  filteredTenantName?: string | null,
): string {
  if (filteredTenantName) return filteredTenantName;

  const name = metadataString(
    item.metadata,
    "tenant_name",
    "company_name",
    "name",
  );
  if (name) return name;

  const subdomain = metadataString(item.metadata, "subdomain");
  if (subdomain) return subdomain;

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
    default:
      return platformCopy.audit.noDetail;
  }
}

export { getActionLabel as getAuditActionLabel };
