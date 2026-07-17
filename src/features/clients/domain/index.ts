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
  ClientContact,
  ClientSummary,
  ClientCreditSummary,
  ClientCreditSummaryBreakdown,
  CreditExposureStatus,
  ClientTripHistoryItem,
  ClientTripHistoryFilters,
} from "./entities";

// Constants & Labels
export {
  CLIENT_TYPE_LABELS,
  PAYMENT_TERMS_LABELS,
  ADDRESS_TYPE_LABELS,
  ADDRESS_TYPE_VARIANTS,
  CLIENT_WIZARD_STEPS,
  CLIENT_CONTACT_ROLE_LABELS,
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
  CreateClientContactDTO,
  UpdateClientContactDTO,
  // Wizard DTOs
  CreateClientWithAddressDTO,
  CreateClientResult,
  // Repository Interfaces
  IClientRepository,
  IClientAddressRepository,
  IClientContactRepository,
  IClientHistoryRepository,
  // API Response Types
  ClientListItemApiResponse,
  ClientApiResponse,
  ClientAddressApiResponse,
  ClientContactApiResponse,
  ClientSummaryApiResponse,
  ClientCreditSummaryApiResponse,
  ClientTripHistoryItemApiResponse,
  ClientAddressCartaPorteApiResponse,
  CreateClientApiResponse,
  UpdateClientApiResponse,
} from "./repository";
