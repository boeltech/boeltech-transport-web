/**
 * Presentation Layer - Public API
 * Clean Architecture
 */

// UI Components
export {
  TripCard,
  TripCardSkeleton,
  TripActions,
  TripTable,
} from "./components";

// Config
export {
  TRIP_STATUS_CONFIG,
  TripStatusBadge,
  getTripStatusConfig,
  getTripStatusLabel,
} from "./config/tripStatusConfig";

// Pages
export { TripFormPage } from "./pages/create/TripFormPage";
export {
  BasicInfoStep,
  CargoStep,
  CostsStep,
  RouteStep,
  SummaryStep,
  type TripCargoFormValues,
  type TripExpenseFormValues,
  type TripStopFormValues,
  type TripWizardFormValues,
  WIZARD_STEPS,
  type WizardStep,
  type WizardStepDefinition,
  WizardSteps,
  defaultWizardFormValues,
  tripCargoSchema,
  tripExpenseSchema,
  tripStopSchema,
  tripWizardFormSchema,
} from "./pages/create/components";
export { FinishTripPage } from "./pages/FinishTripPage";
export { TripDetailPage } from "./pages/TripDetailPage";
export { TripsListPage } from "./pages/TripsListPage";

// UI Helpers & Constants
export * from "./uiHelpers";
