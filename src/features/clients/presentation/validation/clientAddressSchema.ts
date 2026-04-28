/**
 * Client Address Form Validation
 *
 * Fase 2: compone el contrato compartido `addressSchema` con campos extra de
 * cliente (Carta Porte / operación). Evita duplicar reglas SAT.
 */

import { z } from "zod";
import { addressSchema } from "@shared/validation/addressSchema";
import type { AddressType } from "../../domain/entities";
import type { CreateClientAddressDTO, UpdateClientAddressDTO } from "../../domain/repository";

// ============================================================================
// EXTRAS (no están en addressSchema)
// ============================================================================

const optionalTrimmed = (max: number) =>
  z.union([z.literal(""), z.string().max(max)]).optional();

const clientAddressExtras = z.object({
  locationName: optionalTrimmed(200),
  rfcRemitenteDestinatario: optionalTrimmed(13),
  nombreRemitenteDestinatario: optionalTrimmed(254),
  contactName: optionalTrimmed(200),
  contactPhone: optionalTrimmed(20),
  contactEmail: z.union([z.literal(""), z.string().email("Correo inválido")]).optional(),
  businessHours: optionalTrimmed(200),
  notes: optionalTrimmed(1000),
  specialInstructions: optionalTrimmed(1000),
});

// ============================================================================
// FORM SCHEMA
// ============================================================================

export const clientAddressFormSchema = addressSchema.merge(clientAddressExtras);

export const billingAddressFormSchema = clientAddressFormSchema.extend({
  addressType: z.literal("billing"),
  isPrimary: z.literal(true),
});

export type ClientAddressFormData = z.infer<typeof clientAddressFormSchema>;
export type BillingAddressFormData = z.infer<typeof billingAddressFormSchema>;

// ============================================================================
// DEFAULTS
// ============================================================================

export const defaultClientAddressFormValues: ClientAddressFormData = {
  addressType: "shipping",
  isPrimary: false,
  locationName: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: null,
  reference: null,
  postalCode: "",
  satCountryCode: "MEX",
  satStateCode: "",
  satMunicipalityCode: "",
  satLocalityCode: null,
  satNeighborhoodCode: null,
  neighborhoodName: null,
  latitude: null,
  longitude: null,
  rfcRemitenteDestinatario: "",
  nombreRemitenteDestinatario: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  businessHours: "",
  notes: "",
  specialInstructions: "",
};

export const defaultBillingAddressFormValues: BillingAddressFormData = {
  ...defaultClientAddressFormValues,
  addressType: "billing",
  isPrimary: true,
};

// ============================================================================
// UPDATE (edición parcial)
// ============================================================================

export const updateClientAddressFormSchema = clientAddressFormSchema.partial().extend({
  satStateCode: z.string().min(1, "El estado es requerido"),
  satMunicipalityCode: z.string().min(1, "El municipio es requerido"),
  postalCode: z.string().regex(/^\d{5}$/, "CP: 5 dígitos"),
});

export type UpdateClientAddressFormData = z.infer<typeof updateClientAddressFormSchema>;

// ============================================================================
// Mapeo formulario → DTO de dominio
// ============================================================================

function emptyToUndef(s: string | null | undefined): string | undefined {
  if (s == null) return undefined;
  const t = s.trim();
  return t === "" ? undefined : t;
}

function nullToUndef<T>(v: T | null | undefined): T | undefined {
  return v === null ? undefined : v;
}

export function clientAddressFormDataToCreateDto(
  data: ClientAddressFormData,
): CreateClientAddressDTO {
  return {
    addressType: data.addressType as AddressType,
    isPrimary: data.isPrimary,
    locationName: emptyToUndef(data.locationName),
    satCountryCode: data.satCountryCode || "MEX",
    satStateCode: data.satStateCode,
    satMunicipalityCode: data.satMunicipalityCode,
    satLocalityCode: emptyToUndef(data.satLocalityCode ?? undefined),
    satNeighborhoodCode: emptyToUndef(data.satNeighborhoodCode ?? undefined),
    neighborhoodName: emptyToUndef(data.neighborhoodName ?? undefined),
    postalCode: data.postalCode,
    street: data.street,
    exteriorNumber: data.exteriorNumber,
    interiorNumber: emptyToUndef(data.interiorNumber ?? undefined),
    reference: emptyToUndef(data.reference ?? undefined),
    rfcRemitenteDestinatario: emptyToUndef(data.rfcRemitenteDestinatario),
    nombreRemitenteDestinatario: emptyToUndef(data.nombreRemitenteDestinatario),
    latitude: nullToUndef(data.latitude),
    longitude: nullToUndef(data.longitude),
    contactName: emptyToUndef(data.contactName),
    contactPhone: emptyToUndef(data.contactPhone),
    contactEmail: emptyToUndef(data.contactEmail),
    businessHours: emptyToUndef(data.businessHours),
    notes: emptyToUndef(data.notes),
    specialInstructions: emptyToUndef(data.specialInstructions),
  };
}

export function clientAddressFormDataToUpdateDto(
  data: ClientAddressFormData,
): UpdateClientAddressDTO {
  return clientAddressFormDataToCreateDto(data);
}
