/**
 * Domicilio operativo de sucursal — UX local + SoT `@boeltech/cfdi-domain` (`context=branch`).
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
  requiredTrimmed,
  withLatLngPairRefinement,
} from "@shared/validation/addressFormUx";

const branchOperationalDomShape = {
  addressType: z.literal("branch"),
  isPrimary: z.literal(true),
  ...cp31AddressDomUxFields,
  street: requiredTrimmed(200, "La calle"),
  exteriorNumber: requiredTrimmed(20, "El número exterior"),
};

/** Schema UX del domicilio operativo (sin duplicar reglas SAT del paquete). */
export const branchOperationalAddressFormSchema = withLatLngPairRefinement(
  z.object(branchOperationalDomShape).extend(cp31RequiredSatLocationUxFields),
);

export type BranchOperationalAddressFormData = z.infer<
  typeof branchOperationalAddressFormSchema
>;

export type BranchOperationalAddressValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[]; fieldErrors: Record<string, string> };

function normalizeSatCode(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split("-").filter(Boolean);
  return (parts[parts.length - 1] ?? trimmed).trim();
}

export function normalizeBranchOperationalAddressFormData(
  data: BranchOperationalAddressFormData,
): BranchOperationalAddressFormData {
  return {
    ...data,
    addressType: "branch",
    isPrimary: true,
    street: (data.street ?? "").trim(),
    exteriorNumber: (data.exteriorNumber ?? "").trim(),
    postalCode: (data.postalCode ?? "").trim(),
    satCountryCode: (data.satCountryCode ?? "MEX").trim(),
    satStateCode: (data.satStateCode ?? "").trim(),
    satMunicipalityCode: normalizeSatCode(data.satMunicipalityCode) ?? "",
    satLocalityCode: normalizeSatCode(data.satLocalityCode),
    localityName: data.localityName?.trim() || null,
    satNeighborhoodCode: normalizeSatCode(data.satNeighborhoodCode),
    neighborhoodName: data.neighborhoodName?.trim() || null,
  };
}

export const defaultBranchOperationalAddressValues: BranchOperationalAddressFormData =
  {
    addressType: "branch",
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

function zodIssuesToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    code: String(issue.code),
    message: issue.message,
    path: issue.path.length > 0 ? issue.path.join(".") : undefined,
  }));
}

export async function validateBranchOperationalAddressFormComplete(
  data: BranchOperationalAddressFormData,
  options: { locationName: string; requireCoordinates?: boolean },
): Promise<BranchOperationalAddressValidationResult> {
  const normalized = normalizeBranchOperationalAddressFormData(data);

  const ux = branchOperationalAddressFormSchema.safeParse(normalized);
  if (!ux.success) {
    return {
      ok: false,
      errors: zodIssuesToValidationErrors(ux.error),
      fieldErrors: mapValidationErrorsToRHF(zodIssuesToValidationErrors(ux.error)),
    };
  }

  const parsed = await parseClientAddressFormCreate(
    {
      ...ux.data,
      locationName: options.locationName,
    } as unknown as Record<string, unknown>,
    {
      context: "branch",
      requireCoordinates: options.requireCoordinates ?? false,
    },
  );

  if (!parsed.ok) {
    return {
      ok: false,
      errors: parsed.errors,
      fieldErrors: parsed.fieldErrors,
    };
  }

  return { ok: true };
}
