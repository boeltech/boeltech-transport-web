/**
 * Puente camelCase (formularios RHF) ↔ validación @boeltech/cfdi-domain (clientes).
 */
import type { ValidationError } from "@boeltech/cfdi-domain";
import {
  mapClientValidationErrorsToRHF,
  parseClientFormCreate,
  parseClientFormUpdate,
  validationErrorsToRecord,
} from "@boeltech/cfdi-domain/validadores/client-payload-result";

export {
  mapClientValidationErrorsToRHF,
  validationErrorsToRecord,
};

export async function validateClientFormPayload(
  input: Record<string, unknown>,
): Promise<
  | { ok: true }
  | { ok: false; errors: ValidationError[]; fieldErrors: Record<string, string> }
> {
  const result = parseClientFormCreate(input);
  if (!result.ok) {
    return {
      ok: false,
      errors: result.error,
      fieldErrors: mapClientValidationErrorsToRHF(result.error),
    };
  }
  return { ok: true };
}

export async function validateClientFormUpdatePayload(
  input: Record<string, unknown>,
): Promise<
  | { ok: true }
  | { ok: false; errors: ValidationError[]; fieldErrors: Record<string, string> }
> {
  const result = parseClientFormUpdate(input);
  if (!result.ok) {
    return {
      ok: false,
      errors: result.error,
      fieldErrors: mapClientValidationErrorsToRHF(result.error),
    };
  }
  return { ok: true };
}
