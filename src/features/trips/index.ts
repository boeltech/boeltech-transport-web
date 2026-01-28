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
  type PaginatedList,
  type Pagination,

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
// APPLICATION - Use Cases (for custom implementations)
// ============================================================================
export type { CreateTripInput, FinishTripInput } from "./application";

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
} from "./application";

// ============================================================================
// PRESENTATION - UI Components
// ============================================================================
export {
  TripStatusBadge,
  TripStatusBadgeAnimated,
  TripCard,
  TripCardSkeleton,
  TripTable,
} from "./presentation";

// ============================================================================
// PRESENTATION - UI Helpers
// ============================================================================
export {
  TRIP_STATUS_CONFIG,
  STOP_TYPE_CONFIG,
  formatDisplayDate,
  formatShortDate,
  formatMileage,
  formatWeight,
  formatVolume,
  formatCurrency,
  formatDuration,
  getStatusConfig,
  getStopTypeConfig,
} from "./presentation";
