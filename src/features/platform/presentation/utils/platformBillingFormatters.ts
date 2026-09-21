import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
  getProfitabilityLevelDetail,
  getProfitabilityLevelLabel,
  getStampUsageTone,
  getSubscriptionStatusLabel,
} from "@features/billing/presentation/utils/billingFormatters";

export {
  formatBillingPeriodKey,
  formatBillingPriceCents,
  getProfitabilityLevelDetail,
  getProfitabilityLevelLabel,
  getStampUsageTone,
  getSubscriptionStatusLabel,
};

export function formatPlatformHistoryMonths(
  months: number | null | undefined,
): string {
  if (months == null) return platformCopy.tenants.detail.subscription.unlimited;
  return platformCopy.tenants.detail.subscription.historyMonths(months);
}

/** SoT ADR-0095: historial = consultable en listados. */
export function formatPlatformHistoryMonthsConsultable(
  months: number | null | undefined,
): string {
  if (months == null) return platformCopy.tenants.detail.subscription.unlimited;
  return platformCopy.tenants.detail.subscription.historyMonthsConsultable(
    months,
  );
}

export function formatPlatformLimitValue(
  value: number | null | undefined,
): string {
  if (value == null) return platformCopy.tenants.detail.subscription.unlimited;
  return String(value);
}

/** usage/granted; si usage es null (legacy) solo muestra granted. */
export function formatPlatformUsageGranted(
  usage: number | null | undefined,
  granted: number | null | undefined,
): string {
  const grantedLabel = formatPlatformLimitValue(granted);
  if (usage == null) return grantedLabel;
  return platformCopy.tenants.detail.subscription.usageGranted(
    usage,
    grantedLabel,
  );
}

export function getPlatformQuotaPolicyLabel(policy: string): string {
  return (
    platformCopy.tenants.detail.stampUsage.quotaPolicyLabels[policy] ?? policy
  );
}

export function getPlatformQuotaPolicyDescription(policy: string): string {
  return (
    platformCopy.tenants.detail.stampUsage.quotaPolicyDescriptions[policy] ?? ""
  );
}

export function getPlatformBillingCycleLabel(cycle: string): string {
  return (
    platformCopy.tenants.detail.subscription.cycleLabels[
      cycle as keyof typeof platformCopy.tenants.detail.subscription.cycleLabels
    ] ?? cycle
  );
}

export function getPlatformSubscriptionStatusLabel(status: string): string {
  return (
    platformCopy.tenants.detail.subscription.statusLabels[
      status as keyof typeof platformCopy.tenants.detail.subscription.statusLabels
    ] ?? getSubscriptionStatusLabel(status)
  );
}
