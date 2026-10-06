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

export const DASHBOARD_FINANCIAL_TREND_SERIES: ChartSeries[] = [
  {
    dataKey: "actualRevenue",
    label: dashboardCopy.financialComparison.series.actualRevenue,
    token: "chart-1",
  },
  {
    dataKey: "actualCost",
    label: dashboardCopy.financialComparison.series.actualCost,
    token: "chart-3",
  },
];
