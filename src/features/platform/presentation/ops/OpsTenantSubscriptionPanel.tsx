import { formatDateTime } from "@shared/utils/dateUtils";
import { usePlatformTenantSubscription } from "../../application/hooks/usePlatformBilling";
import { platformCopy } from "../copy/platformCopy";
import {
  formatPlatformHistoryMonthsConsultable,
  formatPlatformUsageGranted,
  getPlatformBillingCycleLabel,
  getPlatformSubscriptionStatusLabel,
  getProfitabilityLevelDetail,
} from "../utils/platformBillingFormatters";
import { resolvePlatformPlanPriceDisplay } from "../utils/resolvePlatformPlanPriceDisplay";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsQuotaLine } from "./patterns/OpsQuotaLine";
import { subscriptionStatusTone } from "./opsStatusTones";
import { OpsBadge } from "./ui/OpsBadge";
import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "./ui/OpsPanel";

interface OpsTenantSubscriptionPanelProps {
  tenantId: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 ops-type-caption">
      <span className="ops-text-muted">{label}</span>
      <span className="ops-text tabular-nums">{value}</span>
    </div>
  );
}

export function OpsTenantSubscriptionPanel({
  tenantId,
}: OpsTenantSubscriptionPanelProps) {
  const copy = platformCopy.tenants.detail.subscription;
  const { data: subscription, isLoading, isError } =
    usePlatformTenantSubscription(tenantId);
  const planPrice = subscription
    ? resolvePlatformPlanPriceDisplay(subscription)
    : null;

  const capacity = subscription?.capacity;
  const usersGranted =
    capacity?.users.granted ?? subscription?.limits.maxUsers ?? null;
  const branchesGranted =
    capacity?.branches.granted ?? subscription?.limits.maxBranches ?? null;
  const historyGranted =
    capacity?.historyMonths.granted ??
    subscription?.limits.historyMonths ??
    null;

  return (
    <OpsPanel data-testid="ops-tenant-subscription">
      <OpsPanelHeader>
        <OpsPanelTitle>
          {platformCopy.tenants.detail.sections.subscription}
        </OpsPanelTitle>
        <OpsPanelDescription>{copy.description}</OpsPanelDescription>
      </OpsPanelHeader>
      <OpsPanelBody className="space-y-2">
        {isLoading ? (
          <OpsEmptyState variant="loading" title={copy.loading} />
        ) : isError || !subscription || !planPrice ? (
          <OpsEmptyState title={copy.unavailable} panel={false} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="ops-type-body font-medium ops-text">
                {subscription.planName}
              </span>
              <OpsBadge tone={subscriptionStatusTone(subscription.status)}>
                {getPlatformSubscriptionStatusLabel(subscription.status)}
              </OpsBadge>
            </div>
            <Row
              label={copy.fields.cycle}
              value={getPlatformBillingCycleLabel(subscription.billingCycle)}
            />
            <Row label={planPrice.kind === "motriz_cargo"
              ? platformCopy.tenants.detail.planPrice.labelCargo
              : planPrice.kind === "motriz_pending_q"
                ? platformCopy.tenants.detail.planPrice.labelUnit
                : planPrice.kind === "motriz_quote"
                  ? platformCopy.tenants.detail.planPrice.labelQuote
                  : platformCopy.tenants.detail.planPrice.labelLegacy} value={planPrice.primary} />
            {planPrice.secondary ? (
              <p className="ops-type-caption ops-text-muted tabular-nums">
                {planPrice.secondary}
              </p>
            ) : null}
            <Row
              label={copy.fields.period}
              value={`${formatDateTime(subscription.currentPeriodStart)} — ${formatDateTime(subscription.currentPeriodEnd)}`}
            />
            <Row
              label={copy.fields.users}
              value={formatPlatformUsageGranted(
                capacity?.users.usage,
                usersGranted,
              )}
            />
            {capacity &&
            capacity.branches.usage != null &&
            capacity.branches.granted != null ? (
              <OpsQuotaLine
                kind="branches"
                label={copy.fields.branches}
                usage={capacity.branches.usage}
                granted={capacity.branches.granted}
                overQuota={capacity.branches.overQuota}
              />
            ) : (
              <Row
                label={copy.fields.branches}
                value={formatPlatformUsageGranted(
                  capacity?.branches.usage,
                  branchesGranted,
                )}
              />
            )}
            {capacity ? (
              <OpsQuotaLine
                kind="history"
                label={copy.fields.historyConsultable}
                granted={capacity.historyMonths.granted}
              />
            ) : (
              <Row
                label={copy.fields.historyConsultable}
                value={formatPlatformHistoryMonthsConsultable(historyGranted)}
              />
            )}
            {subscription.trialEndsAt ? (
              <Row
                label={copy.fields.trial}
                value={formatDateTime(subscription.trialEndsAt)}
              />
            ) : null}
            <Row
              label={copy.fields.profitabilityLevel}
              value={
                getProfitabilityLevelDetail(subscription.profitabilityLevel)
                  .label
              }
            />
            {subscription.notes ? (
              <Row label={copy.fields.notes} value={subscription.notes} />
            ) : null}
            <p className="ops-type-caption ops-text-muted">{copy.periodPulseHint}</p>
          </>
        )}
      </OpsPanelBody>
    </OpsPanel>
  );
}
