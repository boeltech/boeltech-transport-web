/**
 * Clients Feature Module - Main Barrel Export
 * Clean Architecture - Feature Module
 *
 * Exporta todos los elementos públicos del módulo de clientes.
 *
 * USO:
 * ```typescript
 * // Domain types
 * import { Client, ClientAddress, clientQueryKeys } from "@features/clients";
 *
 * // Hooks
 * import { useClient, useClients, useCreateClient } from "@features/clients";
 *
 * // Components
 * import { ClientTable, ClientCard, ClientForm } from "@features/clients";
 *
 * // Pages
 * import { ClientsListPage, ClientDetailPage } from "@features/clients";
 * ```
 *
 * Ubicación: src/features/clients/index.ts
 */

// ============================================================================
// DOMAIN EXPORTS
// ============================================================================

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
  // DTOs
  CreateClientDTO,
  UpdateClientDTO,
  CreateClientAddressDTO,
  UpdateClientAddressDTO,
  CreateClientWithAddressDTO,
  CreateClientResult,
  // Pagination
  PaginationParams,
  PaginatedResult,
  ClientFilters,
} from "./domain";

export {
  // Constants
  CLIENT_TYPE_LABELS,
  PAYMENT_TERMS_LABELS,
  ADDRESS_TYPE_LABELS,
  ADDRESS_TYPE_VARIANTS,
  TAX_REGIME_OPTIONS,
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
} from "./domain";

// ============================================================================
// APPLICATION EXPORTS (Hooks)
// ============================================================================

export {
  // Client hooks
  useClient,
  useClients,
  useActiveClients,
  useCreateClient,
  useUpdateClient,
  useActivateClient,
  useDeactivateClient,
  useDeleteClient,
  // Address hooks
  useClientAddresses,
  useClientAddress,
  useClientBillingAddress,
  useCreateClientAddress,
  useUpdateClientAddress,
  useDeleteClientAddress,
} from "./application";

// ============================================================================
// PRESENTATION EXPORTS
// ============================================================================

// Components
export {
  ClientTable,
  ClientCard,
  ClientCardSkeleton,
  ClientForm,
  ClientActions,
  ClientAddressCard,
  ClientAddressForm,
  ClientAddressSection,
} from "./presentation";

// Pages
export {
  ClientsListPage,
  ClientDetailPage,
  ClientCreatePage,
  ClientEditPage,
} from "./presentation";

// Validation schemas
export {
  clientFormSchema,
  defaultClientFormValues,
  clientAddressFormSchema,
  billingAddressFormSchema,
  defaultClientAddressFormValues,
  defaultBillingAddressFormValues,
} from "./presentation";

export type {
  ClientFormData,
  ClientAddressFormData,
  BillingAddressFormData,
} from "./presentation";

// Config
export {
  CLIENT_TYPE_CONFIG,
  PAYMENT_TERMS_CONFIG,
  ADDRESS_TYPE_CONFIG,
  CLIENT_STATUS_CONFIG,
  getClientTypeConfig,
  getPaymentTermsConfig,
  getAddressTypeConfig,
  getStatusConfig,
} from "./presentation";
