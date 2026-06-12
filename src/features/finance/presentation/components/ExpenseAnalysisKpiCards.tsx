import { useMemo } from "react";
import { MetricTrendCard, Sparkline } from "@shared/ui/data-display";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ExpensesByCategory, ExpensesByDimensionItem } from "@features/finance/domain";
import { financeCopy } from "../copy";
import { expenseCategoryLabel } from "../utils/expenseCategoryLabel";
import { formatFinanceReferencePeriod } from "../utils/financeChartHelpers";

interface ExpenseAnalysisKpiCardsProps {
  byCategory?: ExpensesByCategory;
  categorySummary: { category: string; amount: number }[];
  latestPeriodIndex: number;
  latestPeriod?: string;
  dimensionLabel: string;
  dimensionRows: ExpensesByDimensionItem[];
  isLoading?: boolean;
  isDimensionLoading?: boolean;
}

export function ExpenseAnalysisKpiCards({
  byCategory,
  categorySummary,
  latestPeriodIndex,
  latestPeriod,
  dimensionLabel,
  dimensionRows,
  isLoading = false,
  isDimensionLoading = false,
}: ExpenseAnalysisKpiCardsProps) {
  const periodTotal =
    latestPeriodIndex >= 0 && byCategory
      ? (byCategory.total[latestPeriodIndex] ?? 0)
      : 0;

  const expenseTrendData = useMemo(
    () => byCategory?.total.map((value) => ({ value })) ?? [],
    [byCategory],
  );

  const expenseSparkline = useMemo(() => {
    if (expenseTrendData.length < 2) return undefined;
    return <Sparkline data={expenseTrendData} token="chart-1" height={40} />;
  }, [expenseTrendData]);

  const activeCategories = categorySummary.filter((item) => item.amount > 0);
  const topCategory = activeCategories[0];

  const cards = [
    {
      key: "periodTotal",
      title: financeCopy.expenses.metrics.currentPeriodExpense,
      subtitle: latestPeriod
        ? formatFinanceReferencePeriod(latestPeriod)
        : financeCopy.expenses.metrics.referencePeriod,
      value: formatMxCurrency(periodTotal),
      tone: "warning" as const,
      trend: expenseSparkline,
      cardLoading: isLoading,
    },
    {
      key: "referencePeriod",
      title: financeCopy.expenses.metrics.referencePeriod,
      subtitle: financeCopy.expenses.charts.latestPeriod.description,
      value: latestPeriod ? formatFinanceReferencePeriod(latestPeriod) : "—",
      tone: "neutral" as const,
      trend: undefined,
      cardLoading: isLoading,
    },
    {
      key: "activeCategories",
      title: financeCopy.expenses.metrics.activeCategories.title,
      subtitle: topCategory
        ? `${expenseCategoryLabel(topCategory.category)} · ${formatMxCurrency(topCategory.amount)}`
        : financeCopy.expenses.metrics.activeCategories.subtitle,
      value: activeCategories.length,
      tone: "info" as const,
      trend: undefined,
      cardLoading: isLoading,
    },
    {
      key: "dimensionRows",
      title: financeCopy.expenses.metrics.dimensionRows.title,
      subtitle: financeCopy.expenses.metrics.dimensionRows.subtitle(dimensionLabel),
      value: dimensionRows.length,
      tone: "primary" as const,
      trend: undefined,
      cardLoading: isDimensionLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <MetricTrendCard
          key={card.key}
          title={card.title}
          subtitle={card.subtitle}
          value={card.value}
          tone={card.tone}
          trend={card.trend}
          isLoading={card.cardLoading}
        />
      ))}
    </div>
  );
}
