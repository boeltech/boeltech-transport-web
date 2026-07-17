import { CircleDollarSign, Package, Stamp } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent } from "@shared/ui/card";
import { StatCard } from "@shared/ui/data-display/StatCard";
import {
  usePlatformTenantEntitlements,
  usePlatformTenantStampUsage,
  usePlatformTenantSubscription,
} from "../../application/hooks/usePlatformBilling";
import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
  getPlatformSubscriptionStatusLabel,
  getStampUsageTone,
} from "../utils/platformBillingFormatters";
import { computeStampUsagePercent } from "@features/billing/presentation/utils/stampUsageThresholds";

interface TenantCommercialOverviewProps {
  tenantId: string;
  tenantName: string;
  planName?: string | null;
}

export function TenantCommercialOverview({
  tenantId,
  tenantName,
  planName,
}: TenantCommercialOverviewProps) {
  const copy = platformCopy.tenants.detail;
  const subscription = usePlatformTenantSubscription(tenantId);
  const usage = usePlatformTenantStampUsage(tenantId);
  const entitlements = usePlatformTenantEntitlements(tenantId);

  const sub = subscription.data;
  const use = usage.data;
  const ent = entitlements.data;

  const usagePercent = use
    ? computeStampUsagePercent(use.stampsUsed, use.includedStamps)
    : 0;

  const displayPlan =
    sub?.planName ?? planName ?? copy.hero.planFallback;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{copy.hero.badge}</Badge>
            {sub ? (
              <Badge variant="outline">
                {getPlatformSubscriptionStatusLabel(sub.status)}
              </Badge>
            ) : null}
            {sub ? (
              <Badge variant="outline">
                {copy.subscription.levelBadge(sub.profitabilityLevel)}
              </Badge>
            ) : null}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {tenantName} · {subscription.isLoading ? "…" : displayPlan}
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {copy.hero.description}
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {copy.hero.steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-lg border bg-background/80 p-3"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {copy.hero.stepPrefix(index + 1)}
                </p>
                <p className="mt-1 text-sm font-medium">{step.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {sub && !subscription.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={copy.metrics.monthlyPrice}
            value={formatBillingPriceCents(sub.monthlyPriceCents)}
            description={copy.metrics.monthlyPriceHint}
            icon={<CircleDollarSign className="h-5 w-5" />}
          />
          <StatCard
            title={copy.metrics.stampsUsed}
            value={
              use
                ? copy.stampUsage.summary(use.stampsUsed, use.includedStamps)
                : copy.stampUsage.summary(
                    sub.stampsUsedThisPeriod,
                    sub.includedStamps,
                  )
            }
            description={
              use
                ? copy.metrics.stampsHint(
                    formatBillingPeriodKey(use.periodKey),
                  )
                : copy.metrics.monthlyPriceHint
            }
            icon={<Stamp className="h-5 w-5" />}
            tone={getStampUsageTone(usagePercent)}
          />
          <StatCard
            title={copy.metrics.estimatedTotal}
            value={
              ent
                ? formatBillingPriceCents(
                    ent.commercialSummary.estimatedTotalCents,
                  )
                : "—"
            }
            description={copy.metrics.estimatedTotalHint}
            icon={<CircleDollarSign className="h-5 w-5" />}
            isLoading={entitlements.isLoading}
          />
          <StatCard
            title={copy.metrics.activeModules}
            value={ent?.directEntitlements.length ?? 0}
            description={copy.metrics.activeModulesHint}
            icon={<Package className="h-5 w-5" />}
            isLoading={entitlements.isLoading}
          />
        </div>
      ) : null}
    </div>
  );
}
