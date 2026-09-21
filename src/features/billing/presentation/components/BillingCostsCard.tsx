import { useState } from "react";
import { ChevronDown, Receipt } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { InfoRow } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";
import type {
  BillingCommercialSummary,
  BillingSubscription,
} from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
  getBillingCycleLabel,
} from "../utils/billingFormatters";
import { isMotrizPricing } from "../utils/motrizPricing";

interface BillingCostsCardProps {
  summary?: BillingCommercialSummary;
  isLoading: boolean;
  billingCycle?: string | null;
  /** `period_key` del usage (misma etiqueta CDMX que el card de timbres). */
  periodKey?: string | null;
  /** SoT v5 — labels/hints motriz; totales vienen del commercial_summary API. */
  subscription?: BillingSubscription | null;
}

export function BillingCostsCard({
  summary,
  isLoading,
  billingCycle,
  periodKey,
  subscription,
}: BillingCostsCardProps) {
  const copy = billingCopy.costs;
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const resolvedPeriodKey = periodKey ?? summary?.periodKey ?? null;
  const periodLabel = resolvedPeriodKey
    ? formatBillingPeriodKey(resolvedPeriodKey)
    : null;

  const motriz = subscription ? isMotrizPricing(subscription) : false;
  const isQuote =
    motriz &&
    (subscription?.pricePerMotrizCents == null ||
      (subscription?.pricePerMotrizCents ?? 0) <= 0);

  /** API SoT: flat monthly o cargo Q×P ya en `plan_monthly_price_cents`. */
  const planRowCents = summary?.planMonthlyPriceCents ?? null;
  const modulesCents = summary?.modulesTotalCents ?? 0;
  const overageCents = summary?.overageTotalCents ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription>
          {copy.description}
          {periodLabel ? (
            <>
              {" "}
              <span className="text-foreground/80">
                {copy.periodLabel(periodLabel)}
              </span>
            </>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : summary ? (
          <>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{copy.totalLabel}</p>
              <p className="text-3xl font-semibold tabular-nums">
                {isQuote && summary.estimatedTotalCents === 0
                  ? copy.quotePending
                  : formatBillingPriceCents(summary.estimatedTotalCents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {billingCycle
                  ? `${copy.totalHint} · ${copy.cycleHint(getBillingCycleLabel(billingCycle))}`
                  : copy.totalHint}
              </p>
            </div>

            <div>
              {motriz ? (
                isQuote ? (
                  <InfoRow
                    variant="inline"
                    label={copy.rows.motrizQuote}
                    value={copy.quotePending}
                  />
                ) : (
                  <>
                    <InfoRow
                      variant="inline"
                      label={copy.rows.motrizCargo}
                      value={formatBillingPriceCents(planRowCents ?? 0)}
                    />
                    {subscription?.qFact != null &&
                    subscription.pricePerMotrizCents != null ? (
                      <p className="pb-2 text-xs text-muted-foreground">
                        {copy.motrizCargoHint(
                          subscription.qFact,
                          formatBillingPriceCents(
                            subscription.pricePerMotrizCents,
                          ),
                        )}
                      </p>
                    ) : null}
                  </>
                )
              ) : (
                <InfoRow
                  variant="inline"
                  label={copy.rows.plan}
                  value={formatBillingPriceCents(summary.planMonthlyPriceCents)}
                />
              )}
              <InfoRow
                variant="inline"
                label={copy.rows.modules}
                value={formatBillingPriceCents(modulesCents)}
              />
              {overageCents > 0 ? (
                <InfoRow
                  variant="inline"
                  label={copy.rows.overage}
                  value={formatBillingPriceCents(overageCents)}
                />
              ) : null}
            </div>

            <Collapsible
              open={breakdownOpen}
              onOpenChange={setBreakdownOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-0 hover:bg-transparent"
                >
                  {breakdownOpen
                    ? copy.breakdownToggle.hide
                    : copy.breakdownToggle.show}
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "ml-1.5 h-4 w-4 transition-transform",
                      breakdownOpen && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0 pt-1">
                <InfoRow
                  variant="inline"
                  label={copy.rows.subtotal}
                  value={formatBillingPriceCents(summary.subtotalCents)}
                />
                <InfoRow
                  variant="inline"
                  label={copy.rows.iva}
                  value={formatBillingPriceCents(summary.ivaCents)}
                />
              </CollapsibleContent>
            </Collapsible>

            <p className="text-xs text-muted-foreground">{copy.disclaimer}</p>
          </>
        ) : (
          <EmptyState
            icon={<Receipt className="h-10 w-10" />}
            title={copy.unavailable}
            size="sm"
          />
        )}
      </CardContent>
    </Card>
  );
}
