import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Progress } from "@shared/ui/progress";
import { AlertWithIcon } from "@shared/ui/alert";
import { InfoRow } from "@shared/ui/data-display";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";
import { useToast } from "@shared/hooks";
import {
  computeStampUsagePercent,
  resolveStampUsageAlertLevel,
} from "@features/billing/presentation/utils/stampUsageThresholds";
import { isTrialDateReached } from "@features/billing/presentation/utils/billingNotice";
import {
  usePlatformTenantEntitlements,
  usePlatformTenantStampUsage,
  usePlatformTenantSubscription,
} from "../../application/hooks/usePlatformBilling";
import { platformApi } from "../../infrastructure/platformApi";
import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
  getStampUsageTone,
} from "../utils/platformBillingFormatters";

interface TenantThisMonthCardProps {
  tenantId: string;
  planName?: string | null;
  canExport?: boolean;
  /** Abre desglose si suscripción en past_due (además de excedente). */
  forceBreakdownOpen?: boolean;
}

export function TenantThisMonthCard({
  tenantId,
  planName,
  canExport = false,
  forceBreakdownOpen = false,
}: TenantThisMonthCardProps) {
  const copy = platformCopy.tenants.detail;
  const commercialCopy = platformCopy.tenants.commercial;
  const stampCopy = copy.stampUsage;
  const { toast } = useToast();
  /** null = follow auto-open from overage / past_due; otherwise user toggle. */
  const [breakdownOverride, setBreakdownOverride] = useState<boolean | null>(
    null,
  );

  const subscription = usePlatformTenantSubscription(tenantId);
  const usageQuery = usePlatformTenantStampUsage(tenantId);
  const entitlements = usePlatformTenantEntitlements(tenantId);

  const sub = subscription.data;
  const usage = usageQuery.data;
  const ent = entitlements.data;

  const stampsUsed = usage?.stampsUsed ?? sub?.stampsUsedThisPeriod ?? 0;
  const includedStamps = usage?.includedStamps ?? sub?.includedStamps ?? 0;
  const usagePercent = computeStampUsagePercent(stampsUsed, includedStamps);
  const stampsRemaining = Math.max(0, includedStamps - stampsUsed);
  const stampTone = getStampUsageTone(usagePercent);
  const usageAlertLevel = resolveStampUsageAlertLevel(usagePercent);

  const displayPlan =
    sub?.planName ?? planName ?? copy.sections.planFallback;
  const periodLabel = usage
    ? formatBillingPeriodKey(usage.periodKey)
    : null;

  const isTrialing = sub?.status === "trialing";
  const trialDateExpired =
    isTrialing && isTrialDateReached(sub?.trialEndsAt);
  const trialStampsExhausted =
    isTrialing && includedStamps > 0 && stampsUsed >= includedStamps;

  const hasOverage =
    (usage?.overageStamps ?? 0) > 0 ||
    (ent?.commercialSummary.overageTotalCents ?? 0) > 0;

  const autoBreakdownOpen = forceBreakdownOpen || hasOverage;
  const breakdownOpen = breakdownOverride ?? autoBreakdownOpen;
  const setBreakdownOpen = (open: boolean) => setBreakdownOverride(open);

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{copy.sections.thisMonth}</CardTitle>
          <CardDescription>
            {displayPlan}
            {periodLabel ? ` · ${periodLabel}` : ""}
          </CardDescription>
        </div>
        {canExport && usage ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await platformApi.downloadTenantReconciliationCsv(
                    tenantId,
                    usage.periodKey,
                  );
                  toast({
                    title: stampCopy.exportSuccess,
                    variant: "success",
                  });
                } catch (error) {
                  toast({
                    title: stampCopy.exportError,
                    description:
                      error instanceof Error ? error.message : undefined,
                    variant: "destructive",
                  });
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              {stampCopy.exportCsv}
            </Button>
            <p className="max-w-[14rem] text-right text-xs text-muted-foreground">
              {stampCopy.exportEstimateHint}
            </p>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {subscription.isLoading && !sub ? (
          <p className="text-sm text-muted-foreground">
            {copy.subscription.loading}
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {copy.metrics.monthlyPrice}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                  {sub
                    ? formatBillingPriceCents(sub.monthlyPriceCents)
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {copy.metrics.estimatedTotal}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                  {ent
                    ? formatBillingPriceCents(
                        ent.commercialSummary.estimatedTotalCents,
                      )
                    : entitlements.isLoading
                      ? "…"
                      : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {copy.metrics.estimatedTotalHint}
                </p>
              </div>
            </div>

            {usage || sub ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {stampCopy.summary(stampsUsed, includedStamps)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stampCopy.remaining(stampsRemaining)}
                      {(usage?.prepaidRemaining ?? 0) > 0
                        ? ` · ${stampCopy.prepaidRemaining(usage!.prepaidRemaining)}`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      stampTone === "destructive"
                        ? "destructive"
                        : stampTone === "warning"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {stampCopy.usedPercent(usagePercent)}
                  </Badge>
                </div>
                <Progress value={usagePercent} />
              </div>
            ) : null}

            {usageAlertLevel === "watch" ? (
              <AlertWithIcon
                variant="info"
                title={stampCopy.usageAlerts.watch.title}
              >
                {stampCopy.usageAlerts.watch.description(stampsRemaining)}
              </AlertWithIcon>
            ) : null}
            {usageAlertLevel === "warning" ? (
              <AlertWithIcon
                variant="warning"
                title={stampCopy.usageAlerts.warning.title}
              >
                {stampCopy.usageAlerts.warning.description(stampsRemaining)}
              </AlertWithIcon>
            ) : null}
            {usageAlertLevel === "exhausted" ? (
              <AlertWithIcon
                variant="destructive"
                title={stampCopy.usageAlerts.exhausted.title}
              >
                {stampCopy.usageAlerts.exhausted.description}
              </AlertWithIcon>
            ) : null}

            {isTrialing ? (
              <AlertWithIcon
                variant="info"
                title={copy.subscription.statusLabels.trialing}
              >
                {copy.subscription.trialQuotaHint}
              </AlertWithIcon>
            ) : null}
            {trialDateExpired ? (
              <AlertWithIcon
                variant="destructive"
                title={copy.subscription.trialExpiredTitle}
              >
                {copy.subscription.trialExpiredDescription}
              </AlertWithIcon>
            ) : null}
            {trialStampsExhausted && !trialDateExpired ? (
              <AlertWithIcon
                variant="destructive"
                title={copy.subscription.trialExhaustedTitle}
              >
                {copy.subscription.trialExhaustedDescription}
              </AlertWithIcon>
            ) : null}

            {usage && usage.overageStamps > 0 ? (
              <AlertWithIcon variant="warning" title={stampCopy.overageTitle}>
                {stampCopy.overage(
                  usage.overageStamps,
                  formatBillingPriceCents(usage.overageTotalCents),
                )}
              </AlertWithIcon>
            ) : null}

            {ent || entitlements.isLoading ? (
              <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-0 hover:bg-transparent"
                  >
                    {breakdownOpen
                      ? copy.sections.breakdownHide
                      : copy.sections.breakdownShow}
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "ml-1.5 h-4 w-4 transition-transform",
                        breakdownOpen && "rotate-180",
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-3">
                  {entitlements.isLoading && !ent ? (
                    <p className="text-sm text-muted-foreground">
                      {commercialCopy.loading}
                    </p>
                  ) : ent ? (
                    <>
                      {ent.directEntitlements.length > 0 ? (
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {ent.directEntitlements.map((item) => (
                            <li
                              key={item.moduleCode}
                              className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                            >
                              <span className="min-w-0 truncate font-medium">
                                {item.moduleName}
                              </span>
                              <span className="shrink-0 tabular-nums text-muted-foreground">
                                {formatBillingPriceCents(item.priceLockedCents)}
                                {commercialCopy.perMonth}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {commercialCopy.noModules.description}
                        </p>
                      )}

                      <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm font-medium">
                          {commercialCopy.totalsSection}
                        </p>
                        <InfoRow
                          variant="inline"
                          label={commercialCopy.totals.plan}
                          value={formatBillingPriceCents(
                            ent.commercialSummary.planMonthlyPriceCents,
                          )}
                        />
                        <InfoRow
                          variant="inline"
                          label={commercialCopy.totals.modules}
                          value={formatBillingPriceCents(
                            ent.commercialSummary.modulesTotalCents,
                          )}
                        />
                        {ent.commercialSummary.overageTotalCents > 0 ? (
                          <InfoRow
                            variant="inline"
                            label={commercialCopy.totals.overage}
                            value={formatBillingPriceCents(
                              ent.commercialSummary.overageTotalCents,
                            )}
                          />
                        ) : null}
                        <InfoRow
                          variant="inline"
                          label={commercialCopy.totals.subtotal}
                          value={formatBillingPriceCents(
                            ent.commercialSummary.subtotalCents,
                          )}
                        />
                        <InfoRow
                          variant="inline"
                          label={commercialCopy.totals.iva}
                          value={formatBillingPriceCents(
                            ent.commercialSummary.ivaCents,
                          )}
                        />
                        <div className="border-t pt-2">
                          <InfoRow
                            variant="inline"
                            label={commercialCopy.totals.estimatedTotal}
                            value={formatBillingPriceCents(
                              ent.commercialSummary.estimatedTotalCents,
                            )}
                          />
                        </div>
                      </div>
                    </>
                  ) : null}
                </CollapsibleContent>
              </Collapsible>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
