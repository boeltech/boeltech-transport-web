/**
 * Client Infrastructure - Barrel Exports
 * Clean Architecture - Infrastructure Layer
 *
 * Exporta repositorios y mappers.
 *
 * Ubicación: src/features/clients/infrastructure/index.ts
 */

// Repositories
export { clientRepository } from "./ClientRepository";
export { clientAddressRepository } from "./ClientAddressRepository";

// Mappers
export {
  // Client mappers
  mapClient,
  mapClientListItem,
  mapPaginatedClients,
  toApiCreateClient,
  toApiUpdateClient,
  // Address mappers
  mapClientAddress,
  mapClientAddressListItem,
  mapClientAddresses,
  toApiCreateClientAddress,
  toApiUpdateClientAddress,
} from "./mappers";
