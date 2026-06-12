import type { ChartSeries } from "@shared/ui/data-display";
import { dashboardCopy } from "../copy/dashboardCopy";

export const DASHBOARD_TRIPS_BY_DAY_SERIES: ChartSeries[] = [
  {
    dataKey: "completed",
    label: dashboardCopy.charts.tripsByDay.series.completed,
    token: "success",
  },
  {
    dataKey: "cancelled",
    label: dashboardCopy.charts.tripsByDay.series.cancelled,
    token: "destructive",
  },
  {
    dataKey: "inProgress",
    label: dashboardCopy.charts.tripsByDay.series.inProgress,
    token: "info",
  },
];

export const DASHBOARD_FLEET_STATUS_SERIES: ChartSeries[] = [
  {
    dataKey: "value",
    label: dashboardCopy.charts.fleet.series.onTrip,
    token: "info",
  },
  {
    dataKey: "value",
    label: dashboardCopy.charts.fleet.series.available,
    token: "success",
  },
  {
    dataKey: "value",
    label: dashboardCopy.charts.fleet.series.maintenance,
    token: "warning",
  },
];

export const DASHBOARD_DRIVER_STATUS_SERIES: ChartSeries[] = [
  {
    dataKey: "value",
    label: dashboardCopy.charts.drivers.series.available,
    token: "success",
  },
  {
    dataKey: "value",
    label: dashboardCopy.charts.drivers.series.onTrip,
    token: "info",
  },
  {
    dataKey: "value",
    label: dashboardCopy.charts.drivers.series.absent,
    token: "warning",
  },
];

export const DASHBOARD_FINANCIAL_MINI_SERIES: ChartSeries[] = [
  {
    dataKey: "budgeted",
    label: dashboardCopy.financialComparison.series.budgeted,
    token: "chart-2",
  },
  {
    dataKey: "actual",
    label: dashboardCopy.financialComparison.series.actual,
    token: "chart-1",
  },
];

export const DASHBOARD_FINANCIAL_COMPARISON_SERIES: ChartSeries[] = [
  {
    dataKey: "budgeted",
    label: dashboardCopy.financialComparison.series.budgeted,
    token: "chart-2",
  },
  {
    dataKey: "actual",
    label: dashboardCopy.financialComparison.series.actual,
    token: "chart-1",
  },
];

export const DASHBOARD_FINANCIAL_TREND_SERIES: ChartSeries[] = [
  {
    dataKey: "budgetedRevenue",
    label: dashboardCopy.charts.financialTrend.series.budgetedRevenue,
    token: "chart-2",
  },
  {
    dataKey: "actualRevenue",
    label: dashboardCopy.charts.financialTrend.series.actualRevenue,
    token: "chart-1",
  },
  {
    dataKey: "budgetedCost",
    label: dashboardCopy.charts.financialTrend.series.budgetedCost,
    token: "chart-5",
  },
  {
    dataKey: "actualCost",
    label: dashboardCopy.charts.financialTrend.series.actualCost,
    token: "chart-3",
  },
];
