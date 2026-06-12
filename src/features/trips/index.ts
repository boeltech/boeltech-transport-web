/**
 * Trips Feature - Public API
 * Feature-Sliced Design + Clean Architecture
 *
 * Este es el punto de entrada del feature.
 * Solo exporta lo que otros módulos necesitan consumir.
 *
 * ============================================================================
 * ESTRUCTURA CLEAN ARCHITECTURE:
 * ============================================================================
 *
 * domain/          → Entidades, reglas de negocio, interfaces
 * application/     → Casos de uso (orquestan la lógica)
 * infrastructure/  → Implementaciones (API, repositorios, React Query)
 * presentation/    → Componentes UI del feature
 *
 * ============================================================================
 * ORDEN DE PROVIDERS REQUERIDO:
 * ============================================================================
 *
 * App.tsx (global): Query → Theme → Toast → Router
 * AppLayout (autenticado): Auth → ProductOnboardingGate → Permission →
 *   Tooltip → Sidebar → LayoutShell
 *
 */

// ============================================================================
// DOMAIN - Entities & Types
// ============================================================================
export {
  // Entities
  type Trip,
  type TripStop,
  type VehicleRef,
  type DriverRef,
  type ClientRef,
  type TripFilters,
  type TripQueryParams,

  // Enums
  TripStatus,
  TRIP_STATUS_LABELS,
  StopType,
  type TripStatusType,
  type StopTypeValue,
} from "./domain";

// ============================================================================
// DOMAIN - Business Rules
// ============================================================================
export {
  canTransitionTo,
  getAvailableTransitions,
  canEditTrip,
  canManageTripExpenses,
  canDeleteTrip,
  canStartTrip,
  canCancelTrip,
  calculateDistance,
  calculateTripDuration,
} from "./domain";

// ============================================================================
// APPLICATION - React Query Hooks
// ============================================================================
export {
  useTrips,
  useTrip,
  useCreateTrip,
  useUpdateTrip,
  useUpdateTripStatus,
  useStartTrip,
  useCancelTrip,
  useDeleteTrip,
  useRegisterTrackingEvent,
  useTripTimeline,
  useTripCargos,
  useTripExpenses,
  useTripExpensesSummary,
  useUpdateCargo,
  TripCreationError,
} from "./application";

// ============================================================================
// PRESENTATION
// ============================================================================

//Pages
export {
  FinishTripRedirect,
  TripDetailPage,
  TripFormPage,
  TripsListPage,
} from "./presentation";

// Components
export {
  BasicInfoStep,
  CargoStep,
  CostsStep,
  RouteStep,
  SummaryStep,
  TripActions,
  TripCard,
  TripCardSkeleton,
  TripListRouteLabel,
  TripTrackingMap,
  TripTrackingTab,
  TripStatusBadge,
  TripTable,
  WizardSteps,
} from "./presentation";

// Config
export {
  STOP_STATUS_CONFIG,
  STOP_TYPE_CONFIG,
  TRIP_STATUS_CONFIG,
  WIZARD_STEPS,
} from "./presentation";

// Helpers
export {
  type TripCargoFormValues,
  type TripExpenseFormValues,
  type TripStopFormValues,
  type TripWizardFormValues,
  // type WizardStepDefinition,
  type WizardStep,
  capitalize,
  defaultWizardFormValues,
  formatAddress,
  formatCurrency,
  formatStopDisplayLocalityLine,
  formatStopDisplayPrimaryLine,
  formatStopDisplayStreetLine,
  formatDuration,
  formatMileage,
  formatNumber,
  formatPercent,
  formatRoute,
  formatTripEndpointLabel,
  formatTripRouteSubtitle,
  formatVolume,
  formatWeight,
  getStopStatusConfig,
  getStopTypeConfig,
  getTripInvoicingBadgeConfig,
  getTripInvoicingBlockReason,
  getTripStatusConfig,
  getTripStatusLabel,
  tripCargoSchema,
  tripExpenseSchema,
  tripStopSchema,
  // tripWizardFormSchema,
  truncateText,
} from "./presentation";
