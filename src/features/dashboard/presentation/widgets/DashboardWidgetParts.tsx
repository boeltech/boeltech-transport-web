/**
 * Dashboard widget renderers — thin adapters for the widget registry.
 */

export { handleAlertClick } from "../utils/alertNavigation";
export {
  renderAlerts,
  renderFinancialComparison,
  renderFinancialTrend,
  renderFleetDrivers,
  renderMetricTrends,
  renderOperationsSnapshot,
  renderRecentTrips,
  renderTripsByDay,
} from "./DashboardWidgetRenderers";
