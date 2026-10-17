/**
 * Dashboard Module - Public API
 *
 * Exporta solo lo necesario para usar el módulo desde fuera.
 */

// Types
export type {
  ActivationData,
  ActivationItem,
  ActivationItemCode,
  ActivationOpsLevel,
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

export {
  resolveActivationEmptyGuidance,
  resolveActivationChecklistMode,
} from "./domain/activation";

// Hooks
export {
  useDashboard,
  dashboardQueryKeys,
} from "./application/hooks/useDashboard";
export { useDashboardActivation } from "./application/hooks/useDashboardActivation";
export {
  useApplyDemoSeed,
  useDemoSeedStatus,
  usePurgeDemoSeed,
} from "./application/hooks/useDemoSeed";
export { useTripsByDay } from "./application/hooks/useTripsByDay";
export { useFinancialTrend } from "./application/hooks/useFinancialTrend";
export { useDashboardLayout } from "./application/hooks/useDashboardLayout";

export type {
  DashboardLayout,
  DashboardWidgetPref,
  WidgetId,
} from "./domain/layout";

export type {
  DemoSeedApplyResult,
  DemoSeedPurgeResult,
  DemoSeedStatus,
} from "./domain/types";
export { DEMO_OPS_PACK, DEMO_PURGE_CONFIRM } from "./domain/types";

// Presentation
export { DashboardCustomizePanel } from "./presentation/components/DashboardCustomizePanel";
export { DemoDataBanner } from "./presentation/components/DemoDataBanner";

// Pages
export { default as DashboardPage } from "./presentation/DashboardPage";
