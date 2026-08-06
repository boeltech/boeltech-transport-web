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
  formatBillingPriceCents,
  formatPlatformHistoryMonths,
  formatPlatformLimitValue,
  getPlatformBillingCycleLabel,
  getPlatformQuotaPolicyDescription,
  getPlatformQuotaPolicyLabel,
  getPlatformSubscriptionStatusLabel,
  getProfitabilityLevelDetail,
} from "../utils/platformBillingFormatters";

interface TenantSubscriptionCardProps {
  tenantId: string;
}

/** Detalle avanzado del plan (límites, margen, política de excedente, notas). */
export function TenantSubscriptionCard({ tenantId }: TenantSubscriptionCardProps) {
  const copy = platformCopy.tenants.detail.subscription;
  const stampCopy = platformCopy.tenants.detail.stampUsage;
  const { data: subscription, isLoading, isError } =
    usePlatformTenantSubscription(tenantId);
  const { data: usage } = usePlatformTenantStampUsage(tenantId);

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
        ) : isError || !subscription ? (
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
              label={copy.fields.price}
              value={formatBillingPriceCents(subscription.monthlyPriceCents)}
            />
            <InfoRow
              variant="inline"
              label={copy.fields.period}
              value={`${formatDateTime(subscription.currentPeriodStart)} — ${formatDateTime(subscription.currentPeriodEnd)}`}
            />
            <InfoRow
              variant="inline"
              label={copy.fields.users}
              value={formatPlatformLimitValue(subscription.limits.maxUsers)}
            />
            <InfoRow
              variant="inline"
              label={copy.fields.branches}
              value={formatPlatformLimitValue(subscription.limits.maxBranches)}
            />
            <InfoRow
              variant="inline"
              label={copy.fields.historyRetention}
              value={formatPlatformHistoryMonths(subscription.limits.historyMonths)}
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
