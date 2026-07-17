import { CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
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
  getPlatformSubscriptionStatusLabel,
} from "../utils/platformBillingFormatters";

interface TenantSubscriptionCardProps {
  tenantId: string;
}

export function TenantSubscriptionCard({ tenantId }: TenantSubscriptionCardProps) {
  const copy = platformCopy.tenants.detail.subscription;
  const { data: subscription, isLoading, isError } =
    usePlatformTenantSubscription(tenantId);
  const { data: usage } = usePlatformTenantStampUsage(tenantId);

  const isTrialing = subscription?.status === "trialing";
  const trialDateExpired =
    isTrialing &&
    !!subscription?.trialEndsAt &&
    new Date(subscription.trialEndsAt).getTime() <= Date.now();
  const trialStampsExhausted =
    isTrialing &&
    !!usage &&
    usage.stampsUsed >= usage.includedStamps;

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
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {platformCopy.tenants.detail.subscription.levelBadge(
                  subscription.profitabilityLevel,
                )}
              </Badge>
            </div>
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
              label={copy.fields.profitabilityLevel}
              value={subscription.profitabilityLevel}
            />
            <p className="text-xs text-muted-foreground">{copy.profitabilityHint}</p>
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
            {subscription.status === "trialing" ? (
              <AlertWithIcon
                variant="info"
                title={copy.statusLabels.trialing}
              >
                {copy.trialQuotaHint}
              </AlertWithIcon>
            ) : null}
            {trialDateExpired ? (
              <AlertWithIcon
                variant="destructive"
                title={copy.trialExpiredTitle}
              >
                {copy.trialExpiredDescription}
              </AlertWithIcon>
            ) : null}
            {trialStampsExhausted && !trialDateExpired ? (
              <AlertWithIcon
                variant="destructive"
                title={copy.trialExhaustedTitle}
              >
                {copy.trialExhaustedDescription}
              </AlertWithIcon>
            ) : null}
            {subscription.notes ? (
              <InfoRow
                variant="inline"
                label={copy.fields.notes}
                value={subscription.notes}
              />
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
