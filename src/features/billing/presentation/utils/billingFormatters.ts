import { formatDateTime } from "@shared/utils/dateUtils";
import { billingCopy } from "../copy/billingCopy";
import {
  resolveStampUsageAlertLevel,
  STAMP_USAGE_EXHAUSTED_PERCENT,
  STAMP_USAGE_WARNING_PERCENT,
} from "./stampUsageThresholds";

export function formatBillingPriceCents(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatBillingPeriodKey(periodKey: string): string {
  const [year, month] = periodKey.split("-");
  if (!year || !month) return periodKey;

  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("es-MX", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatHistoryMonths(months: number | null | undefined): string {
  if (months == null) return billingCopy.plan.unlimited;
  return billingCopy.plan.historyMonths(months);
}

export function formatLimitValue(value: number | null | undefined): string {
  if (value == null) return billingCopy.plan.unlimited;
  return String(value);
}

export function getSubscriptionStatusLabel(status: string): string {
  return billingCopy.plan.statusLabels[status] ?? status;
}

export function getBillingCycleLabel(cycle: string): string {
  return billingCopy.plan.cycleLabels[cycle] ?? cycle;
}

export function getQuotaPolicyLabel(policy: string): string {
  return billingCopy.stamps.quotaPolicyLabels[policy] ?? policy;
}

export function getQuotaPolicyDescription(policy: string): string {
  return billingCopy.stamps.quotaPolicyDescriptions[policy] ?? "";
}

export function getModuleKindLabel(kind: string): string {
  return billingCopy.modules.kindLabels[kind] ?? kind;
}

export function formatModuleActivatedAt(iso: string): string {
  return billingCopy.modules.activatedAt(formatDateTime(iso));
}

/** Tone de badge/progress alineado a SoT §4.7 (80 warning / 100 destructive). */
export function getStampUsageTone(
  usagePercent: number,
): "primary" | "warning" | "destructive" {
  const level = resolveStampUsageAlertLevel(usagePercent);
  if (level === "exhausted" || usagePercent >= STAMP_USAGE_EXHAUSTED_PERCENT) {
    return "destructive";
  }
  if (level === "warning" || usagePercent >= STAMP_USAGE_WARNING_PERCENT) {
    return "warning";
  }
  return "primary";
}
