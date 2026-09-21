import { CreditCard, Mail } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { formatDate } from "@shared/utils/dateUtils";
import type { BillingSubscription } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPriceCents,
  formatHistoryMonths,
  formatHistoryMonthsConsultable,
  formatLimitValue,
  formatUsageGranted,
  getSubscriptionStatusLabel,
} from "../utils/billingFormatters";
import { isTrialDateReached } from "../utils/billingNotice";
import {
  computeBolsaStamps,
  computeMotrizCargoCents,
  formatBandQRange,
  isMotrizPricing,
  resolveMotrizBand,
} from "../utils/motrizPricing";

interface BillingPlanCardProps {
  subscription?: BillingSubscription | null;
  isLoading: boolean;
  /** Cupo del periodo según `GET /billing/usage` (en prueba no es el del plan). */
  includedStamps?: number;
}

export function BillingPlanCard({
  subscription,
  isLoading,
  includedStamps,
}: BillingPlanCardProps) {
  const copy = billingCopy.plan;
  const trialEnded = isTrialDateReached(subscription?.trialEndsAt);
  const motriz = subscription ? isMotrizPricing(subscription) : false;
  const band = subscription ? resolveMotrizBand(subscription) : null;
  const bandLabel = band ? copy.bandLabels[band] : null;
  const bandRange = subscription
    ? formatBandQRange(subscription.bandQMin, subscription.bandQMax)
    : null;
  const bolsa =
    subscription && motriz
      ? computeBolsaStamps({
          qFact: subscription.qFact,
          stampsPerMotriz: subscription.stampsPerMotriz,
          includedStamps: includedStamps ?? subscription.includedStamps,
        })
      : null;
  const cargoCents =
    subscription && motriz
      ? computeMotrizCargoCents(
          subscription.qFact,
          subscription.pricePerMotrizCents,
        )
      : null;
  const isQuote =
    motriz &&
    (band === "grande" ||
      subscription?.pricePerMotrizCents == null ||
      (subscription?.pricePerMotrizCents ?? 0) <= 0);

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
    capacity?.pendingBandCode ?? subscription?.pendingCapacityBandCode ?? null;

  const capacityPitch =
    subscription && capacity
      ? copy.capacityPitch(
          formatLimitValue(usersGranted),
          formatLimitValue(branchesGranted),
          formatHistoryMonths(historyGranted),
        )
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : subscription ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold tracking-tight">
                {subscription.planName || copy.planFallback}
              </p>
              <Badge variant="neutral" tone="soft">
                {getSubscriptionStatusLabel(subscription.status)}
              </Badge>
              {bandLabel ? (
                <Badge variant="info" tone="soft">
                  {bandLabel}
                </Badge>
              ) : null}
            </div>

            {capacityPitch ? (
              <p className="text-xs text-muted-foreground">{capacityPitch}</p>
            ) : null}

            {pendingBand ? (
              <p className="text-xs text-muted-foreground">
                {copy.pendingBandHint}
              </p>
            ) : null}

            {motriz ? (
              <div className="space-y-1 rounded-lg border bg-muted/40 px-3 py-3">
                {isQuote ? (
                  <>
                    <p className="text-2xl font-semibold tracking-tight">
                      {copy.pricePerMotrizQuote}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {copy.pricePerMotrizQuoteHint}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-semibold tracking-tight tabular-nums">
                      {copy.pricePerMotriz(
                        formatBillingPriceCents(
                          subscription.pricePerMotrizCents ?? 0,
                        ),
                      )}
                    </p>
                    {cargoCents != null &&
                    subscription.qFact != null &&
                    subscription.pricePerMotrizCents != null ? (
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {copy.cargoEstimate(
                          subscription.qFact,
                          formatBillingPriceCents(
                            subscription.pricePerMotrizCents,
                          ),
                          formatBillingPriceCents(cargoCents),
                        )}
                      </p>
                    ) : null}
                  </>
                )}
                <p className="text-xs text-muted-foreground">{copy.noFeeNote}</p>
              </div>
            ) : null}

            {motriz && bandLabel && bandRange ? (
              <InfoRow
                variant="inline"
                label={copy.fields.band}
                value={`${bandLabel} · ${copy.bandRange(bandRange)}`}
              />
            ) : null}

            {motriz ? (
              <InfoRow
                variant="inline"
                label={copy.fields.qFact}
                value={
                  subscription.qFact != null
                    ? copy.qFactValue(subscription.qFact)
                    : copy.qFactPending
                }
              />
            ) : null}

            {motriz && bolsa != null ? (
              <InfoRow
                variant="inline"
                label={copy.fields.bolsa}
                value={copy.bolsaValue(
                  bolsa,
                  subscription.stampsPerMotriz,
                  subscription.qFact,
                )}
              />
            ) : null}

            {motriz && subscription.overagePriceCents > 0 ? (
              <InfoRow
                variant="inline"
                label={copy.fields.overageUnit}
                value={copy.overageUnitValue(
                  formatBillingPriceCents(subscription.overagePriceCents),
                )}
              />
            ) : null}

            <InfoRow
              variant="inline"
              label={copy.fields.users}
              value={formatUsageGranted(capacity?.users.usage, usersGranted)}
              alert={usersOverLimit ? "warning" : undefined}
            />
            {usersOverLimit ? (
              <p className="text-xs text-muted-foreground">{copy.overLimitHint}</p>
            ) : null}
            <InfoRow
              variant="inline"
              label={copy.fields.branches}
              value={formatUsageGranted(
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
              value={formatHistoryMonthsConsultable(historyGranted)}
            />
            {subscription.trialEndsAt ? (
              <InfoRow
                variant="inline"
                label={copy.fields.trial}
                value={formatDate(subscription.trialEndsAt)}
                alert={trialEnded ? "warning" : undefined}
              />
            ) : null}
            {subscription.status === "trialing" &&
            !trialEnded &&
            includedStamps ? (
              <p className="text-xs text-muted-foreground">
                {copy.trialQuotaHint(includedStamps)}
              </p>
            ) : null}
            {subscription.status === "trialing" && trialEnded ? (
              <p className="text-xs text-muted-foreground">
                {copy.trialEndedHint}
              </p>
            ) : null}
            {subscription.notes ? (
              <InfoRow
                variant="inline"
                label={copy.fields.notes}
                value={subscription.notes}
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={<CreditCard className="h-10 w-10" />}
            title={copy.empty.title}
            description={copy.empty.description}
            size="sm"
            cta={{
              label: copy.empty.contactCta,
              icon: <Mail className="h-4 w-4" />,
              variant: "outline",
              onClick: () => {
                window.location.href = `mailto:${billingCopy.contact.email}`;
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

