export function getFieldErrorAriaProps(
  fieldId: string,
  message?: string,
): { "aria-invalid": boolean; "aria-describedby"?: string } {
  return {
    "aria-invalid": Boolean(message),
    ...(message ? { "aria-describedby": `${fieldId}-error` } : {}),
  };
}

/** Props de `error` + ARIA para campos con `register()` (auth, invitaciones). */
export function getRegisterFieldErrorProps(fieldId: string, message?: string) {
  return {
    error: Boolean(message),
    ...getFieldErrorAriaProps(fieldId, message),
  };
}
