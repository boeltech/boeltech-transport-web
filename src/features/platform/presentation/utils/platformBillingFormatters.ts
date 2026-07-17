import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
  getStampUsageTone,
  getSubscriptionStatusLabel,
} from "@features/billing/presentation/utils/billingFormatters";

export {
  formatBillingPeriodKey,
  formatBillingPriceCents,
  getStampUsageTone,
  getSubscriptionStatusLabel,
};

export function formatPlatformHistoryMonths(
  months: number | null | undefined,
): string {
  if (months == null) return platformCopy.tenants.detail.subscription.unlimited;
  return platformCopy.tenants.detail.subscription.historyMonths(months);
}

export function formatPlatformLimitValue(
  value: number | null | undefined,
): string {
  if (value == null) return platformCopy.tenants.detail.subscription.unlimited;
  return String(value);
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
