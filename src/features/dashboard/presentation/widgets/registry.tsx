/* eslint-disable react-refresh/only-export-components */
/**
 * Dashboard widget registry — ids, layout metadata, gates and render.
 */

import type { ReactNode } from "react";
import {
  SYSTEM_DEFAULT_WIDGET_DEFS,
  WIDGET_SPAN_CLASS,
  type DashboardWidgetGateContext,
  type WidgetId,
  type WidgetSpan,
} from "../../domain/layout";
import type { DashboardWidgetContext } from "./types";
import {
  renderAlerts,
  renderFinancialComparison,
  renderFinancialTrend,
  renderFleetDrivers,
  renderMetricTrends,
  renderOperationsSnapshot,
  renderRecentTrips,
  renderTripsByDay,
  renderBranchKpis,
  renderVehicleExpenseRanking,
} from "./DashboardWidgetParts";

export interface DashboardWidgetRegistryEntry {
  id: WidgetId;
  title: string;
  span: WidgetSpan;
  defaultVisible: boolean;
  defaultOrder: number;
  gate: (ctx: DashboardWidgetGateContext) => boolean;
  render: (ctx: DashboardWidgetContext) => ReactNode;
}

const RENDER_BY_ID: Record<
  WidgetId,
  (ctx: DashboardWidgetContext) => ReactNode
> = {
  operations_snapshot: renderOperationsSnapshot,
  metric_trends: renderMetricTrends,
  alerts: renderAlerts,
  recent_trips: renderRecentTrips,
  fleet_drivers: renderFleetDrivers,
  trips_by_day: renderTripsByDay,
  financial_comparison: renderFinancialComparison,
  financial_trend: renderFinancialTrend,
  vehicle_expense_ranking: renderVehicleExpenseRanking,
  branch_kpis: renderBranchKpis,
};

export const DASHBOARD_WIDGETS: DashboardWidgetRegistryEntry[] =
  SYSTEM_DEFAULT_WIDGET_DEFS.map((def) => ({
    ...def,
    render: RENDER_BY_ID[def.id],
  }));

export function getWidgetRegistryEntry(
  id: WidgetId,
): DashboardWidgetRegistryEntry | undefined {
  return DASHBOARD_WIDGETS.find((w) => w.id === id);
}

export function getWidgetSpanClass(span: WidgetSpan): string {
  return WIDGET_SPAN_CLASS[span];
}

export function getWidgetTitle(id: WidgetId): string {
  return getWidgetRegistryEntry(id)?.title ?? id;
}
