import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { ChartCard } from "@shared/ui/data-display/ChartCard";
import { BoeltechBarChart, findPeakCategory } from "@shared/ui/data-display/charts";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  formatMxCurrencyCompact,
  formatMxCurrencyWhole,
} from "@shared/utils/formatMxCurrency";
import { formatMonthPeriodAxis } from "@shared/utils/monthPeriod";
import type { FinancialMonth, FinancialTrendData } from "../../domain/types";
import { DASHBOARD_FINANCIAL_TREND_SERIES } from "../config/dashboardChartConfig";
import { dashboardCopy } from "../copy/dashboardCopy";
import { financeCurrencyValueFormatter } from "../utils/dashboardChartHelpers";
import {
  buildFinancialTrendChartData,
  describePlanVariance,
  getTrendCurrentPeriod,
  type PlanVariance,
} from "../utils/financialComparisonHelpers";

export type FinancialTrendMonths = 6 | 12;

const TREND_MONTH_OPTIONS: FinancialTrendMonths[] = [6, 12];

const copy = dashboardCopy.financialComparison;

function FinancialTrendMonthSelector({
  value,
  onChange,
}: {
  value: FinancialTrendMonths;
  onChange: (months: FinancialTrendMonths) => void;
}) {
  return (
    <div
      role="group"
      aria-label={copy.monthsAriaLabel}
      className="flex gap-0.5 rounded-lg bg-muted/50 p-0.5"
    >
      {TREND_MONTH_OPTIONS.map((months) => (
        <Button
          key={months}
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={value === months}
          className={
            value === months
              ? "h-7 bg-background px-2.5 text-xs text-foreground shadow-none hover:bg-background"
              : "h-7 px-2.5 text-xs text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
          }
          onClick={() => onChange(months)}
        >
          {copy.monthsOption(months)}
        </Button>
      ))}
    </div>
  );
}

function planVarianceValue(
  variance: PlanVariance,
  labels: { noPlan: string; equal: string },
): string {
  if (variance.kind === "no_plan") return labels.noPlan;
  if (variance.kind === "equal") return labels.equal;
  return variance.value;
}

function FinancialMiniKpis({ fm }: { fm: FinancialMonth }) {
  const revenueVariance = describePlanVariance(fm.budgeted_revenue, fm.revenue_variance);
  const costVariance = describePlanVariance(fm.budgeted_cost, fm.cost_variance);
  const actualRevenue = formatMxCurrencyWhole(fm.actual_revenue);
  const actualCost = formatMxCurrencyWhole(fm.actual_cost);

  const items = [
    {
      label: copy.miniKpis.revenueVariance,
      value: planVarianceValue(revenueVariance, {
        noPlan: copy.miniKpis.noAgreedRate,
        equal: copy.miniKpis.equalToAgreed,
      }),
      detail:
        revenueVariance.kind === "no_plan"
          ? copy.miniKpis.revenueOnlyDetail(actualRevenue)
          : copy.miniKpis.revenueDetail(
              formatMxCurrencyWhole(fm.budgeted_revenue),
              actualRevenue,
            ),
    },
    {
      label: copy.miniKpis.costVariance,
      value: planVarianceValue(costVariance, {
        noPlan: copy.miniKpis.noEstimatedCost,
        equal: copy.miniKpis.equalToEstimated,
      }),
      detail:
        costVariance.kind === "no_plan"
          ? copy.miniKpis.costOnlyDetail(actualCost)
          : copy.miniKpis.costDetail(formatMxCurrencyWhole(fm.budgeted_cost), actualCost),
    },
    {
      label: copy.miniKpis.actualMargin,
      value: formatMxCurrencyWhole(fm.actual_margin),
      detail: copy.miniKpis.marginDetail,
    },
  ];

  return (
    <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-sm font-semibold tabular-nums">{item.value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {item.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

interface DashboardFinancialComparisonChartProps {
  financialMonth?: FinancialMonth | null;
  isLoading: boolean;
  trend?: FinancialTrendData;
  trendLoading?: boolean;
  months: FinancialTrendMonths;
  onMonthsChange: (months: FinancialTrendMonths) => void;
}

export function DashboardFinancialComparisonChart({
  financialMonth,
  isLoading,
  trend,
  trendLoading = false,
  months,
  onMonthsChange,
}: DashboardFinancialComparisonChartProps) {
  const monthTripCount = financialMonth?.trip_count ?? 0;
  const hasMonthTrips = monthTripCount > 0;

  const chartData = useMemo(
    () =>
      buildFinancialTrendChartData(trend, {
        months,
        currentPeriod: getTrendCurrentPeriod(trend),
        formatCurrentLabel: copy.currentPeriodLabel,
      }),
    [trend, months],
  );

  const priorityPeriods = useMemo(() => {
    const peak = findPeakCategory(chartData, "period", ["actualRevenue", "actualCost"]);
    return peak ? [peak] : [];
  }, [chartData]);

  const tooltipTitle = useCallback(
    (period: string) => chartData.find((row) => row.period === period)?.label ?? period,
    [chartData],
  );

  const hasTrendData = useMemo(
    () => chartData.some((row) => row.actualRevenue > 0 || row.actualCost > 0),
    [chartData],
  );

  const loading = isLoading || trendLoading;
  const isEmpty = !loading && !hasTrendData && !hasMonthTrips;

  return (
    <ChartCard
      title={copy.title}
      description={copy.description}
      isLoading={loading}
      aria-label={copy.ariaLabel}
      tools={
        <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-2 sm:justify-end">
          <FinancialTrendMonthSelector value={months} onChange={onMonthsChange} />
          <Button variant="link" size="sm" className="h-auto px-0 text-xs" asChild>
            <Link to="/finance/analysis?view=performance">
              {copy.compareWithPreviousYear}
            </Link>
          </Button>
          <Button variant="link" size="sm" className="h-auto px-0 text-xs" asChild>
            <Link to="/finance/analysis?view=margin">{copy.viewProfitability}</Link>
          </Button>
        </div>
      }
      footer={
        isEmpty ? undefined : (
          <p className="text-xs text-muted-foreground">
            {copy.footer(months, monthTripCount)}
          </p>
        )
      }
    >
      {isEmpty ? (
        <EmptyState
          icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
          title={copy.empty.title}
          description={copy.empty.description}
        />
      ) : (
        <div className="space-y-4">
          {financialMonth && financialMonth.trips_with_pending_expenses > 0 ? (
            <Alert
              variant="info"
              role="region"
              aria-label={copy.pendingExpensesLinkAriaLabel}
            >
              <AlertDescription>
                <Link
                  to="/finance/approvals?status=pending&type=trip_expense"
                  className="cursor-pointer hover:underline"
                  aria-label={copy.pendingExpensesLinkAriaLabel}
                >
                  {copy.pendingExpensesAlert}
                </Link>
              </AlertDescription>
            </Alert>
          ) : null}

          <BoeltechBarChart
            data={chartData}
            series={DASHBOARD_FINANCIAL_TREND_SERIES}
            xAxisKey="period"
            xAxisTickFormatter={formatMonthPeriodAxis}
            xAxisPriorityValues={priorityPeriods}
            tooltipTitleFormatter={tooltipTitle}
            height={280}
            valueFormatter={financeCurrencyValueFormatter}
            yAxisTickFormatter={formatMxCurrencyCompact}
            yAxisWidth={64}
          />

          {financialMonth && hasMonthTrips ? (
            <FinancialMiniKpis fm={financialMonth} />
          ) : (
            <p className="border-t pt-4 text-xs text-muted-foreground">
              {copy.monthEmpty}
            </p>
          )}
        </div>
      )}
    </ChartCard>
  );
}
