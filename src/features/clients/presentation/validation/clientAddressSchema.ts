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
export type ClientAddressFormContext = "billingOnCreate" | "additional";

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

function normalizeTextValue(
  value: string | null | undefined,
): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function normalizePostalCode(value: string): string {
  return value.trim();
}

function normalizeSatCode(value: string | null | undefined): string | null {
  const normalized = normalizeTextValue(value);
  if (!normalized) return null;
  const parts = normalized.split("-").filter(Boolean);
  return (parts[parts.length - 1] ?? normalized).trim();
}

function normalizeRfc(value: string | null | undefined): string | null {
  const normalized = normalizeTextValue(value);
  return normalized ? normalized.toUpperCase() : null;
}

export function applyClientAddressFormContext(
  data: ClientAddressFormData,
  context: ClientAddressFormContext,
): ClientAddressFormData {
  if (context === "billingOnCreate") {
    return {
      ...data,
      addressType: "billing",
      isPrimary: true,
    };
  }
  return data;
}

export function normalizeClientAddressFormData(
  data: ClientAddressFormData,
): ClientAddressFormData {
  return {
    ...data,
    locationName: normalizeTextValue(data.locationName),
    street: data.street.trim(),
    exteriorNumber: data.exteriorNumber.trim(),
    interiorNumber: normalizeTextValue(data.interiorNumber) ?? null,
    reference: normalizeTextValue(data.reference) ?? null,
    postalCode: normalizePostalCode(data.postalCode),
    satStateCode: data.satStateCode.trim(),
    satMunicipalityCode: normalizeSatCode(data.satMunicipalityCode) ?? "",
    satLocalityCode: normalizeSatCode(data.satLocalityCode),
    satNeighborhoodCode: normalizeSatCode(data.satNeighborhoodCode),
    neighborhoodName: normalizeTextValue(data.neighborhoodName) ?? null,
    rfcRemitenteDestinatario: normalizeRfc(data.rfcRemitenteDestinatario) ?? undefined,
    nombreRemitenteDestinatario: normalizeTextValue(data.nombreRemitenteDestinatario),
    contactName: normalizeTextValue(data.contactName),
    contactPhone: normalizeTextValue(data.contactPhone),
    contactEmail: normalizeTextValue(data.contactEmail),
    businessHours: normalizeTextValue(data.businessHours),
    notes: normalizeTextValue(data.notes),
    specialInstructions: normalizeTextValue(data.specialInstructions),
  };
}

export function clientAddressFormDataToCreateDto(
  data: ClientAddressFormData,
  options?: { context?: ClientAddressFormContext },
): CreateClientAddressDTO {
  const contextAware = applyClientAddressFormContext(
    data,
    options?.context ?? "additional",
  );
  const normalized = normalizeClientAddressFormData(contextAware);

  return {
    addressType: normalized.addressType as AddressType,
    isPrimary: normalized.isPrimary,
    locationName: emptyToUndef(normalized.locationName),
    satCountryCode: normalized.satCountryCode || "MEX",
    satStateCode: normalized.satStateCode,
    satMunicipalityCode: normalized.satMunicipalityCode,
    satLocalityCode: emptyToUndef(normalized.satLocalityCode ?? undefined),
    satNeighborhoodCode: emptyToUndef(normalized.satNeighborhoodCode ?? undefined),
    neighborhoodName: emptyToUndef(normalized.neighborhoodName ?? undefined),
    postalCode: normalized.postalCode,
    street: normalized.street,
    exteriorNumber: normalized.exteriorNumber,
    interiorNumber: emptyToUndef(normalized.interiorNumber ?? undefined),
    reference: emptyToUndef(normalized.reference ?? undefined),
    rfcRemitenteDestinatario: emptyToUndef(normalized.rfcRemitenteDestinatario),
    nombreRemitenteDestinatario: emptyToUndef(
      normalized.nombreRemitenteDestinatario,
    ),
    latitude: nullToUndef(normalized.latitude),
    longitude: nullToUndef(normalized.longitude),
    contactName: emptyToUndef(normalized.contactName),
    contactPhone: emptyToUndef(normalized.contactPhone),
    contactEmail: emptyToUndef(normalized.contactEmail),
    businessHours: emptyToUndef(normalized.businessHours),
    notes: emptyToUndef(normalized.notes),
    specialInstructions: emptyToUndef(normalized.specialInstructions),
  };
}

export function clientAddressFormDataToUpdateDto(
  data: ClientAddressFormData,
  options?: { context?: ClientAddressFormContext },
): UpdateClientAddressDTO {
  return clientAddressFormDataToCreateDto(data, options);
}
