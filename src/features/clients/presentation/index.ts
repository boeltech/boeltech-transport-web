/**
 * Client Presentation - Barrel Exports
 * Clean Architecture - Presentation Layer
 *
 * Exporta componentes, páginas, validación y configuración.
 *
 * Ubicación: src/features/clients/presentation/index.ts
 */

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
} from "./components";

// Pages
export {
  ClientsListPage,
  ClientDetailPage,
  ClientCreatePage,
  ClientEditPage,
} from "./pages";

// Validation
export {
  clientFormSchema,
  defaultClientFormValues,
  type ClientFormData,
} from "./validation/clientSchema";

export {
  clientAddressFormSchema,
  billingAddressFormSchema,
  defaultClientAddressFormValues,
  defaultBillingAddressFormValues,
  type ClientAddressFormData,
  type BillingAddressFormData,
} from "./validation/clientAddressSchema";

// Config
export {
  CLIENT_TYPE_CONFIG,
  PAYMENT_TERMS_CONFIG,
  ADDRESS_TYPE_CONFIG,
  CLIENT_STATUS_CONFIG,
  CLIENT_TYPE_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  STATUS_OPTIONS,
  ADDRESS_TYPE_OPTIONS,
  //   DEFAULT_SORT_BY,
  //   DEFAULT_SORT_ORDER,
  //   DEFAULT_PAGE_SIZE,
  //   PAGE_SIZE_OPTIONS,
  getClientTypeConfig,
  getPaymentTermsConfig,
  getAddressTypeConfig,
  getStatusConfig,
} from "./config/clientConfig";
