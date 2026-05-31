/**
 * Domicilio personal del empleado — UX local + SoT `@boeltech/cfdi-domain` (`context=personal`).
 */

import { z } from "zod";
import type { ValidationError } from "@boeltech/cfdi-domain";
import {
  mapValidationErrorsToRHF,
  parseClientAddressFormCreate,
} from "@shared/cfdi/addressPayloadBridge";
import {
  cp31AddressDomUxFields,
  cp31RequiredSatLocationUxFields,
  withLatLngPairRefinement,
} from "@shared/validation/addressFormUx";
import {
  clientAddressFormDataToCreateDto,
  type ClientAddressFormData,
} from "@features/clients/presentation/validation/clientAddressSchema";
import type {
  CreateClientAddressDTO,
  UpdateClientAddressDTO,
} from "@features/clients/domain";

function emptyToUndef(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

const employeePersonalDomShape = {
  id: z.string().optional(),
  addressType: z.literal("personal"),
  isPrimary: z.literal(true),
  ...cp31AddressDomUxFields,
};

/** Schema UX del domicilio personal (sin `locationName`; SAT en paquete). */
export const employeePersonalAddressFormSchema = withLatLngPairRefinement(
  z.object(employeePersonalDomShape).extend(cp31RequiredSatLocationUxFields),
);

export type EmployeePersonalAddressFormData = z.infer<
  typeof employeePersonalAddressFormSchema
>;

export type EmployeePersonalAddressValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[]; fieldErrors: Record<string, string> };

function zodIssuesToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    code: String(issue.code),
    message: issue.message,
    path: issue.path.length > 0 ? issue.path.join(".") : undefined,
  }));
}

function normalizePostalCode(value: string): string {
  return value.trim();
}

function normalizeSatCode(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split("-").filter(Boolean);
  return (parts[parts.length - 1] ?? trimmed).trim();
}

export function normalizeEmployeePersonalAddressFormData(
  data: EmployeePersonalAddressFormData,
): EmployeePersonalAddressFormData {
  return {
    ...data,
    addressType: "personal",
    isPrimary: true,
    street: (data.street ?? "").trim(),
    exteriorNumber: (data.exteriorNumber ?? "").trim(),
    postalCode: normalizePostalCode(data.postalCode),
    satStateCode: (data.satStateCode ?? "").trim(),
    satMunicipalityCode: normalizeSatCode(data.satMunicipalityCode) ?? "",
    satLocalityCode: normalizeSatCode(data.satLocalityCode),
    localityName: data.localityName?.trim() || null,
    satNeighborhoodCode: normalizeSatCode(data.satNeighborhoodCode),
    neighborhoodName: data.neighborhoodName?.trim() || null,
  };
}

export const defaultEmployeePersonalAddressValues: EmployeePersonalAddressFormData =
  {
    addressType: "personal",
    isPrimary: true,
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
  };

/** True si el usuario tocó algún campo de domicilio (edición: evita PUT innecesario). */
export function isEmployeeDomicilioDirty(
  dirtyFields: Partial<{
    domicilio?: boolean | Record<string, boolean | undefined>;
  }>,
): boolean {
  const dom = dirtyFields.domicilio;
  if (!dom) return false;
  if (dom === true) return true;
  if (typeof dom === "object") {
    return Object.values(dom).some(Boolean);
  }
  return false;
}

export function employeePersonalFormToCreateDto(
  domicilio: EmployeePersonalAddressFormData,
): CreateClientAddressDTO {
  const normalized = normalizeEmployeePersonalAddressFormData(domicilio);
  const asClientForm = {
    ...normalized,
    locationName: "",
    rfcRemitenteDestinatario: "",
    nombreRemitenteDestinatario: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    businessHours: "",
    notes: "",
    specialInstructions: "",
  } as unknown as ClientAddressFormData;

  return clientAddressFormDataToCreateDto(asClientForm);
}

/** Body PUT: omite claves vacías para no sobrescribir SAT con NULL en API. */
export function employeePersonalFormToUpdateDto(
  domicilio: EmployeePersonalAddressFormData,
): UpdateClientAddressDTO {
  const created = employeePersonalFormToCreateDto(domicilio);
  return {
    addressType: created.addressType,
    isPrimary: created.isPrimary,
    satCountryCode: created.satCountryCode,
    satStateCode: created.satStateCode,
    postalCode: created.postalCode,
    satMunicipalityCode: emptyToUndef(created.satMunicipalityCode),
    satLocalityCode: emptyToUndef(created.satLocalityCode ?? undefined),
    localityName: emptyToUndef(created.localityName ?? undefined),
    satNeighborhoodCode: emptyToUndef(created.satNeighborhoodCode ?? undefined),
    neighborhoodName: emptyToUndef(created.neighborhoodName ?? undefined),
    street: emptyToUndef(created.street),
    exteriorNumber: emptyToUndef(created.exteriorNumber),
    interiorNumber: emptyToUndef(created.interiorNumber ?? undefined),
    reference: emptyToUndef(created.reference ?? undefined),
    latitude: created.latitude,
    longitude: created.longitude,
    geolocationPending: created.geolocationPending,
    geocodingSource: created.geocodingSource,
  };
}

/**
 * Validación al guardar: UX + única pasada CP31 en paquete (`context=personal`, personal_lax).
 */
export async function validateEmployeePersonalAddressFormComplete(
  data: EmployeePersonalAddressFormData,
  options?: { requireCoordinates?: boolean },
): Promise<EmployeePersonalAddressValidationResult> {
  const normalized = normalizeEmployeePersonalAddressFormData(data);

  const uxResult = employeePersonalAddressFormSchema.safeParse(normalized);
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

  const parsed = await parseClientAddressFormCreate(
    normalized as unknown as Record<string, unknown>,
    {
      context: "personal",
      requireCoordinates: options?.requireCoordinates ?? false,
    },
  );

  if (!parsed.ok) {
    return parsed;
  }

  return { ok: true };
}

export { mapValidationErrorsToRHF };
