import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Button } from "@shared/ui/button";
import { ChartCard } from "@shared/ui/data-display/ChartCard";
import { BoeltechBarChart } from "@shared/ui/data-display/charts";
import { EmptyState } from "@shared/ui/feedback-states";
import type { FinancialTrendData } from "../../domain/types";
import { DASHBOARD_FINANCIAL_TREND_SERIES } from "../config/dashboardChartConfig";
import { dashboardCopy } from "../copy/dashboardCopy";
import { financeCurrencyValueFormatter } from "../utils/dashboardChartHelpers";
import { formatPeriodLabel } from "../utils/financialComparisonHelpers";

export type FinancialTrendMonths = 6 | 12;

const TREND_MONTH_OPTIONS: FinancialTrendMonths[] = [6, 12];

function FinancialTrendMonthSelector({
  value,
  onChange,
}: {
  value: FinancialTrendMonths;
  onChange: (months: FinancialTrendMonths) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-lg bg-muted/50 p-0.5">
      {TREND_MONTH_OPTIONS.map((months) => (
        <Button
          key={months}
          type="button"
          variant="ghost"
          size="sm"
          className={
            value === months
              ? "h-7 bg-background px-2.5 text-xs text-foreground shadow-none hover:bg-background"
              : "h-7 px-2.5 text-xs text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
          }
          onClick={() => onChange(months)}
        >
          {dashboardCopy.financialTrend.monthsOption(months)}
        </Button>
      ))}
    </div>
  );
}

interface DashboardFinancialTrendChartProps {
  trend?: FinancialTrendData;
  isLoading: boolean;
  months: FinancialTrendMonths;
  onMonthsChange: (months: FinancialTrendMonths) => void;
}

export function DashboardFinancialTrendChart({
  trend,
  isLoading,
  months,
  onMonthsChange,
}: DashboardFinancialTrendChartProps) {
  const chartData = useMemo(
    () =>
      trend?.periods.map((period, index) => ({
        label: formatPeriodLabel(period),
        budgetedRevenue: trend.budgeted_revenue[index] ?? 0,
        actualRevenue: trend.actual_revenue[index] ?? 0,
        budgetedCost: trend.budgeted_cost[index] ?? 0,
        actualCost: trend.actual_cost[index] ?? 0,
      })) ?? [],
    [trend],
  );

  const hasData = useMemo(
    () =>
      chartData.some(
        (row) =>
          row.budgetedRevenue > 0 ||
          row.actualRevenue > 0 ||
          row.budgetedCost > 0 ||
          row.actualCost > 0,
      ),
    [chartData],
  );

  return (
    <ChartCard
      title={dashboardCopy.financialTrend.title}
      description={dashboardCopy.financialTrend.description}
      isLoading={isLoading}
      tools={
        <FinancialTrendMonthSelector value={months} onChange={onMonthsChange} />
      }
      aria-label={dashboardCopy.financialTrend.ariaLabel}
      footer={
        trend && hasData ? (
          <p className="text-xs text-muted-foreground">
            {dashboardCopy.charts.financialTrend.footer(
              months,
              trend.periods.length,
            )}
          </p>
        ) : undefined
      }
    >
      {!isLoading && !hasData ? (
        <EmptyState
          size="sm"
          icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
          title={dashboardCopy.charts.empty.title}
          description={dashboardCopy.charts.financialTrend.emptyDescription}
        />
      ) : (
        <BoeltechBarChart
          data={chartData}
          series={DASHBOARD_FINANCIAL_TREND_SERIES}
          height={280}
          valueFormatter={financeCurrencyValueFormatter}
        />
      )}
    </ChartCard>
  );
}
