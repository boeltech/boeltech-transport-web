import { MetricTrendCard } from "@shared/ui/data-display";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ProfitabilityTripsResponse } from "@features/finance/domain";
import { financeCopy } from "../copy";

interface ProfitabilityContextCardsProps {
  aggregates?: ProfitabilityTripsResponse["aggregates"];
  isLoading?: boolean;
}

export function ProfitabilityContextCards({
  aggregates,
  isLoading = false,
}: ProfitabilityContextCardsProps) {
  return (
    <section className="space-y-3" aria-labelledby="profitability-context-heading">
      <h3
        id="profitability-context-heading"
        className="text-sm font-medium text-muted-foreground"
      >
        {financeCopy.profitability.context.heading}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricTrendCard
          title={financeCopy.profitability.context.projected}
          subtitle={financeCopy.profitability.context.projectedHint}
          value={formatMxCurrency(aggregates?.totalProjectedRevenue ?? 0)}
          tone="info"
          isLoading={isLoading}
          className="opacity-95"
        />
        <MetricTrendCard
          title={financeCopy.profitability.context.cancellationLoss}
          subtitle={financeCopy.profitability.context.cancellationLossHint}
          value={formatMxCurrency(aggregates?.totalCancellationLoss ?? 0)}
          tone="warning"
          isLoading={isLoading}
          className="opacity-95"
        />
        <MetricTrendCard
          title={financeCopy.profitability.context.cancelledInvoiceRevenue}
          subtitle={financeCopy.profitability.context.cancelledInvoiceRevenueHint}
          value={formatMxCurrency(aggregates?.totalCancelledInvoiceRevenue ?? 0)}
          tone="destructive"
          isLoading={isLoading}
          className="opacity-95"
        />
      </div>
    </section>
  );
}
