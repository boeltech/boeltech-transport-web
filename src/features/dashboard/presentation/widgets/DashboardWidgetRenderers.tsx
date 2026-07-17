import type { DashboardWidgetContext } from "./types";
import {
  DashboardAlertsPanel,
  DashboardFinancialComparisonChart,
  DashboardFinancialTrendChart,
  DashboardFleetDriversCharts,
  DashboardMetricTrendCards,
  DashboardOperationsSnapshot,
  DashboardRecentTrips,
  DashboardTripsByDayChart,
  DashboardBranchKpisWidget,
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
      tripsByDay={ctx.tripsByDay}
      tripsByDayLoading={ctx.tripsByDayLoading}
      showFinance={ctx.showFinance}
      financeLoading={ctx.financeLoading}
      collectedTrendData={ctx.collectedTrendData}
      financeSummary={ctx.financeSummary}
    />
  );
}

export function renderAlerts(ctx: DashboardWidgetContext) {
  return (
    <DashboardAlertsPanel
      alerts={ctx.data?.alerts}
      isLoading={ctx.isLoading}
      navigate={ctx.navigate}
    />
  );
}

export function renderRecentTrips(ctx: DashboardWidgetContext) {
  return (
    <DashboardRecentTrips
      trips={ctx.data?.recent_trips}
      isLoading={ctx.isLoading}
      navigate={ctx.navigate}
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
    />
  );
}

export function renderFinancialTrend(ctx: DashboardWidgetContext) {
  return (
    <DashboardFinancialTrendChart
      trend={ctx.financialTrend}
      isLoading={ctx.financialTrendLoading}
      months={ctx.financialTrendMonths}
      onMonthsChange={ctx.setFinancialTrendMonths}
    />
  );
}

export function renderBranchKpis(ctx: DashboardWidgetContext) {
  return (
    <DashboardBranchKpisWidget
      showFinance={ctx.showFinance}
      navigate={ctx.navigate}
      initialCompareBranchIds={ctx.compareBranchIds}
    />
  );
}
