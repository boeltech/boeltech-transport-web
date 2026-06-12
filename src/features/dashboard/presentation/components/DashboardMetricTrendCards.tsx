import { useMemo } from "react";
import type { useNavigate } from "react-router-dom";
import {
  BoeltechBarChart,
  MetricTrendCard,
  Sparkline,
} from "@shared/ui/data-display";
import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import type { useDashboard } from "../../application/hooks/useDashboard";
import type { useFinanceSummary } from "@features/finance";
import type { TripsByDayData } from "../../domain/types";
import { DASHBOARD_FINANCIAL_MINI_SERIES } from "../config/dashboardChartConfig";
import { dashboardCopy } from "../copy/dashboardCopy";

interface DashboardMetricTrendCardsProps {
  data: ReturnType<typeof useDashboard>["data"];
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
  tripsByDay?: TripsByDayData;
  tripsByDayLoading?: boolean;
  showFinance: boolean;
  financeLoading: boolean;
  collectedTrendData: { value: number }[];
  financeSummary?: ReturnType<typeof useFinanceSummary>["data"];
}

export function DashboardMetricTrendCards({
  data,
  isLoading,
  navigate,
  tripsByDay,
  tripsByDayLoading,
  showFinance,
  financeLoading,
  collectedTrendData,
  financeSummary,
}: DashboardMetricTrendCardsProps) {
  const financialMonth = data?.stats.financial_month;
  const vehicles = data?.stats.vehicles;

  const activitySparkline = useMemo(() => {
    if ((tripsByDay?.points.length ?? 0) < 2) return undefined;
    return (
      <Sparkline
        data={tripsByDay!.points.map((p) => ({ value: p.completed }))}
        token="chart-1"
        height={40}
      />
    );
  }, [tripsByDay]);

  const collectedSparkline = useMemo(() => {
    if (collectedTrendData.length < 2) return undefined;
    return <Sparkline data={collectedTrendData} token="success" height={40} />;
  }, [collectedTrendData]);

  const financialMiniData = financialMonth
    ? [
        {
          label: "Mes",
          budgeted: financialMonth.budgeted_cost,
          actual: financialMonth.actual_cost,
        },
      ]
    : [];

  const fleetUtilizationSubtitle =
    vehicles != null
      ? dashboardCopy.metrics.fleetUtilization.subtitle(
          vehicles.available,
          vehicles.in_maintenance,
        )
      : undefined;

  return (
    <div className="space-y-4">
      <MetricTrendCard
        title={dashboardCopy.metrics.baseRate.title}
        subtitle={dashboardCopy.metrics.baseRate.subtitle}
        value={
          financialMonth
            ? formatMxCurrencyWhole(financialMonth.actual_revenue)
            : "—"
        }
        trend={activitySparkline}
        tone="primary"
        isLoading={isLoading || tripsByDayLoading}
        onClick={showFinance ? () => navigate("/finance") : undefined}
      />

      {showFinance ? (
        <MetricTrendCard
          title={dashboardCopy.metrics.collected.title}
          subtitle={dashboardCopy.metrics.collected.subtitle}
          value={
            financeSummary
              ? formatMxCurrencyWhole(financeSummary.collectedThisMonth)
              : "—"
          }
          trend={collectedSparkline}
          tone="success"
          isLoading={isLoading || financeLoading}
          onClick={() => navigate("/finance")}
        />
      ) : (
        <MetricTrendCard
          title={dashboardCopy.metrics.fleetUtilization.title}
          subtitle={fleetUtilizationSubtitle}
          value={
            vehicles
              ? dashboardCopy.operationsSnapshot.metrics.fleetOnTripValue(
                  vehicles.on_trip,
                  vehicles.total,
                )
              : "—"
          }
          trend={
            financialMiniData.length > 0 ? (
              <BoeltechBarChart
                data={financialMiniData}
                series={DASHBOARD_FINANCIAL_MINI_SERIES}
                height={40}
                showLegend={false}
              />
            ) : undefined
          }
          tone="info"
          isLoading={isLoading}
          onClick={() => navigate("/vehicles")}
        />
      )}
    </div>
  );
}
