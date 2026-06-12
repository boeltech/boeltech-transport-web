/**
 * Presentation Layer - Public API
 * Clean Architecture
 */

// UI Components
export {
  TripCard,
  TripCardSkeleton,
  TripActions,
  TripInvoiceActions,
  TripListRouteLabel,
  TripTrackingMap,
  TripTrackingTab,
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
  // type WizardStepDefinition,
  WizardSteps,
  defaultWizardFormValues,
  tripCargoSchema,
  tripExpenseSchema,
  tripStopSchema,
  // tripWizardFormSchema,
} from "./pages/create/components";
export { FinishTripRedirect } from "./pages/FinishTripRedirect";
export { TripDetailPage } from "./pages/TripDetailPage";
export { TripsListPage } from "./pages/TripsListPage";

// Copy (ACC)
export {
  formatAccLine,
  tripDetailCopy,
  trackingCopy,
  operationCopy,
  routeCopy,
  cargoCopy,
  costsCopy,
  historyCopy,
  shellCopy,
  wizardCopy,
  expenseCopy,
  fiscalCopy,
  summaryCopy,
  LOCATION_CAPTURE_LABELS,
  ROUTE_CAPTURE_LABELS,
} from "./copy";
export type { CopyAcc, TrackingCopyAcc } from "./copy";
export * from "./uiHelpers";
