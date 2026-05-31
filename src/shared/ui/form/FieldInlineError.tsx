import { cn } from "@shared/lib/utils/cn";

/** Mensaje de error bajo un campo (mismo estilo que `AddressInput`). */
export function FieldInlineError({
  fieldId,
  message,
  className,
}: {
  fieldId: string;
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p id={`${fieldId}-error`} className={cn("text-destructive text-xs", className)}>
      {message}
    </p>
  );
}

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
