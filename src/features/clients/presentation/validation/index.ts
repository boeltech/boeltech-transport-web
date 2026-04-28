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
  //   isGenericRfc,
  //   isForeignRfc,
  //   validateRfcFormat,
  type ClientFormData,
  type UpdateClientFormData,
} from "./clientSchema";

// Client Address Form Schema
export {
  clientAddressFormSchema,
  billingAddressFormSchema,
  updateClientAddressFormSchema,
  defaultClientAddressFormValues,
  defaultBillingAddressFormValues,
  clientAddressFormDataToCreateDto,
  clientAddressFormDataToUpdateDto,
  type ClientAddressFormData,
  type BillingAddressFormData,
  type UpdateClientAddressFormData,
} from "./clientAddressSchema";
