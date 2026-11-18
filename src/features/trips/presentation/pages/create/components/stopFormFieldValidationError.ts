/**
 * Error de validación de campos del StopFormSheet.
 * El sheet aplica `fieldErrors` con setError y mantiene el overlay abierto
 * sin toast ni Alert de submit (F9g).
 */
export class StopFormFieldValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    const first = Object.values(fieldErrors)[0];
    super(first ?? "Validation error");
    this.name = "StopFormFieldValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function isStopFormFieldValidationError(
  error: unknown,
): error is StopFormFieldValidationError {
  return error instanceof StopFormFieldValidationError;
}
