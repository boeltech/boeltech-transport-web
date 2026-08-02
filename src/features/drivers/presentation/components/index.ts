/**
 * Driver Presentation Layer - Components Barrel Export
 * Clean Architecture - Presentation Layer
 *
 * Exporta todos los componentes del módulo de conductores.
 *
 * Ubicación: src/features/drivers/presentation/components/index.ts
 */

// Table Components
export { DriverTable } from "./DriverTable";

// Card Components
export { DriverCard } from "./DriverCard";
export { DriverCardSkeleton } from "./DriverCardSkeleton";

// Action Components
export { DriverActions } from "./DriverActions";
export { DriverDetailDocumentsTab } from "./DriverDetailDocumentsTab";
export { DriverDetailDriverTab } from "./DriverDetailDriverTab";
export { DriverDetailTripsTab } from "./DriverDetailTripsTab";
export { DriverForm, type DriverFormRef } from "./DriverForm";
