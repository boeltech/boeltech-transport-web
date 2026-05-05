/**
 * Client Config - Barrel Exports
 * Clean Architecture - Presentation Layer
 *
 * Exporta configuración de UI del módulo.
 *
 * Ubicación: src/features/clients/presentation/config/index.ts
 */

export {
  ClientStatusBadge,
  operationalStatusFromClient,
  type ClientOperationalStatus,
} from "./clientStatusConfig";
export {
  // Type configs
  CLIENT_TYPE_CONFIG,
  PAYMENT_TERMS_CONFIG,
  ADDRESS_TYPE_CONFIG,
  CLIENT_STATUS_CONFIG,
  // Filter options
  CLIENT_TYPE_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  STATUS_OPTIONS,
  ADDRESS_TYPE_OPTIONS,
  // Table config
  //   DEFAULT_SORT_BY,
  //   DEFAULT_SORT_ORDER,
  //   DEFAULT_PAGE_SIZE,
  //   PAGE_SIZE_OPTIONS,
  // Helper functions
  getClientTypeConfig,
  getPaymentTermsConfig,
  getAddressTypeConfig,
  getStatusConfig,
  // Types
  type ClientTypeConfig,
  type PaymentTermsConfig,
  type AddressTypeConfig,
  type StatusConfig,
} from "./clientConfig";
