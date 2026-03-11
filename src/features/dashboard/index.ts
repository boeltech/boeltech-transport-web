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
} from "./domain/types";

// Hooks
export {
  useDashboard,
  dashboardQueryKeys,
} from "./application/hooks/useDashboard";

// Pages
export { default as DashboardPage } from "./presentation/DashboardPage";
