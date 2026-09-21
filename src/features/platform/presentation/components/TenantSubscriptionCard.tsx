import { CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { AlertWithIcon } from "@shared/ui/alert";
import { InfoRow } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  usePlatformTenantStampUsage,
  usePlatformTenantSubscription,
} from "../../application/hooks/usePlatformBilling";
import { platformCopy } from "../copy/platformCopy";
import {
  formatPlatformHistoryMonthsConsultable,
  formatPlatformUsageGranted,
  getPlatformBillingCycleLabel,
  getPlatformQuotaPolicyDescription,
  getPlatformQuotaPolicyLabel,
  getPlatformSubscriptionStatusLabel,
  getProfitabilityLevelDetail,
} from "../utils/platformBillingFormatters";
import { resolvePlatformPlanPriceDisplay } from "../utils/resolvePlatformPlanPriceDisplay";

interface TenantSubscriptionCardProps {
  tenantId: string;
}

function planPriceRowLabel(
  kind: ReturnType<typeof resolvePlatformPlanPriceDisplay>["kind"],
): string {
  const copy = platformCopy.tenants.detail.planPrice;
  switch (kind) {
    case "motriz_cargo":
      return copy.labelCargo;
    case "motriz_pending_q":
      return copy.labelUnit;
    case "motriz_quote":
      return copy.labelQuote;
    default:
      return copy.labelLegacy;
  }
}

/** Detalle avanzado del plan (límites, margen, política de excedente, notas). */
export function TenantSubscriptionCard({ tenantId }: TenantSubscriptionCardProps) {
  const copy = platformCopy.tenants.detail.subscription;
  const stampCopy = platformCopy.tenants.detail.stampUsage;
  const { data: subscription, isLoading, isError } =
    usePlatformTenantSubscription(tenantId);
  const { data: usage } = usePlatformTenantStampUsage(tenantId);
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
  const usersOverLimit = capacity?.users.status === "over_limit";
  const branchesOverLimit = capacity?.branches.status === "over_limit";
  const pendingBand =
    capacity?.pendingBandCode ??
    subscription?.pendingCapacityBandCode ??
    null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          {platformCopy.tenants.detail.sections.subscription}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : isError || !subscription || !planPrice ? (
          <EmptyState
            icon={<CreditCard className="h-10 w-10" />}
            title={copy.unavailable}
            size="sm"
          />
        ) : (
          <>
            <InfoRow
              variant="inline"
              label={copy.fields.plan}
              value={subscription.planName}
            />
            <InfoRow
              variant="inline"
              label={copy.fields.status}
              value={getPlatformSubscriptionStatusLabel(subscription.status)}
            />
            <InfoRow
              variant="inline"
              label={copy.fields.cycle}
              value={getPlatformBillingCycleLabel(subscription.billingCycle)}
            />
            <InfoRow
              variant="inline"
              label={planPriceRowLabel(planPrice.kind)}
              value={planPrice.primary}
            />
            {planPrice.secondary ? (
              <p className="text-xs text-muted-foreground tabular-nums">
                {planPrice.secondary}
              </p>
            ) : null}
            <InfoRow
              variant="inline"
              label={copy.fields.period}
              value={`${formatDateTime(subscription.currentPeriodStart)} — ${formatDateTime(subscription.currentPeriodEnd)}`}
            />
            {pendingBand ? (
              <p className="text-xs text-muted-foreground">
                {copy.pendingBandHint}
              </p>
            ) : null}
            <InfoRow
              variant="inline"
              label={copy.fields.users}
              value={formatPlatformUsageGranted(
                capacity?.users.usage,
                usersGranted,
              )}
              alert={usersOverLimit ? "warning" : undefined}
            />
            {usersOverLimit ? (
              <p className="text-xs text-muted-foreground">{copy.overLimitHint}</p>
            ) : null}
            <InfoRow
              variant="inline"
              label={copy.fields.branches}
              value={formatPlatformUsageGranted(
                capacity?.branches.usage,
                branchesGranted,
              )}
              alert={branchesOverLimit ? "warning" : undefined}
            />
            {branchesOverLimit ? (
              <p className="text-xs text-muted-foreground">{copy.overLimitHint}</p>
            ) : null}
            <InfoRow
              variant="inline"
              label={copy.fields.historyConsultable}
              value={formatPlatformHistoryMonthsConsultable(historyGranted)}
            />
            {subscription.trialEndsAt ? (
              <InfoRow
                variant="inline"
                label={copy.fields.trial}
                value={formatDateTime(subscription.trialEndsAt)}
              />
            ) : null}
            {usage ? (
              <>
                <InfoRow
                  variant="inline"
                  label={stampCopy.quotaPolicy}
                  value={getPlatformQuotaPolicyLabel(usage.quotaPolicy)}
                />
                {getPlatformQuotaPolicyDescription(usage.quotaPolicy) ? (
                  <p className="text-xs text-muted-foreground">
                    {getPlatformQuotaPolicyDescription(usage.quotaPolicy)}
                  </p>
                ) : null}
              </>
            ) : null}
            <InfoRow
              variant="inline"
              label={copy.fields.profitabilityLevel}
              value={
                getProfitabilityLevelDetail(subscription.profitabilityLevel)
                  .label
              }
            />
            <p className="text-xs text-muted-foreground">
              {getProfitabilityLevelDetail(subscription.profitabilityLevel)
                .includes}
            </p>
            {subscription.notes ? (
              <InfoRow
                variant="inline"
                label={copy.fields.notes}
                value={subscription.notes}
              />
            ) : null}
            {subscription.status === "past_due" ? (
              <AlertWithIcon
                variant="warning"
                title={platformCopy.tenants.detail.governance.grace.title}
              >
                {platformCopy.tenants.detail.governance.grace.itemNotes}
              </AlertWithIcon>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
