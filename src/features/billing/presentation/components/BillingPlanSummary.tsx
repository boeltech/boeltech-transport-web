import { Badge } from "@shared/ui/badge";
import { AlertWithIcon } from "@shared/ui/alert";
import { Progress } from "@shared/ui/progress";
import type {
  BillingCommercialSummary,
  BillingSubscription,
  BillingUsage,
} from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPriceCents,
  getStampRunOutSentence,
  getStampUsageTone,
  getSubscriptionStatusLabel,
} from "../utils/billingFormatters";
import {
  computeMotrizCargoCents,
  isMotrizPricing,
} from "../utils/motrizPricing";

interface BillingPlanSummaryProps {
  subscription?: BillingSubscription | null;
  isLoadingSubscription?: boolean;
  periodLabel?: string | null;
  chargedLabel?: string | null;
  commercialSummary?: BillingCommercialSummary;
  isLoadingCosts?: boolean;
  usage?: BillingUsage;
  isLoadingUsage?: boolean;
  usagePercent: number;
  stampsRemaining: number;
}

const TONE_INDICATOR: Record<
  ReturnType<typeof getStampUsageTone>,
  string
> = {
  primary: "bg-primary",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

/**
 * Resumen unificado above-the-fold (D1): plan + estado + periodo,
 * $/motriz|Q, estimado del mes y progress de bolsa.
 */
export function BillingPlanSummary({
  subscription,
  isLoadingSubscription = false,
  periodLabel = null,
  chargedLabel = null,
  commercialSummary,
  isLoadingCosts = false,
  usage,
  isLoadingUsage = false,
  usagePercent,
  stampsRemaining,
}: BillingPlanSummaryProps) {
  const copy = billingCopy.planSummary;
  const planCopy = billingCopy.plan;
  const stampsCopy = billingCopy.stamps;
  const costsCopy = billingCopy.costs;

  if (isLoadingSubscription) {
    return (
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm">
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      </div>
    );
  }

  if (!subscription) return null;

  const motriz = isMotrizPricing(subscription);
  const isQuote =
    motriz &&
    (subscription.pricePerMotrizCents == null ||
      (subscription.pricePerMotrizCents ?? 0) <= 0);
  const cargoCents = motriz
    ? computeMotrizCargoCents(
        subscription.qFact,
        subscription.pricePerMotrizCents,
      )
    : null;
  const tone = getStampUsageTone(usagePercent);
  const estimatedLoading = isLoadingCosts && !commercialSummary;
  const stampsLoading = isLoadingUsage && !usage;

  return (
    <div className="space-y-4 rounded-xl border bg-card px-4 py-4 shadow-sm sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="text-lg font-semibold tracking-tight">
            {subscription.planName || planCopy.planFallback}
          </p>
          <Badge variant="neutral" tone="soft">
            {getSubscriptionStatusLabel(subscription.status)}
          </Badge>
        </div>
        {periodLabel || chargedLabel ? (
          <div className="flex min-w-0 flex-col items-end gap-0.5">
            {periodLabel ? (
              <p className="text-sm text-muted-foreground">{periodLabel}</p>
            ) : null}
            {chargedLabel ? (
              <p className="text-sm text-muted-foreground">{chargedLabel}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          {motriz ? (
            isQuote ? (
              <>
                <p className="text-xl font-semibold tracking-tight">
                  {planCopy.pricePerMotrizQuote}
                </p>
                <p className="text-xs text-muted-foreground">
                  {planCopy.pricePerMotrizQuoteHint}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold tracking-tight tabular-nums">
                  {planCopy.pricePerMotriz(
                    formatBillingPriceCents(
                      subscription.pricePerMotrizCents ?? 0,
                    ),
                  )}
                </p>
                {subscription.qFact != null ? (
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {planCopy.qFactValue(subscription.qFact)}
                    {cargoCents != null &&
                    subscription.pricePerMotrizCents != null
                      ? ` · ${formatBillingPriceCents(cargoCents)}`
                      : ""}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {planCopy.qFactPending}
                  </p>
                )}
              </>
            )
          ) : (
            <p className="text-xl font-semibold tracking-tight tabular-nums">
              {formatBillingPriceCents(subscription.monthlyPriceCents)}
            </p>
          )}
        </div>

        <div className="space-y-1 sm:text-right">
          <p className="text-sm text-muted-foreground">{copy.estimatedLabel}</p>
          {estimatedLoading ? (
            <p className="text-sm text-muted-foreground">{costsCopy.loading}</p>
          ) : commercialSummary ? (
            <>
              <p className="text-2xl font-semibold tabular-nums">
                {isQuote && commercialSummary.estimatedTotalCents === 0
                  ? copy.quotePending
                  : formatBillingPriceCents(
                      commercialSummary.estimatedTotalCents,
                    )}
              </p>
              <p className="text-xs text-muted-foreground">{copy.estimatedHint}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {costsCopy.unavailable}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{copy.stampsLabel}</p>
            {stampsLoading ? (
              <p className="text-sm text-muted-foreground">{stampsCopy.loading}</p>
            ) : usage ? (
              <>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {stampsCopy.summary(usage.stampsUsed, usage.includedStamps)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stampsCopy.remaining(stampsRemaining)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {stampsCopy.unavailable}
              </p>
            )}
          </div>
          {usage ? (
            <Badge
              variant={tone === "primary" ? "neutral" : tone}
              tone="soft"
              className="tabular-nums"
            >
              {stampsCopy.usedPercent(usagePercent)}
            </Badge>
          ) : null}
        </div>
        {usage ? (
          <>
            <Progress
              value={usagePercent}
              indicatorClassName={TONE_INDICATOR[tone]}
            />
            {getStampRunOutSentence(usage.quotaPolicy) ? (
              <p className="text-xs text-muted-foreground">
                {getStampRunOutSentence(usage.quotaPolicy)}
              </p>
            ) : null}
            {usage.overageStamps > 0 ? (
              <AlertWithIcon variant="warning" title={stampsCopy.overageTitle}>
                <p>
                  {stampsCopy.overage(
                    usage.overageStamps,
                    formatBillingPriceCents(usage.overageTotalCents),
                  )}
                </p>
              </AlertWithIcon>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
