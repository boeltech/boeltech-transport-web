/**
 * Validación UX — ubicaciones del directorio del tenant (warehouse | other).
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
import type {
  CreateClientAddressDTO,
  UpdateClientAddressDTO,
} from "@features/clients/domain";

export const TENANT_LOCATION_TYPES = ["warehouse", "other"] as const;
export type TenantLocationType = (typeof TENANT_LOCATION_TYPES)[number];

const tenantLocationDomShape = {
  id: z.string().uuid().optional(),
  addressType: z.enum(TENANT_LOCATION_TYPES),
  isPrimary: z.literal(false).default(false),
  ...cp31AddressDomUxFields,
  locationName: requiredTrimmed(200, "El nombre del lugar es obligatorio"),
  rfcRemitenteDestinatario: optionalTrimmed(13),
  nombreRemitenteDestinatario: optionalTrimmed(254),
  contactName: optionalTrimmed(200),
  contactPhone: optionalTrimmed(20),
  contactEmail: z.union([z.literal(""), z.string().email("Correo inválido")]).optional(),
  businessHours: optionalTrimmed(200),
  notes: optionalTrimmed(1000),
  specialInstructions: optionalTrimmed(1000),
};

export const tenantLocationFormSchema = withLatLngPairRefinement(
  z.object(tenantLocationDomShape).safeExtend(cp31RequiredSatLocationUxFields),
);

export type TenantLocationFormData = z.infer<typeof tenantLocationFormSchema>;

export const defaultTenantLocationFormValues: TenantLocationFormData = {
  addressType: "warehouse",
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

function emptyToUndef(s: string | null | undefined): string | undefined {
  if (s == null) return undefined;
  const t = s.trim();
  return t === "" ? undefined : t;
}

function normalizeSatCode(value: string | null | undefined): string | null {
  const t = value?.trim();
  if (!t) return null;
  const parts = t.split("-").filter(Boolean);
  return (parts[parts.length - 1] ?? t).trim();
}

export function tenantLocationFormDataToCreateDto(
  data: TenantLocationFormData,
): CreateClientAddressDTO {
  return {
    addressType: data.addressType,
    isPrimary: false,
    locationName: data.locationName.trim(),
    street: data.street.trim(),
    exteriorNumber: data.exteriorNumber.trim(),
    interiorNumber: emptyToUndef(data.interiorNumber),
    reference: emptyToUndef(data.reference),
    postalCode: data.postalCode.trim(),
    satCountryCode: data.satCountryCode || "MEX",
    satStateCode: data.satStateCode.trim(),
    satMunicipalityCode: normalizeSatCode(data.satMunicipalityCode) ?? "",
    satLocalityCode: emptyToUndef(normalizeSatCode(data.satLocalityCode) ?? undefined),
    localityName: emptyToUndef(data.localityName),
    satNeighborhoodCode: emptyToUndef(
      normalizeSatCode(data.satNeighborhoodCode) ?? undefined,
    ),
    neighborhoodName: emptyToUndef(data.neighborhoodName),
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    rfcRemitenteDestinatario: emptyToUndef(data.rfcRemitenteDestinatario),
    nombreRemitenteDestinatario: emptyToUndef(data.nombreRemitenteDestinatario),
    contactName: emptyToUndef(data.contactName),
    contactPhone: emptyToUndef(data.contactPhone),
    contactEmail: emptyToUndef(data.contactEmail),
    businessHours: emptyToUndef(data.businessHours),
    notes: emptyToUndef(data.notes),
    specialInstructions: emptyToUndef(data.specialInstructions),
  };
}

export function tenantLocationFormDataToUpdateDto(
  data: TenantLocationFormData,
): UpdateClientAddressDTO {
  return tenantLocationFormDataToCreateDto(data);
}

function zodIssuesToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    code: String(issue.code),
    message: issue.message,
    path: issue.path.length > 0 ? issue.path.join(".") : undefined,
  }));
}

export async function validateTenantLocationFormComplete(
  data: TenantLocationFormData,
  mode: "create" | "update" = "create",
): Promise<
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string> }
> {
  const ux = tenantLocationFormSchema.safeParse(data);
  if (!ux.success) {
    return {
      ok: false,
      fieldErrors: mapValidationErrorsToRHF(zodIssuesToValidationErrors(ux.error)),
    };
  }

  const parseFn =
    mode === "update" ? parseClientAddressFormUpdate : parseClientAddressFormCreate;

  const parsed = await parseFn(ux.data as unknown as Record<string, unknown>, {
    context: "warehouse",
    requireCoordinates: false,
  });

  if (!parsed.ok) {
    return { ok: false, fieldErrors: parsed.fieldErrors };
  }

  return { ok: true };
}
