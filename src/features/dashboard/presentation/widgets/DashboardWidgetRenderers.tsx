import type { DashboardWidgetContext } from "./types";
import {
  buildFinanceAnalysisHref,
} from "@features/finance/application";
import {
  DashboardAlertsPanel,
  DashboardFinancialComparisonChart,
  DashboardFleetDriversCharts,
  DashboardMetricTrendCards,
  DashboardOperationsSnapshot,
  DashboardRecentTrips,
  DashboardTripsByDayChart,
  DashboardBranchKpisWidget,
  DashboardVehicleExpenseRanking,
} from "../components";

export function renderOperationsSnapshot(ctx: DashboardWidgetContext) {
  return (
    <DashboardOperationsSnapshot data={ctx.data} isLoading={ctx.isLoading} />
  );
}

export function renderMetricTrends(ctx: DashboardWidgetContext) {
  return (
    <DashboardMetricTrendCards
      data={ctx.data}
      isLoading={ctx.isLoading}
      navigate={ctx.navigate}
      fromHref={ctx.fromHref}
      financeLoading={ctx.financeLoading}
      financeSummary={ctx.financeSummary}
    />
  );
}

export function renderAlerts(ctx: DashboardWidgetContext) {
  return (
    <DashboardAlertsPanel
      alerts={ctx.data?.alerts}
      isLoading={ctx.isLoading}
      isError={ctx.isError}
      onRetry={ctx.onRetry}
      navigate={ctx.navigate}
      fromHref={ctx.fromHref}
    />
  );
}

export function renderRecentTrips(ctx: DashboardWidgetContext) {
  return (
    <DashboardRecentTrips
      trips={ctx.data?.recent_trips}
      isLoading={ctx.isLoading}
      navigate={ctx.navigate}
      fromHref={ctx.fromHref}
    />
  );
}

export function renderFleetDrivers(ctx: DashboardWidgetContext) {
  return (
    <DashboardFleetDriversCharts data={ctx.data} isLoading={ctx.isLoading} />
  );
}

export function renderTripsByDay(ctx: DashboardWidgetContext) {
  return (
    <DashboardTripsByDayChart
      tripsByDay={ctx.tripsByDay}
      isLoading={ctx.isLoading || ctx.tripsByDayLoading}
      days={ctx.tripsDays}
      onDaysChange={ctx.setTripsDays}
    />
  );
}

export function renderFinancialComparison(ctx: DashboardWidgetContext) {
  return (
    <DashboardFinancialComparisonChart
      financialMonth={ctx.data?.stats.financial_month}
      isLoading={ctx.isLoading}
      trend={ctx.financialTrend}
      trendLoading={ctx.financialTrendLoading}
      months={ctx.financialTrendMonths}
      onMonthsChange={ctx.setFinancialTrendMonths}
      fromHref={ctx.fromHref}
    />
  );
}

export function renderVehicleExpenseRanking(ctx: DashboardWidgetContext) {
  return (
    <DashboardVehicleExpenseRanking
      rows={ctx.vehicleExpenseRanking}
      isLoading={ctx.vehicleExpenseRankingLoading}
      onViewAnalysis={() =>
        ctx.navigate(buildFinanceAnalysisHref("expenses"), {
          state: { from: ctx.fromHref },
        })
      }
      onViewVehicle={(vehicleId) =>
        ctx.navigate(`/vehicles/${vehicleId}`, {
          state: { from: ctx.fromHref },
        })
      }
    />
  );
}

export function renderBranchKpis(ctx: DashboardWidgetContext) {
  return (
    <DashboardBranchKpisWidget
      showFinance={ctx.showFinance}
      navigate={ctx.navigate}
      fromHref={ctx.fromHref}
      initialCompareBranchIds={ctx.compareBranchIds}
    />
  );
}
