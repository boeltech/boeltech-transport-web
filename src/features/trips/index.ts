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
 * 1. QueryProvider    - React Query
 * 2. AuthProvider     - Autenticación JWT
 * 3. PermissionProvider - RBAC
 * 4. ThemeProvider    - Dark/Light mode
 * 5. ToastProvider    - Notificaciones
 * 6. SidebarProvider  - Estado sidebar
 * 7. LayoutShell      - UI Layout
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
  canDeleteTrip,
  canStartTrip,
  canFinishTrip,
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
  useTripStops,
  useCreateTrip,
  useUpdateTrip,
  useUpdateTripStatus,
  useStartTrip,
  useFinishTrip,
  useCancelTrip,
  useDeleteTrip,
  useAddStop,
  useMarkStopVisited,
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
  FinishTripPage,
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
  formatDuration,
  formatMileage,
  formatNumber,
  formatPercent,
  formatRoute,
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
