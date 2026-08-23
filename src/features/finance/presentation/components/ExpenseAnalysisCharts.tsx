import { useMemo } from "react";
import { PieChart } from "lucide-react";
import {
  BoeltechBarChart,
  BoeltechDonutChart,
  ChartCard,
  type ChartSeries,
} from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ExpensesByCategory } from "@features/finance/domain";
import { buildExpenseCategoryChartSeries, pickFinanceExpenseChartToken } from "../config/financeChartConfig";
import { financeCopy } from "../copy";
import { expenseCategoryLabel } from "../utils/expenseCategoryLabel";
import {
  filterNonZeroChartSlices,
  financeCurrencyValueFormatter,
  formatFinancePeriodLabel,
  formatFinanceReferencePeriod,
} from "../utils/financeChartHelpers";

interface ExpenseAnalysisChartsProps {
  byCategory?: ExpensesByCategory;
  categorySummary: { category: string; amount: number }[];
  latestPeriodIndex: number;
  latestPeriod?: string;
  periodLabel: string;
  isLoading?: boolean;
}

function ChartEmptyState({ description }: { description: string }) {
  return (
    <EmptyState
      size="sm"
      icon={<PieChart className="h-8 w-8 text-muted-foreground" />}
      title={financeCopy.expenses.charts.empty.title}
      description={description}
    />
  );
}

export function ExpenseAnalysisCharts({
  byCategory,
  categorySummary,
  latestPeriodIndex,
  latestPeriod,
  periodLabel,
  isLoading = false,
}: ExpenseAnalysisChartsProps) {
  const { timeSeriesData, timeSeriesChartSeries } = useMemo(() => {
    if (!byCategory?.periods.length) {
      return { timeSeriesData: [], timeSeriesChartSeries: [] as ChartSeries[] };
    }

    const categories = Object.keys(byCategory.series);
    const series = buildExpenseCategoryChartSeries(categories, expenseCategoryLabel);

    const data = byCategory.periods.map((period, periodIndex) => ({
      label: formatFinancePeriodLabel(period),
      ...Object.fromEntries(
        categories.map((cat) => [
          cat,
          byCategory.series[cat]?.[periodIndex] ?? 0,
        ]),
      ),
    }));

    return { timeSeriesData: data, timeSeriesChartSeries: series };
  }, [byCategory]);

  const donutSlices = useMemo(() => {
    const data = categorySummary.map(({ category, amount }) => ({
      label: expenseCategoryLabel(category),
      value: amount,
    }));
    const series = categorySummary.map((item, index) => ({
      dataKey: "value",
      label: expenseCategoryLabel(item.category),
      token: pickFinanceExpenseChartToken(index),
    }));

    return filterNonZeroChartSlices(data, series);
  }, [categorySummary]);

  const periodTotal =
    latestPeriodIndex >= 0 && byCategory
      ? (byCategory.total[latestPeriodIndex] ?? 0)
      : 0;

  const compositionTitle = financeCopy.expenses.charts.latestPeriod.title(
    periodLabel === "—" ? "" : periodLabel,
  );

  return (
    <div className="grid gap-6">
      <ChartCard
        title={financeCopy.expenses.charts.timeSeries.title}
        description={financeCopy.expenses.charts.timeSeries.description}
        isLoading={isLoading}
        aria-label="Gráfico de barras apiladas: gastos por concepto en el tiempo"
        footer={
          timeSeriesData.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {financeCopy.expenses.charts.timeSeries.footer(
                timeSeriesData.length,
                timeSeriesChartSeries.length,
              )}
            </p>
          ) : undefined
        }
      >
        {!isLoading && timeSeriesData.length === 0 ? (
          <ChartEmptyState description={financeCopy.expenses.empty.description} />
        ) : (
          <BoeltechBarChart
            data={timeSeriesData}
            series={timeSeriesChartSeries}
            stacked
            valueFormatter={financeCurrencyValueFormatter}
          />
        )}
      </ChartCard>

      <ChartCard
        title={compositionTitle}
        description={financeCopy.expenses.charts.latestPeriod.description}
        isLoading={isLoading}
        aria-label="Gráfico de dona: composición de gastos del tramo"
        footer={
          latestPeriod ? (
            <p className="text-xs text-muted-foreground">
              {financeCopy.expenses.charts.latestPeriod.footer(
                formatFinanceReferencePeriod(latestPeriod),
              )}
            </p>
          ) : undefined
        }
      >
        {!isLoading && donutSlices.data.length === 0 ? (
          <ChartEmptyState
            description={financeCopy.expenses.charts.latestPeriod.emptyDescription}
          />
        ) : (
          <BoeltechDonutChart
            data={donutSlices.data}
            series={donutSlices.series}
            valueFormatter={financeCurrencyValueFormatter}
            centerLabel={
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {formatMxCurrency(periodTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {financeCopy.expenses.charts.latestPeriod.centerLabel}
                </p>
              </div>
            }
          />
        )}
      </ChartCard>
    </div>
  );
}
