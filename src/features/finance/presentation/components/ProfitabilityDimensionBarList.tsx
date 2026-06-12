import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { BoeltechBarList, ChartCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import type {
  ProfitabilityAggregateItem,
  ProfitabilityDimension,
  ProfitabilityScope,
} from "@features/finance/domain";
import { financeCopy } from "../copy";
import { financeCurrencyValueFormatter } from "../utils/financeChartHelpers";
import { aggregateMetricForBarList } from "../utils/profitabilityScopeHelpers";

interface ProfitabilityDimensionBarListProps {
  scope: ProfitabilityScope;
  dimension: ProfitabilityDimension;
  aggregate?: ProfitabilityAggregateItem[];
  isLoading?: boolean;
  onSelectKey?: (key: string) => void;
}

export function ProfitabilityDimensionBarList({
  scope,
  dimension,
  aggregate,
  isLoading = false,
  onSelectKey,
}: ProfitabilityDimensionBarListProps) {
  const items = useMemo(() => {
    return (aggregate ?? [])
      .slice()
      .sort(
        (a, b) =>
          aggregateMetricForBarList(scope, b) -
          aggregateMetricForBarList(scope, a),
      )
      .slice(0, 5)
      .map((row) => ({
        key: row.key,
        label: row.label,
        value: aggregateMetricForBarList(scope, row),
        token: "chart-1" as const,
      }));
  }, [aggregate, scope]);

  const dimensionLabel =
    financeCopy.profitability.filters.dimensions[dimension];

  return (
    <ChartCard
      title={`${financeCopy.profitability.barList.title} · ${dimensionLabel}`}
      description={financeCopy.profitability.barList.description}
      isLoading={isLoading}
      aria-label={`Ranking top dimensiones por ${dimensionLabel}`}
    >
      {!isLoading && items.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
          title={financeCopy.profitability.charts.empty.title}
          description={financeCopy.profitability.barList.emptyDescription}
        />
      ) : (
        <BoeltechBarList
          items={items}
          valueFormatter={(n) => financeCurrencyValueFormatter(n)}
          onItemClick={onSelectKey}
          aria-label={`Top cinco ${dimensionLabel}`}
        />
      )}
    </ChartCard>
  );
}
