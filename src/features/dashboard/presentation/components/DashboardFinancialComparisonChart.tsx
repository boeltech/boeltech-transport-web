import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { ChartCard } from "@shared/ui/data-display/ChartCard";
import { ChartContainer } from "@shared/ui/data-display/charts/ChartContainer";
import { ChartLegend } from "@shared/ui/data-display/charts/ChartLegend";
import {
  CHART_AXIS_LINE,
  CHART_AXIS_TICK,
  CHART_GRID,
  chartColor,
} from "@shared/ui/data-display/charts/chartTokens";
import { EmptyState } from "@shared/ui/feedback-states";
import { formatMxCurrency, formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import type { FinancialMonth } from "../../domain/types";
import { DASHBOARD_FINANCIAL_COMPARISON_SERIES } from "../config/dashboardChartConfig";
import { dashboardCopy } from "../copy/dashboardCopy";
import { createFinancialComparisonTooltip } from "./FinancialComparisonTooltip";
import {
  buildFinancialMonthDescription,
  formatVarianceAmount,
} from "../utils/financialComparisonHelpers";

interface DashboardFinancialComparisonChartProps {
  financialMonth?: FinancialMonth | null;
  isLoading: boolean;
}

function FinancialMiniKpis({ fm }: { fm: FinancialMonth }) {
  const items = [
    {
      label: dashboardCopy.financialComparison.miniKpis.revenueVariance,
      value: formatVarianceAmount(fm.revenue_variance),
    },
    {
      label: dashboardCopy.financialComparison.miniKpis.costVariance,
      value: formatVarianceAmount(fm.cost_variance),
    },
    {
      label: dashboardCopy.financialComparison.miniKpis.actualMargin,
      value: formatMxCurrencyWhole(fm.actual_margin),
    },
  ];

  return (
    <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-sm font-semibold tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function DashboardFinancialComparisonChart({
  financialMonth,
  isLoading,
}: DashboardFinancialComparisonChartProps) {
  const hasTrips = (financialMonth?.trip_count ?? 0) > 0;

  const chartData = financialMonth
    ? [
        {
          label: dashboardCopy.financialComparison.categories.revenue,
          budgeted: financialMonth.budgeted_revenue,
          actual: financialMonth.actual_revenue,
        },
        {
          label: dashboardCopy.financialComparison.categories.cost,
          budgeted: financialMonth.budgeted_cost,
          actual: financialMonth.actual_cost,
        },
      ]
    : [];

  return (
    <ChartCard
      title={dashboardCopy.financialComparison.title}
      description={
        financialMonth && hasTrips
          ? buildFinancialMonthDescription(financialMonth)
          : dashboardCopy.financialComparison.descriptionEmpty
      }
      isLoading={isLoading}
      aria-label={dashboardCopy.financialComparison.ariaLabel}
      tools={
        <Button variant="link" size="sm" className="h-auto px-0 text-xs" asChild>
          <Link to="/finance?tab=analysis&view=margin">
            {dashboardCopy.financialComparison.viewProfitability}
          </Link>
        </Button>
      }
      footer={
        financialMonth && hasTrips ? (
          <p className="text-xs text-muted-foreground">
            {dashboardCopy.financialComparison.footer(financialMonth.trip_count)}
          </p>
        ) : undefined
      }
    >
      {!isLoading && !hasTrips ? (
        <EmptyState
          icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
          title={dashboardCopy.financialComparison.empty.title}
          description={dashboardCopy.financialComparison.empty.description}
        />
      ) : (
        <div className="space-y-4">
          {financialMonth && financialMonth.trips_with_pending_expenses > 0 ? (
            <Alert
              variant="info"
              role="region"
              aria-label={dashboardCopy.financialComparison.pendingExpensesLinkAriaLabel}
            >
              <AlertDescription>
                <Link
                  to="/finance?tab=approvals&status=pending&type=trip_expense"
                  className="cursor-pointer hover:underline"
                  aria-label={dashboardCopy.financialComparison.pendingExpensesLinkAriaLabel}
                >
                  {dashboardCopy.financialComparison.pendingExpensesAlert}
                </Link>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-3">
            <ChartContainer>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid {...CHART_GRID} vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={CHART_AXIS_LINE}
                  tickLine={false}
                  tick={CHART_AXIS_TICK}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={CHART_AXIS_TICK}
                  width={48}
                />
                <Tooltip
                  content={createFinancialComparisonTooltip(
                    DASHBOARD_FINANCIAL_COMPARISON_SERIES,
                    (value: ValueType) =>
                      formatMxCurrency(
                        typeof value === "number" ? value : Number(value) || 0,
                      ),
                  )}
                  cursor={{ fill: "var(--muted)" }}
                />
                {DASHBOARD_FINANCIAL_COMPARISON_SERIES.map((item) => (
                  <Bar
                    key={item.dataKey}
                    dataKey={item.dataKey}
                    name={item.label}
                    fill={chartColor(item.token)}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ChartContainer>
            <ChartLegend series={DASHBOARD_FINANCIAL_COMPARISON_SERIES} />
          </div>

          {financialMonth ? <FinancialMiniKpis fm={financialMonth} /> : null}
        </div>
      )}
    </ChartCard>
  );
}
