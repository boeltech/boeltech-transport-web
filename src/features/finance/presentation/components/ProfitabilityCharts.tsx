import { useMemo } from "react";
import { PieChart } from "lucide-react";
import {
  BoeltechComboChart,
  BoeltechDonutChart,
  BoeltechLineChart,
  ChartCard,
} from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import type {
  ProfitabilityAggregateItem,
  ProfitabilityScope,
  ProfitabilityTripsResponse,
} from "@features/finance/domain";
import {
  buildProfitabilityStatusChartSeries,
  FINANCE_PROFITABILITY_COMBO_SERIES,
  FINANCE_PROFITABILITY_MONTHLY_SERIES,
  FINANCE_PROFITABILITY_STATUS_ORDER,
} from "../config/financeChartConfig";
import { financeCopy } from "../copy";
import {
  filterNonZeroChartSlices,
  financeCountValueFormatter,
  financeCurrencyValueFormatter,
} from "../utils/financeChartHelpers";
import { showsMarginForScope } from "../utils/profitabilityScopeHelpers";

interface ProfitabilityChartsProps {
  scope: ProfitabilityScope;
  trips?: ProfitabilityTripsResponse;
  monthAggregate?: ProfitabilityAggregateItem[];
  tripsLoading?: boolean;
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
  trips,
  monthAggregate,
  tripsLoading = false,
  monthLoading = false,
}: ProfitabilityChartsProps) {
  const monthlyData = useMemo(
    () =>
      (monthAggregate ?? []).map((row) => ({
        label: row.label,
        revenue: row.totalRevenue,
        actual: row.totalActual,
        marginPct: row.blendedMarginPct ?? 0,
      })),
    [monthAggregate],
  );

  const useComboChart =
    showsMarginForScope(scope) &&
    monthlyData.some((row) => row.marginPct !== 0);

  const statusSlices = useMemo(() => {
    if (!trips?.aggregates.byProfitabilityStatus) {
      return { data: [], series: buildProfitabilityStatusChartSeries() };
    }

    const data = FINANCE_PROFITABILITY_STATUS_ORDER.map((status) => ({
      label: financeCopy.profitability.statuses[status],
      value: trips.aggregates.byProfitabilityStatus[status],
    }));
    const series = buildProfitabilityStatusChartSeries();

    return filterNonZeroChartSlices(data, series);
  }, [trips]);

  const statusTotal = useMemo(
    () =>
      trips
        ? FINANCE_PROFITABILITY_STATUS_ORDER.reduce(
            (sum, status) =>
              sum + trips.aggregates.byProfitabilityStatus[status],
            0,
          )
        : 0,
    [trips],
  );

  const scopeLabel = financeCopy.profitability.scope[scope];

  return (
    <div className="grid gap-6">
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

      <ChartCard
        title={financeCopy.profitability.charts.statusDistribution.title}
        description={financeCopy.profitability.charts.statusDistribution.description}
        isLoading={tripsLoading}
        aria-label={`Distribución por rentabilidad · alcance ${scopeLabel}`}
        footer={
          <p className="text-xs text-muted-foreground">
            {financeCopy.profitability.charts.statusDistribution.footer(statusTotal)}
          </p>
        }
      >
        {!tripsLoading && statusSlices.data.length === 0 ? (
          <ChartEmptyState
            description={
              financeCopy.profitability.charts.statusDistribution.emptyDescription
            }
          />
        ) : (
          <BoeltechDonutChart
            data={statusSlices.data}
            series={statusSlices.series}
            valueFormatter={financeCountValueFormatter}
            centerLabel={
              <div>
                <p className="text-2xl font-bold tabular-nums">{statusTotal}</p>
                <p className="text-xs text-muted-foreground">
                  {financeCopy.profitability.charts.statusDistribution.centerLabel}
                </p>
              </div>
            }
          />
        )}
      </ChartCard>
    </div>
  );
}
