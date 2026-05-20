import type { FieldErrors, FieldValues } from "react-hook-form";

/**
 * Recolecta mensajes de error de un árbol FieldErrors (hasta `max` ítems).
 */
export function collectFieldErrorMessages(
  errors: FieldErrors<FieldValues>,
  max = 6,
): string[] {
  const messages: string[] = [];

  const walk = (node: FieldErrors<FieldValues>): void => {
    if (messages.length >= max) return;
    for (const value of Object.values(node)) {
      if (!value || typeof value !== "object") continue;
      if ("message" in value && typeof value.message === "string") {
        messages.push(value.message);
        if (messages.length >= max) return;
        continue;
      }
      walk(value as FieldErrors<FieldValues>);
    }
  };

  walk(errors);
  return messages;
}

/**
 * Descripción corta para toast cuando hay varios errores.
 */
export function formatFormValidationToastDescription(
  errors: FieldErrors<FieldValues>,
): string {
  const preview = collectFieldErrorMessages(errors, 3);
  if (preview.length === 0) {
    return "Corrige los campos marcados antes de continuar.";
  }
  if (preview.length === 1) return preview[0]!;
  const total = collectFieldErrorMessages(errors, 99).length;
  const rest = total > preview.length ? ` (+${total - preview.length} más)` : "";
  return `${preview.join(" · ")}${rest}`;
}
