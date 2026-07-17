import { Stamp, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Progress } from "@shared/ui/progress";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { AlertWithIcon } from "@shared/ui/alert";
import { InfoRow } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { useToast } from "@shared/hooks";
import { usePlatformTenantStampUsage } from "../../application/hooks/usePlatformBilling";
import { platformApi } from "../../infrastructure/platformApi";
import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
  getPlatformQuotaPolicyDescription,
  getPlatformQuotaPolicyLabel,
  getStampUsageTone,
} from "../utils/platformBillingFormatters";
import {
  computeStampUsagePercent,
  resolveStampUsageAlertLevel,
} from "@features/billing/presentation/utils/stampUsageThresholds";

interface TenantStampUsageCardProps {
  tenantId: string;
  canExport?: boolean;
}

export function TenantStampUsageCard({
  tenantId,
  canExport = false,
}: TenantStampUsageCardProps) {
  const copy = platformCopy.tenants.detail.stampUsage;
  const { toast } = useToast();
  const { data: usage, isLoading, isError } = usePlatformTenantStampUsage(tenantId);

  const usagePercent = usage
    ? computeStampUsagePercent(usage.stampsUsed, usage.includedStamps)
    : 0;

  const stampsRemaining = usage
    ? Math.max(0, usage.includedStamps - usage.stampsUsed)
    : 0;

  const stampTone = getStampUsageTone(usagePercent);
  const usageAlertLevel = resolveStampUsageAlertLevel(usagePercent);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Stamp className="h-4 w-4" />
            {platformCopy.tenants.detail.sections.stampUsage}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </div>
        {canExport && usage ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={async () => {
              try {
                await platformApi.downloadTenantReconciliationCsv(
                  tenantId,
                  usage.periodKey,
                );
                toast({
                  title: copy.exportSuccess,
                  variant: "success",
                });
              } catch (error) {
                toast({
                  title: copy.exportError,
                  description:
                    error instanceof Error ? error.message : undefined,
                  variant: "destructive",
                });
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            {copy.exportCsv}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : isError || !usage ? (
          <EmptyState
            icon={<Stamp className="h-10 w-10" />}
            title={copy.unavailable}
            size="sm"
          />
        ) : (
          <>
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {copy.summary(usage.stampsUsed, usage.includedStamps)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {copy.remaining(stampsRemaining)}
                  </p>
                  {usage.prepaidRemaining > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {copy.prepaidRemaining(usage.prepaidRemaining)}
                    </p>
                  ) : null}
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
                  {copy.usedPercent(usagePercent)}
                </Badge>
              </div>
              <Progress value={usagePercent} />
            </div>

            {usageAlertLevel === "watch" ? (
              <AlertWithIcon
                variant="info"
                title={copy.usageAlerts.watch.title}
              >
                {copy.usageAlerts.watch.description(stampsRemaining)}
              </AlertWithIcon>
            ) : null}
            {usageAlertLevel === "warning" ? (
              <AlertWithIcon
                variant="warning"
                title={copy.usageAlerts.warning.title}
              >
                {copy.usageAlerts.warning.description(stampsRemaining)}
              </AlertWithIcon>
            ) : null}
            {usageAlertLevel === "exhausted" ? (
              <AlertWithIcon
                variant="destructive"
                title={copy.usageAlerts.exhausted.title}
              >
                {copy.usageAlerts.exhausted.description}
              </AlertWithIcon>
            ) : null}

            <InfoRow
              variant="inline"
              label={copy.period}
              value={formatBillingPeriodKey(usage.periodKey)}
            />
            <InfoRow
              variant="inline"
              label={copy.quotaPolicy}
              value={getPlatformQuotaPolicyLabel(usage.quotaPolicy)}
            />
            {getPlatformQuotaPolicyDescription(usage.quotaPolicy) ? (
              <p className="text-xs text-muted-foreground">
                {getPlatformQuotaPolicyDescription(usage.quotaPolicy)}
              </p>
            ) : null}

            {usage.overageStamps > 0 ? (
              <AlertWithIcon variant="warning" title={copy.overageTitle}>
                {copy.overage(
                  usage.overageStamps,
                  formatBillingPriceCents(usage.overageTotalCents),
                )}
              </AlertWithIcon>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
