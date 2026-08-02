import { Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import type { BillingCommercialSummary } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPriceCents,
  getBillingCycleLabel,
} from "../utils/billingFormatters";

interface BillingCostsCardProps {
  summary?: BillingCommercialSummary;
  isLoading: boolean;
  billingCycle?: string | null;
}

export function BillingCostsCard({
  summary,
  isLoading,
  billingCycle,
}: BillingCostsCardProps) {
  const copy = billingCopy.costs;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : summary ? (
          <>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{copy.totalLabel}</p>
              <p className="text-3xl font-semibold tabular-nums">
                {formatBillingPriceCents(summary.estimatedTotalCents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {billingCycle
                  ? `${copy.totalHint} · ${copy.cycleHint(getBillingCycleLabel(billingCycle))}`
                  : copy.totalHint}
              </p>
            </div>

            <div>
              <InfoRow
                variant="inline"
                label={copy.rows.plan}
                value={formatBillingPriceCents(summary.planMonthlyPriceCents)}
              />
              <InfoRow
                variant="inline"
                label={copy.rows.modules}
                value={formatBillingPriceCents(summary.modulesTotalCents)}
              />
              {summary.overageTotalCents > 0 ? (
                <InfoRow
                  variant="inline"
                  label={copy.rows.overage}
                  value={formatBillingPriceCents(summary.overageTotalCents)}
                />
              ) : null}
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
            </div>

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
