import { useMemo } from "react";
import { PieChart } from "lucide-react";
import {
  BoeltechComboChart,
  BoeltechLineChart,
  ChartCard,
} from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import type {
  ProfitabilityAggregateItem,
  ProfitabilityScope,
} from "@features/finance/domain";
import {
  FINANCE_PROFITABILITY_COMBO_SERIES,
  FINANCE_PROFITABILITY_MONTHLY_SERIES,
} from "../config/financeChartConfig";
import { financeCopy } from "../copy";
import { financeCurrencyValueFormatter } from "../utils/financeChartHelpers";
import { buildProfitabilityMonthlyChartRows } from "../utils/profitabilityMonthSeries";
import { showsMarginForScope } from "../utils/profitabilityScopeHelpers";

interface ProfitabilityChartsProps {
  scope: ProfitabilityScope;
  monthAggregate?: ProfitabilityAggregateItem[];
  monthLoading?: boolean;
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

export function ProfitabilityCharts({
  scope,
  monthAggregate,
  monthLoading = false,
}: ProfitabilityChartsProps) {
  const monthlyData = useMemo(
    () => buildProfitabilityMonthlyChartRows(monthAggregate),
    [monthAggregate],
  );

  const useComboChart =
    showsMarginForScope(scope) &&
    monthlyData.some((row) => row.marginPct !== 0);

  const scopeLabel = financeCopy.profitability.scope[scope];

  return (
    <ChartCard
      title={financeCopy.profitability.charts.monthlyTrend.title}
      description={
        useComboChart
          ? financeCopy.profitability.charts.monthlyTrend.comboDescription
          : financeCopy.profitability.charts.monthlyTrend.description
      }
      isLoading={monthLoading}
      aria-label={`Gráfico mensual de rentabilidad · alcance ${scopeLabel}`}
      footer={
        <p className="text-xs text-muted-foreground">
          {financeCopy.profitability.charts.monthlyTrend.footer(
            monthlyData.length,
          )}
        </p>
      }
    >
      {!monthLoading && monthlyData.length === 0 ? (
        <ChartEmptyState
          description={financeCopy.profitability.charts.monthlyTrend.emptyDescription}
        />
      ) : useComboChart ? (
        <BoeltechComboChart
          data={monthlyData}
          series={FINANCE_PROFITABILITY_COMBO_SERIES}
          valueFormatter={(value) => financeCurrencyValueFormatter(value)}
        />
      ) : (
        <BoeltechLineChart
          data={monthlyData}
          series={FINANCE_PROFITABILITY_MONTHLY_SERIES}
          valueFormatter={financeCurrencyValueFormatter}
        />
      )}
    </ChartCard>
  );
}
