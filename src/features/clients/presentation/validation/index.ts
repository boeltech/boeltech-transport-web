/**
 * Client Validation - Barrel Exports
 * Clean Architecture - Presentation Layer
 *
 * Exporta schemas Zod y tipos de validación.
 *
 * Ubicación: src/features/clients/presentation/validation/index.ts
 */

// Client Form Schema
export {
  clientFormSchema,
  updateClientFormSchema,
  defaultClientFormValues,
  clientToFormValues,
  clientFormDataToUpdateDto,
  type ClientFormData,
  type UpdateClientFormData,
} from "./clientSchema";

// Client Address Form Schema
export {
  additionalAddressFormSchema,
  billingAddressFormSchema,
  updateClientAddressFormSchema,
  defaultClientAddressFormValues,
  defaultBillingAddressFormValues,
  applyClientAddressFormContext,
  clientAddressFormDataToCreateDto,
  clientAddressFormDataToUpdateDto,
  validateClientAddressFormComplete,
  mapValidationErrorsToRHF,
  CLIENT_ADDRESS_TYPES,
  type ClientAddressFormData,
  type BillingAddressFormData,
  type UpdateClientAddressFormData,
  type ClientAddressTypeValue,
} from "./clientAddressSchema";

export {
  clientContactFormSchema,
  defaultClientContactFormValues,
  clientContactToFormValues,
  clientContactFormDataToCreateDto,
  clientContactFormDataToUpdateDto,
  type ClientContactFormData,
} from "./clientContactSchema";
