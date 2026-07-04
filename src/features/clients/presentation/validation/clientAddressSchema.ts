/**
 * Client Address Form Validation
 *
 * UX (Zod local): formato, longitudes, locationName, email de contacto.
 * Reglas SAT / CP31: única SoT `@boeltech/cfdi-domain` vía `validateClientAddressFormComplete`.
 */

import { z } from "zod";
import type { ValidationError } from "@boeltech/cfdi-domain";
import {
  mapValidationErrorsToRHF,
  parseClientAddressFormCreate,
  parseClientAddressFormUpdate,
} from "@shared/cfdi/addressPayloadBridge";
import {
  cp31AddressDomUxFields,
  cp31RequiredSatLocationUxFields,
  optionalTrimmed,
  requiredTrimmed,
  withLatLngPairRefinement,
} from "@shared/validation/addressFormUx";
import type { AddressType } from "../../domain/entities";
import type { CreateClientAddressDTO, UpdateClientAddressDTO } from "../../domain/repository";

// ============================================================================
// UX-ONLY (no duplicar obligatoriedad SAT del paquete)
// ============================================================================

/**
 * Tipos de dirección válidos para el dominio de cliente.
 *
 * SoT única: la UI (`ClientAddressForm`) consume esta lista para construir el
 * `Select` de "Tipo" y la validación Zod la usa para rechazar valores fuera del
 * dominio (`company`, `branch`, `trip_*`, `personal` pertenecen a otros
 * módulos: settings, branches, trips, employees).
 */
export const CLIENT_ADDRESS_TYPES = [
  "billing",
  "shipping",
  "pickup",
  "warehouse",
  "office",
  "other",
] as const;

export type ClientAddressTypeValue = (typeof CLIENT_ADDRESS_TYPES)[number];

const clientAddressDomUxShape = {
  id: z.string().uuid().optional(),
  addressType: z.enum(CLIENT_ADDRESS_TYPES),
  isPrimary: z.boolean().default(false),
  ...cp31AddressDomUxFields,
  locationName: requiredTrimmed(200, "El nombre del lugar"),
  rfcRemitenteDestinatario: optionalTrimmed(13),
  nombreRemitenteDestinatario: optionalTrimmed(254),
  contactName: optionalTrimmed(200),
  contactPhone: optionalTrimmed(20),
  contactEmail: z.union([z.literal(""), z.string().email("Correo inválido")]).optional(),
  businessHours: optionalTrimmed(200),
  notes: optionalTrimmed(1000),
  specialInstructions: optionalTrimmed(1000),
};

const clientAddressDomBaseSchema = z.object(clientAddressDomUxShape);

/** CRUD dirección adicional: tipos operativos del cliente, cp31_min en paquete. */
export const additionalAddressFormSchema = withLatLngPairRefinement(
  clientAddressDomBaseSchema.safeExtend(cp31RequiredSatLocationUxFields),
);

/** Alta fiscal (wizard paso 2). */
export const billingAddressFormSchema = withLatLngPairRefinement(
  clientAddressDomBaseSchema.safeExtend({
    addressType: z.literal("billing"),
    isPrimary: z.literal(true),
    ...cp31RequiredSatLocationUxFields,
  }),
);

export type ClientAddressFormData = z.infer<typeof additionalAddressFormSchema>;
export type BillingAddressFormData = z.infer<typeof billingAddressFormSchema>;
export type ClientAddressFormContext = "billingOnCreate" | "additional";

export const updateClientAddressFormSchema = clientAddressDomBaseSchema.partial();

export type UpdateClientAddressFormData = z.infer<typeof updateClientAddressFormSchema>;

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
  localityName: null,
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
// Mapeo formulario → DTO de dominio
// ============================================================================

function emptyToUndef(s: string | null | undefined): string | undefined {
  if (s == null) return undefined;
  const t = s.trim();
  return t === "" ? undefined : t;
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

function zodIssuesToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    code: String(issue.code),
    message: issue.message,
    path: issue.path.length > 0 ? issue.path.join(".") : undefined,
  }));
}

function resolvePackageAddressContext(
  addressType: string,
): "billing" | "shipping" | "pickup" | "warehouse" | "office" | "other" {
  const allowed = [
    "billing",
    "shipping",
    "pickup",
    "warehouse",
    "office",
    "other",
  ] as const;
  return allowed.includes(addressType as (typeof allowed)[number])
    ? (addressType as (typeof allowed)[number])
    : "billing";
}

function clientAddressUxSchemaForContext(
  context: ClientAddressFormContext,
): typeof billingAddressFormSchema | typeof additionalAddressFormSchema {
  return context === "billingOnCreate"
    ? billingAddressFormSchema
    : additionalAddressFormSchema;
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
    locationName: normalizeTextValue(data.locationName) ?? "",
    street: (data.street ?? "").trim(),
    exteriorNumber: (data.exteriorNumber ?? "").trim(),
    interiorNumber: normalizeTextValue(data.interiorNumber) ?? null,
    reference: normalizeTextValue(data.reference) ?? null,
    postalCode: normalizePostalCode(data.postalCode),
    satStateCode: (data.satStateCode ?? "").trim(),
    satMunicipalityCode: normalizeSatCode(data.satMunicipalityCode) ?? "",
    satLocalityCode: normalizeSatCode(data.satLocalityCode),
    localityName: normalizeTextValue(data.localityName) ?? null,
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

  const hasCoordinates =
    normalized.latitude != null && normalized.longitude != null;

  return {
    addressType: normalized.addressType as AddressType,
    isPrimary: normalized.isPrimary,
    locationName: emptyToUndef(normalized.locationName),
    satCountryCode: normalized.satCountryCode || "MEX",
    satStateCode: normalized.satStateCode,
    satMunicipalityCode: normalized.satMunicipalityCode,
    satLocalityCode: emptyToUndef(normalized.satLocalityCode ?? undefined),
    localityName: emptyToUndef(normalized.localityName ?? undefined),
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
    latitude: hasCoordinates ? (normalized.latitude as number) : null,
    longitude: hasCoordinates ? (normalized.longitude as number) : null,
    geolocationPending: !hasCoordinates,
    geocodingSource: hasCoordinates ? "manual" : null,
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
  const contextAware = applyClientAddressFormContext(
    data,
    options?.context ?? "additional",
  );
  const normalized = normalizeClientAddressFormData(contextAware);

  const hasCoordinates =
    normalized.latitude != null && normalized.longitude != null;

  return {
    addressType: normalized.addressType as AddressType,
    isPrimary: normalized.isPrimary,
    locationName: emptyToUndef(normalized.locationName),
    satCountryCode: normalized.satCountryCode || "MEX",
    satStateCode: normalized.satStateCode,
    satMunicipalityCode: normalized.satMunicipalityCode || null,
    satLocalityCode: normalized.satLocalityCode ?? null,
    localityName: normalized.localityName ?? null,
    satNeighborhoodCode: normalized.satNeighborhoodCode ?? null,
    neighborhoodName: normalized.neighborhoodName ?? null,
    postalCode: normalized.postalCode,
    street: normalized.street,
    exteriorNumber: normalized.exteriorNumber,
    interiorNumber: normalized.interiorNumber ?? null,
    reference: normalized.reference ?? null,
    rfcRemitenteDestinatario:
      normalized.rfcRemitenteDestinatario ?? null,
    nombreRemitenteDestinatario:
      normalized.nombreRemitenteDestinatario ?? null,
    latitude: hasCoordinates ? (normalized.latitude as number) : null,
    longitude: hasCoordinates ? (normalized.longitude as number) : null,
    geolocationPending: !hasCoordinates,
    geocodingSource: hasCoordinates ? "manual" : null,
    contactName: normalized.contactName ?? null,
    contactPhone: normalized.contactPhone ?? null,
    contactEmail: normalized.contactEmail ?? null,
    businessHours: normalized.businessHours ?? null,
    notes: normalized.notes ?? null,
    specialInstructions: normalized.specialInstructions ?? null,
  };
}

export type ClientAddressValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[]; fieldErrors: Record<string, string> };

/**
 * Validación al guardar: UX local + única pasada SAT/CP31 en `@boeltech/cfdi-domain`.
 *
 * `intent`:
 * - `create` (default): pipeline `parseAddressFormCreate` (todos los campos validados).
 * - `update`: pipeline `parseAddressFormUpdate` parcial — útil para PATCH y para
 *   direcciones legacy sin `street`/`exterior_number` (ADR-ADDR P4 §7).
 */
export async function validateClientAddressFormComplete(
  data: ClientAddressFormData,
  options?: {
    context?: ClientAddressFormContext;
    requireCoordinates?: boolean;
    intent?: "create" | "update";
  },
): Promise<ClientAddressValidationResult> {
  const context = options?.context ?? "additional";
  const contextual = applyClientAddressFormContext(data, context);
  const normalized = normalizeClientAddressFormData(contextual);

  const uxSchema = clientAddressUxSchemaForContext(context);
  const uxResult = uxSchema.safeParse(normalized);
  if (!uxResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of uxResult.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join(".") : "";
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      errors: zodIssuesToValidationErrors(uxResult.error),
      fieldErrors,
    };
  }

  const requireCoordinates = options?.requireCoordinates ?? false;
  const addressContext = resolvePackageAddressContext(normalized.addressType);
  const intent = options?.intent ?? "create";

  const parseFn =
    intent === "update" ? parseClientAddressFormUpdate : parseClientAddressFormCreate;

  const parsed = await parseFn(
    normalized as unknown as Record<string, unknown>,
    {
      context: addressContext,
      requireCoordinates,
    },
  );

  if (!parsed.ok) {
    return parsed;
  }

  return { ok: true };
}

export { mapValidationErrorsToRHF };
