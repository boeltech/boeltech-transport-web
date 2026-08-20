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
  InvoiceableTripPickerSheet,
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
export { TripEditRedirect } from "./pages/TripEditRedirect";
export { TripDetailPage } from "./pages/TripDetailPage";
export { TripCanvasPage } from "./pages/create/TripCanvasPage";
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
  canvasCopy,
  expenseCopy,
  fiscalCopy,
  summaryCopy,
  LOCATION_CAPTURE_LABELS,
  ROUTE_CAPTURE_LABELS,
} from "./copy";
export type { CopyAcc, TrackingCopyAcc } from "./copy";
export * from "./uiHelpers";
