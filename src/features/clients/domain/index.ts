/**
 * Client Domain - Barrel Exports
 * Clean Architecture - Domain Layer
 *
 * Exporta todas las entidades, tipos, interfaces y constantes del dominio.
 *
 * Ubicación: src/features/clients/domain/index.ts
 */

// Entities & Types
export type {
  // Client types
  Client,
  ClientListItem,
  ClientOption,
  ClientType,
  PaymentTerms,
  // Address types
  ClientAddress,
  ClientAddressListItem,
  AddressType,
  // Wizard
  ClientWizardStep,
} from "./entities";

// Constants & Labels
export {
  CLIENT_TYPE_LABELS,
  PAYMENT_TERMS_LABELS,
  ADDRESS_TYPE_LABELS,
  ADDRESS_TYPE_VARIANTS,
  CLIENT_WIZARD_STEPS,
  // Query Keys
  clientQueryKeys,
  // Type Guards
  isClientType,
  isPaymentTerms,
  isAddressType,
  // Utility Functions
  getClientDisplayName,
  formatClientAddress,
  isCartaPorteReady,
  getCartaPorteMissingFields,
} from "./entities";

// Repository interfaces & DTOs
export type {
  // Pagination
  PaginationParams,
  PaginatedResult,
  // Filters
  ClientFilters,
  // Client DTOs
  CreateClientDTO,
  UpdateClientDTO,
  // Address DTOs
  CreateClientAddressDTO,
  UpdateClientAddressDTO,
  // Wizard DTOs
  CreateClientWithAddressDTO,
  CreateClientResult,
  // Repository Interfaces
  IClientRepository,
  IClientAddressRepository,
  // API Response Types
  ClientListItemApiResponse,
  ClientApiResponse,
  ClientAddressApiResponse,
  ClientAddressCartaPorteApiResponse,
  CreateClientApiResponse,
  UpdateClientApiResponse,
} from "./repository";
