/**
 * Domicilio fiscal del tenant (Settings) — UX local + SoT `@boeltech/cfdi-domain`.
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
  optionalTrimmed,
  requiredTrimmed,
  withLatLngPairRefinement,
} from "@shared/validation/addressFormUx";
import {
  clientAddressFormDataToCreateDto,
  defaultClientAddressFormValues,
  normalizeClientAddressFormData,
  type ClientAddressFormData,
} from "@features/clients/presentation/validation/clientAddressSchema";
import type { CreateClientAddressDTO } from "@features/clients/domain";

const companyFiscalDomShape = {
  id: z.string().uuid().optional(),
  addressType: z.literal("company"),
  isPrimary: z.literal(true),
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

/** Schema UX del domicilio fiscal (sin reglas SAT duplicadas). */
export const companyFiscalFormSchema = withLatLngPairRefinement(
  z.object(companyFiscalDomShape).extend(cp31RequiredSatLocationUxFields),
);

export type CompanyFiscalFormData = z.infer<typeof companyFiscalFormSchema>;

export type CompanyFiscalValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[]; fieldErrors: Record<string, string> };

function zodIssuesToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    code: String(issue.code),
    message: issue.message,
    path: issue.path.length > 0 ? issue.path.join(".") : undefined,
  }));
}

export function companyFiscalFormToCreateDto(
  fiscal: CompanyFiscalFormData,
): CreateClientAddressDTO {
  const asClientForm = {
    ...defaultClientAddressFormValues,
    ...fiscal,
    addressType: "company",
    isPrimary: true,
  } as unknown as ClientAddressFormData;

  return clientAddressFormDataToCreateDto(asClientForm);
}

/**
 * Validación al guardar: UX + única pasada CP31 en paquete (`context=company`).
 */
export async function validateCompanyFiscalAddressFormComplete(
  data: CompanyFiscalFormData,
  options?: { requireCoordinates?: boolean },
): Promise<CompanyFiscalValidationResult> {
  const normalized = normalizeClientAddressFormData({
    ...defaultClientAddressFormValues,
    ...data,
    addressType: "company",
    isPrimary: true,
  } as unknown as ClientAddressFormData);

  const uxResult = companyFiscalFormSchema.safeParse(normalized);
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
      context: "company",
      requireCoordinates: options?.requireCoordinates ?? false,
    },
  );

  if (!parsed.ok) {
    return parsed;
  }

  return { ok: true };
}

export { mapValidationErrorsToRHF };
