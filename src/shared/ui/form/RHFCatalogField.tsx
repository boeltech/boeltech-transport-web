import type { ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RefCallBack,
} from "react-hook-form";
import { FormFieldShell } from "./FormFieldShell";

export type RHFCatalogFieldRenderProps = {
  field: {
    value: string;
    onChange: (v: string) => void;
    onBlur: () => void;
    name: string;
    ref: RefCallBack;
  };
  fieldState: { error?: { message?: string } };
  resolvedId: string;
  errorMessage?: string;
};

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
  children: (ctx: RHFCatalogFieldRenderProps) => ReactNode;
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
              onBlur: field.onBlur,
              name: field.name,
              ref: field.ref,
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
