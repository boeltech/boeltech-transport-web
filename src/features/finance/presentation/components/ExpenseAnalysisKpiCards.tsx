import { useMemo } from "react";
import { MetricTrendCard, Sparkline } from "@shared/ui/data-display";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ExpensesByCategory, ExpensesByDimensionItem } from "@features/finance/domain";
import { financeCopy } from "../copy";

interface ExpenseAnalysisKpiCardsProps {
  byCategory?: ExpensesByCategory;
  latestPeriodIndex: number;
  periodLabel: string;
  dimensionLabel: string;
  dimensionRows: ExpensesByDimensionItem[];
  isLoading?: boolean;
  isDimensionLoading?: boolean;
}

export function ExpenseAnalysisKpiCards({
  byCategory,
  latestPeriodIndex,
  periodLabel,
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

  const topRow = dimensionRows[0];

  const cards = [
    {
      key: "periodTotal",
      title: financeCopy.expenses.metrics.totalExpense,
      subtitle: periodLabel,
      value: formatMxCurrency(periodTotal),
      tone: "warning" as const,
      trend: expenseSparkline,
      cardLoading: isLoading,
    },
    {
      key: "topConcentration",
      title: financeCopy.expenses.metrics.topConcentration.title,
      subtitle: topRow
        ? financeCopy.expenses.metrics.topConcentration.subtitle(dimensionLabel)
        : financeCopy.expenses.metrics.topConcentration.empty,
      value: topRow
        ? `${topRow.label} · ${formatMxCurrency(topRow.totalExpenses)}`
        : "—",
      tone: "primary" as const,
      trend: undefined,
      cardLoading: isDimensionLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
