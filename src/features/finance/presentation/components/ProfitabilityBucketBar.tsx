import { useMemo } from "react";
import { PieChart } from "lucide-react";
import {
  BoeltechCategoryBar,
  ChartCard,
} from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import type { ProfitabilityTripsResponse } from "@features/finance/domain";
import { buildFinanceBucketBarSegments } from "../config/financeChartConfig";
import { financeCopy } from "../copy";
import { financeCurrencyValueFormatter } from "../utils/financeChartHelpers";

interface ProfitabilityBucketBarProps {
  contextTrips?: ProfitabilityTripsResponse;
  inProgressActual?: number;
  isLoading?: boolean;
}

function ChartEmptyState({ description }: { description: string }) {
  return (
    <EmptyState
      size="sm"
      icon={<PieChart className="h-8 w-8 text-muted-foreground" />}
      title={financeCopy.profitability.charts.empty.title}
      description={description}
    />
  );
}

export function ProfitabilityBucketBar({
  contextTrips,
  inProgressActual = 0,
  isLoading = false,
}: ProfitabilityBucketBarProps) {
  const segments = useMemo(() => {
    const agg = contextTrips?.aggregates;
    if (!agg) return [];
    return buildFinanceBucketBarSegments({
      realized: agg.totalRevenue,
      pipeline: agg.totalProjectedRevenue,
      inProgress: inProgressActual,
      cancellationLoss: agg.totalCancellationLoss,
    });
  }, [contextTrips?.aggregates, inProgressActual]);

  const hasData = segments.some((s) => s.value > 0);

  return (
    <ChartCard
      title={financeCopy.profitability.bucketBar.title}
      description={financeCopy.profitability.bucketBar.description}
      isLoading={isLoading}
      aria-label="Composición financiera por bucket"
      footer={
        <p className="text-xs text-muted-foreground">
          {financeCopy.profitability.bucketBar.footer}
        </p>
      }
    >
      {!isLoading && !hasData ? (
        <ChartEmptyState
          description={financeCopy.profitability.bucketBar.emptyDescription}
        />
      ) : (
        <BoeltechCategoryBar
          segments={segments}
          valueFormatter={(n) => financeCurrencyValueFormatter(n)}
          aria-label="Barra de composición financiera"
        />
      )}
    </ChartCard>
  );
}
