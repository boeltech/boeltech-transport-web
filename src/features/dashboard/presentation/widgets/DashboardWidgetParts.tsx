/**
 * Dashboard widget renderers — thin adapters for the widget registry.
 */

export { handleAlertClick } from "../utils/alertNavigation";
export {
  renderAlerts,
  renderFinancialComparison,
  renderFleetDrivers,
  renderMetricTrends,
  renderOperationsSnapshot,
  renderRecentTrips,
  renderTripsByDay,
  renderBranchKpis,
  renderVehicleExpenseRanking,
} from "./DashboardWidgetRenderers";
