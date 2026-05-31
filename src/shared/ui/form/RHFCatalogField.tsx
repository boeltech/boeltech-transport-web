import type { ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormFieldShell } from "./FormFieldShell";

export function RHFCatalogField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  fieldId,
  description,
  className,
  children,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: ReactNode;
  required?: boolean;
  fieldId?: string;
  description?: ReactNode;
  className?: string;
  children: (ctx: {
    field: { value: string; onChange: (v: string) => void };
    fieldState: { error?: { message?: string } };
    resolvedId: string;
    errorMessage?: string;
  }) => ReactNode;
}) {
  const resolvedId = fieldId ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormFieldShell
          fieldId={resolvedId}
          label={label}
          required={required}
          description={description}
          errorMessage={fieldState.error?.message}
          className={className}
        >
          {children({
            field: {
              value: String(field.value ?? ""),
              onChange: field.onChange,
            },
            fieldState,
            resolvedId,
            errorMessage: fieldState.error?.message,
          })}
        </FormFieldShell>
      )}
    />
  );
}
