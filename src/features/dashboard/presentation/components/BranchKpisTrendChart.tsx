import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Button } from "@shared/ui/button";
import { ChartCard } from "@shared/ui/data-display/ChartCard";
import { BoeltechBarChart } from "@shared/ui/data-display/charts";
import { EmptyState } from "@shared/ui/feedback-states";
import type { ChartSeries, ChartToken } from "@shared/ui/data-display/charts";
import type {
  BranchKpisTrendData,
  BranchKpisTrendMonths,
} from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import { formatPeriodLabel } from "../utils/financialComparisonHelpers";

const copy = dashboardCopy.branchKpis.trend;
const TREND_MONTH_OPTIONS: BranchKpisTrendMonths[] = [6, 12];
const SERIES_TOKENS: ChartToken[] = ["chart-1", "chart-2", "chart-3"];

function seriesDataKey(index: number): string {
  return `s${index}`;
}

function BranchKpisTrendMonthsSelector({
  value,
  onChange,
}: {
  value: BranchKpisTrendMonths;
  onChange: (months: BranchKpisTrendMonths) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-md border bg-muted/40 p-0.5">
      {TREND_MONTH_OPTIONS.map((months) => (
        <Button
          key={months}
          type="button"
          variant={value === months ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onChange(months)}
        >
          {copy.monthsOption(months)}
        </Button>
      ))}
    </div>
  );
}

interface BranchKpisTrendChartProps {
  trend?: BranchKpisTrendData;
  isLoading: boolean;
  months: BranchKpisTrendMonths;
  onMonthsChange: (months: BranchKpisTrendMonths) => void;
  title?: string;
  description?: string;
  emptyTitle?: string;
  height?: number;
  compact?: boolean;
}

export function BranchKpisTrendChart({
  trend,
  isLoading,
  months,
  onMonthsChange,
  title = copy.title,
  description = copy.description,
  emptyTitle = copy.empty,
  height = 240,
  compact = false,
}: BranchKpisTrendChartProps) {
  const chartSeries: ChartSeries[] = useMemo(
    () =>
      (trend?.series ?? []).map((item, index) => ({
        dataKey: seriesDataKey(index),
        label: item.branchName,
        token: SERIES_TOKENS[index] ?? "chart-1",
      })),
    [trend?.series],
  );

  const chartData = useMemo(
    () =>
      trend?.periods.map((period, periodIndex) => {
        const point: Record<string, string | number> = {
          label: formatPeriodLabel(period),
        };
        trend.series.forEach((item, seriesIndex) => {
          point[seriesDataKey(seriesIndex)] =
            item.tripsCompleted[periodIndex] ?? 0;
        });
        return point;
      }) ?? [],
    [trend],
  );

  const hasData = useMemo(
    () =>
      chartData.some((row) =>
        chartSeries.some((series) => Number(row[series.dataKey] ?? 0) > 0),
      ),
    [chartData, chartSeries],
  );

  const hasSelection = (trend?.series.length ?? 0) > 0;

  return (
    <ChartCard
      title={title}
      description={compact ? undefined : description}
      isLoading={isLoading}
      tools={
        <BranchKpisTrendMonthsSelector
          value={months}
          onChange={onMonthsChange}
        />
      }
      aria-label={copy.ariaLabel}
      footer={
        trend && hasData ? (
          <p className="text-xs text-muted-foreground">
            {copy.footer(months, trend.periods.length)}
          </p>
        ) : undefined
      }
    >
      {!isLoading && !hasSelection ? (
        <EmptyState
          size="sm"
          icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
          title={copy.emptySelection}
        />
      ) : !isLoading && !hasData ? (
        <EmptyState
          size="sm"
          icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
          title={emptyTitle}
        />
      ) : (
        <BoeltechBarChart
          data={chartData}
          series={chartSeries}
          height={height}
          valueFormatter={(value) => String(value)}
        />
      )}
    </ChartCard>
  );
}
