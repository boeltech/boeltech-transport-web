import { useToast } from "@shared/hooks";
import { computeBolsaStamps } from "@features/billing";
import {
  computeStampUsagePercent,
  resolveStampUsageAlertLevel,
} from "@features/billing/presentation/utils/stampUsageThresholds";
import { isTrialDateReached } from "@features/billing/presentation/utils/billingNotice";
import {
  usePlatformTenantStampUsage,
  usePlatformTenantSubscription,
} from "../../application/hooks/usePlatformBilling";
import { platformApi } from "../../infrastructure/platformApi";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPeriodKey } from "../utils/platformBillingFormatters";
import { opsCopy } from "./opsCopy";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsQuotaLine } from "./patterns/OpsQuotaLine";
import { OpsAlert } from "./ui/OpsAlert";
import { OpsButton } from "./ui/OpsButton";
import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "./ui/OpsPanel";

interface OpsTenantUsagePanelProps {
  tenantId: string;
  planName?: string | null;
  canExport?: boolean;
}

export function OpsTenantUsagePanel({
  tenantId,
  planName,
  canExport = false,
}: OpsTenantUsagePanelProps) {
  const copy = platformCopy.tenants.detail;
  const stampCopy = copy.stampUsage;
  const { toast } = useToast();

  const subscription = usePlatformTenantSubscription(tenantId);
  const usageQuery = usePlatformTenantStampUsage(tenantId);

  const sub = subscription.data;
  const usage = usageQuery.data;

  const stampsUsed = usage?.stampsUsed ?? sub?.stampsUsedThisPeriod ?? 0;
  const bolsaFromMotriz =
    sub != null
      ? computeBolsaStamps({
          qFact: sub.qFact,
          stampsPerMotriz: sub.stampsPerMotriz,
          includedStamps: usage?.includedStamps ?? sub.includedStamps,
        })
      : null;
  const includedStamps =
    bolsaFromMotriz ?? usage?.includedStamps ?? sub?.includedStamps ?? 0;
  const usagePercent = computeStampUsagePercent(stampsUsed, includedStamps);
  const stampsRemaining = Math.max(0, includedStamps - stampsUsed);
  const usageAlertLevel = resolveStampUsageAlertLevel(usagePercent);

  const displayPlan = sub?.planName ?? planName ?? copy.sections.planFallback;
  const periodLabel = usage ? formatBillingPeriodKey(usage.periodKey) : null;

  const isTrialing = sub?.status === "trialing";
  const trialDateExpired =
    isTrialing && isTrialDateReached(sub?.trialEndsAt);
  const trialStampsExhausted =
    isTrialing && includedStamps > 0 && stampsUsed >= includedStamps;
  const showStamps = Boolean(usage || sub);

  return (
    <OpsPanel data-testid="ops-tenant-usage">
      <OpsPanelHeader className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <OpsPanelTitle>{copy.sections.thisMonth}</OpsPanelTitle>
          <OpsPanelDescription>
            {displayPlan}
            {periodLabel ? ` · ${periodLabel}` : ""}
          </OpsPanelDescription>
        </div>
        {canExport && usage ? (
          <OpsButton
            variant="ghost"
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
                  variant: "error",
                });
              }
            }}
          >
            {stampCopy.exportCsv}
          </OpsButton>
        ) : null}
      </OpsPanelHeader>
      <OpsPanelBody className="space-y-3">
        {subscription.isLoading && !sub ? (
          <OpsEmptyState variant="loading" title={copy.subscription.loading} />
        ) : (
          <>
            {showStamps ? (
              <div className="space-y-1">
                <OpsQuotaLine
                  kind="stamps"
                  label={opsCopy.quota.stamps}
                  used={stampsUsed}
                  included={includedStamps}
                />
                <p className="ops-type-caption ops-text-muted">
                  {stampCopy.remaining(stampsRemaining)}
                </p>
              </div>
            ) : null}

            {usageAlertLevel === "watch" ? (
              <OpsAlert title={stampCopy.usageAlerts.watch.title}>
                {stampCopy.usageAlerts.watch.description(stampsRemaining)}
              </OpsAlert>
            ) : null}
            {usageAlertLevel === "warning" ? (
              <OpsAlert tone="warn" title={stampCopy.usageAlerts.warning.title}>
                {stampCopy.usageAlerts.warning.description(stampsRemaining)}
              </OpsAlert>
            ) : null}
            {usageAlertLevel === "exhausted" ? (
              <OpsAlert
                tone="danger"
                title={stampCopy.usageAlerts.exhausted.title}
              >
                {stampCopy.usageAlerts.exhausted.description}
              </OpsAlert>
            ) : null}
            {isTrialing ? (
              <OpsAlert title={copy.subscription.statusLabels.trialing}>
                {copy.subscription.trialQuotaHint}
              </OpsAlert>
            ) : null}
            {trialDateExpired ? (
              <OpsAlert
                tone="danger"
                title={copy.subscription.trialExpiredTitle}
              >
                {copy.subscription.trialExpiredDescription}
              </OpsAlert>
            ) : null}
            {trialStampsExhausted && !trialDateExpired ? (
              <OpsAlert
                tone="danger"
                title={copy.subscription.trialExhaustedTitle}
              >
                {copy.subscription.trialExhaustedDescription}
              </OpsAlert>
            ) : null}
            {usage && usage.overageStamps > 0 ? (
              <OpsAlert tone="warn" title={stampCopy.overageTitle}>
                {opsCopy.usagePanel.overageStamps(usage.overageStamps)}
              </OpsAlert>
            ) : null}
          </>
        )}
      </OpsPanelBody>
    </OpsPanel>
  );
}
