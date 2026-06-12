/**
 * Dashboard Module - Public API
 *
 * Exporta solo lo necesario para usar el módulo desde fuera.
 */

// Types
export type {
  DashboardData,
  DashboardStats,
  DashboardAlert,
  RecentTrip,
  AlertType,
  AlertSeverity,
  TripsByDayData,
  TripsByDayPoint,
  FinancialMonth,
  FinancialTrendData,
} from "./domain/types";

// Hooks
export {
  useDashboard,
  dashboardQueryKeys,
} from "./application/hooks/useDashboard";
export { useTripsByDay } from "./application/hooks/useTripsByDay";
export { useFinancialTrend } from "./application/hooks/useFinancialTrend";
export { useDashboardLayout } from "./application/hooks/useDashboardLayout";

export type {
  DashboardLayout,
  DashboardWidgetPref,
  WidgetId,
} from "./domain/layout";

// Presentation
export { DashboardCustomizePanel } from "./presentation/components/DashboardCustomizePanel";

// Pages
export { default as DashboardPage } from "./presentation/DashboardPage";
