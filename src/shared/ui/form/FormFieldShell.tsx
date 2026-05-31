import type { ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Label } from "@shared/ui/label";
import { FieldInlineError } from "./FieldInlineError";
import { normalizeRequiredFieldLabel } from "./fieldLabel";

export interface FormFieldShellProps {
  /** `id` del control (enlaza con `<Label htmlFor>` y `FieldInlineError`). */
  fieldId: string;
  label: ReactNode;
  required?: boolean;
  errorMessage?: string;
  /** Texto de ayuda; se oculta si hay `errorMessage`. */
  description?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Contenedor estándar de campo: label, control, ayuda opcional y error inline (`text-xs`).
 * El control hijo debe usar `error={Boolean(errorMessage)}` y `getFieldErrorAriaProps`.
 */
export function FormFieldShell({
  fieldId,
  label,
  required = false,
  errorMessage,
  description,
  className,
  children,
}: FormFieldShellProps) {
  const { displayLabel, showRequiredMark } = normalizeRequiredFieldLabel(
    label,
    required,
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId}>
        {displayLabel}
        {showRequiredMark ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {description && !errorMessage ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      <FieldInlineError fieldId={fieldId} message={errorMessage} />
    </div>
  );
}
