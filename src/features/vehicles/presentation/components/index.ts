/**
 * Vehicle Components - Barrel Export
 * Clean Architecture - Presentation Layer (Components)
 *
 * Exporta todos los componentes de presentación del módulo de vehículos.
 *
 * Ubicación: src/features/vehicles/presentation/components/index.ts
 */

// Table Components
export { VehicleTable } from "./VehicleTable";
export { VehicleListFilters } from "./VehicleListFilters";

// Card Components
export { VehicleCard } from "./VehicleCard";
export { VehicleCardSkeleton } from "./VehicleCardSkeleton";

// Shared Components
export { VehicleActions } from "./VehicleActions";
export { VehicleDeactivateDialog } from "./VehicleDeactivateDialog";
export { VehicleRestoreDialog } from "./VehicleRestoreDialog";
export type { VehicleLifecycleTarget } from "./vehicleLifecycleTarget";
export { VehicleDetailDocumentsTab } from "./VehicleDetailDocumentsTab";
export { VehicleDetailUnitTab } from "./VehicleDetailUnitTab";
export { VehicleFilters } from "./VehicleFilters";
export { VehicleForm, type VehicleFormRef } from "./VehicleForm";
