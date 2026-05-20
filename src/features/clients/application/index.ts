/**
 * Client Application - Barrel Exports
 * Clean Architecture - Application Layer
 *
 * Exporta use cases y hooks.
 *
 * Ubicación: src/features/clients/application/index.ts
 */

// ============================================================================
// USE CASES
// ============================================================================

export {
  getClientsUseCase,
  GetClientsUseCase,
} from "./useCases/GetClientsUseCase";
export {
  createClientUseCase,
  CreateClientUseCase,
  CreateClientAddressFailedError,
} from "./useCases/CreateClientUseCase";
export {
  updateClientUseCase,
  UpdateClientUseCase,
} from "./useCases/UpdateClientUseCase";

// ============================================================================
// CLIENT HOOKS
// ============================================================================

export { useClient } from "./hooks/useClient";
export { useClients, useActiveClients } from "./hooks/useClients";
export { useCreateClient } from "./hooks/useCreateClient";
export {
  useUpdateClient,
  useActivateClient,
  useDeactivateClient,
} from "./hooks/useUpdateClient";
export { useDeleteClient } from "./hooks/useDeleteClient";

// ============================================================================
// CLIENT ADDRESS HOOKS
// ============================================================================

export {
  useClientAddresses,
  useClientAddress,
  useClientBillingAddress,
} from "./hooks/useClientAddresses";
export { useCreateClientAddress } from "./hooks/useCreateClientAddress";
export { useUpdateClientAddress } from "./hooks/useUpdateClientAddress";
export { useDeleteClientAddress } from "./hooks/useDeleteClientAddress";
export { useSetPrimaryClientAddress } from "./hooks/useSetPrimaryClientAddress";

