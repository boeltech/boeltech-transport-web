/**
 * Client Components - Barrel Exports
 * Clean Architecture - Presentation Layer
 *
 * Exporta todos los componentes del módulo de clientes.
 *
 * Ubicación: src/features/clients/presentation/components/index.ts
 */

// Client components
export { ClientTable } from "./ClientTable";
export { ClientCard } from "./ClientCard";
export { ClientCardSkeleton } from "./ClientCardSkeleton";
export { ClientForm } from "./ClientForm";
export { ClientActions } from "./ClientActions";

// Address components
export { ClientAddressCard } from "./ClientAddressCard";
export { ClientAddressForm } from "./ClientAddressForm";
export { ClientAddressSection } from "./ClientAddressSection";

// Types
export type { ClientFormProps } from "./ClientForm";
export type { ClientAddressFormProps } from "./ClientAddressForm";
