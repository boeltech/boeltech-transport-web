/**
 * Driver Presentation Layer - Main Barrel Export
 * Clean Architecture - Presentation Layer
 *
 * Exporta todo el módulo de presentación de conductores.
 *
 * Ubicación: src/features/drivers/presentation/index.ts
 */

// Components
export {
  DriverTable,
  DriverCard,
  DriverCardSkeleton,
  DriverActions,
  DriverForm,
} from "./components";

// Pages
export {
  DriversListPage,
  DriverDetailPage,
  DriverCreatePage,
  DriverEditPage,
} from "./pages";

// Config
export {
  DRIVER_STATUS_CONFIG,
  DriverStatusBadge,
  getDriverStatusConfig,
  getDriverStatusLabel,
  getDaysUntilLicenseExpiration,
  getLicenseExpirationVariant,
  formatDriverName,
} from "./config/driverStatusConfig";

// Validation
export {
  driverSchema,
  type DriverFormData,
  defaultDriverFormValues,
  MEXICAN_STATES,
} from "./validation";
