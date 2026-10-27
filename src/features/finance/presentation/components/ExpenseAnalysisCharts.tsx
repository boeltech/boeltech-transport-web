import { useMemo } from "react";
import { BarChart3, PieChart } from "lucide-react";
import {
  BoeltechBarChart,
  BoeltechBarList,
  ChartCard,
  type ChartSeries,
} from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  formatMxCurrency,
  formatMxCurrencyCompact,
} from "@shared/utils/formatMxCurrency";
import type { ExpensesByCategory } from "@features/finance/domain";
import {
  buildExpenseCategoryChartSeries,
  pickFinanceExpenseChartToken,
} from "../config/financeChartConfig";
import { financeCopy } from "../copy";
import { expenseCategoryLabel } from "../utils/expenseCategoryLabel";
import {
  financeCurrencyValueFormatter,
  formatFinanceChartPeriodLabel,
  type FinanceChartGranularity,
} from "../utils/financeChartHelpers";

interface ExpenseAnalysisChartsProps {
  byCategory?: ExpensesByCategory;
  /** Totales por concepto en el periodo completo (misma base que el KPI). */
  categorySummary: { category: string; amount: number }[];
  /** Resolución del gráfico: redefine etiquetas de eje (día / semana / mes). */
  granularity?: FinanceChartGranularity;
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
  granularity = "month",
  isLoading = false,
}: ExpenseAnalysisChartsProps) {
  const { timeSeriesData, timeSeriesChartSeries } = useMemo(() => {
    if (!byCategory?.periods.length) {
      return { timeSeriesData: [], timeSeriesChartSeries: [] as ChartSeries[] };
    }

    const categories = Object.keys(byCategory.series);
    const series = buildExpenseCategoryChartSeries(categories, expenseCategoryLabel);

    const data = byCategory.periods.map((period, periodIndex) => ({
      label: formatFinanceChartPeriodLabel(period, granularity),
      ...Object.fromEntries(
        categories.map((cat) => [
          cat,
          byCategory.series[cat]?.[periodIndex] ?? 0,
        ]),
      ),
    }));

    return { timeSeriesData: data, timeSeriesChartSeries: series };
  }, [byCategory, granularity]);

  const rankingItems = useMemo(
    () =>
      categorySummary
        .filter((item) => item.amount > 0)
        .map((item, index) => ({
          key: item.category,
          label: expenseCategoryLabel(item.category),
          value: item.amount,
          token: pickFinanceExpenseChartToken(index),
        })),
    [categorySummary],
  );

  return (
    <div className="grid gap-6">
      <ChartCard
        title={financeCopy.expenses.charts.timeSeries.title}
        description={financeCopy.expenses.charts.timeSeries.description}
        isLoading={isLoading}
        aria-label={financeCopy.expenses.charts.timeSeries.ariaLabel}
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
            yAxisTickFormatter={formatMxCurrencyCompact}
            yAxisWidth={64}
          />
        )}
      </ChartCard>

      <ChartCard
        title={financeCopy.expenses.charts.composition.title}
        description={financeCopy.expenses.charts.composition.description}
        isLoading={isLoading}
        aria-label={financeCopy.expenses.charts.composition.ariaLabel}
      >
        {!isLoading && rankingItems.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
            title={financeCopy.expenses.charts.empty.title}
            description={
              financeCopy.expenses.charts.composition.emptyDescription
            }
          />
        ) : (
          <BoeltechBarList
            items={rankingItems}
            valueFormatter={formatMxCurrency}
            aria-label={financeCopy.expenses.charts.composition.ariaLabel}
          />
        )}
      </ChartCard>
    </div>
  );
}
