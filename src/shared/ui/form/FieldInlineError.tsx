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
