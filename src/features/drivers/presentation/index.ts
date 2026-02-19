/**
 * Driver Presentation Layer - Public API
 * Clean Architecture - Presentation Layer
 */

// Components
export {
  DriverStatusBadge,
  DriverCard,
  DriverCardSkeleton,
  DriverTable,
  DriverActions,
} from "./components";

// Pages
export { DriversListPage } from "./pages";

// Config
export {
  DRIVER_STATUS_CONFIG,
  getDriverStatusConfig,
  getDaysUntilLicenseExpiration,
  getLicenseExpirationVariant,
  formatDriverName,
} from "./config";

// Utils
export { generatePageNumbers } from "./utils";
