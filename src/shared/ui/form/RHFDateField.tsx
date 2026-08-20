import type { ReactNode } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { DateField, type DateFieldProps } from "./DateField";
import { FormFieldShell } from "./FormFieldShell";
import { getFieldErrorAriaProps } from "./fieldErrorAria";

export type RHFDateFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: ReactNode;
  required?: boolean;
  description?: ReactNode;
  fieldId?: string;
} & Omit<DateFieldProps, "id" | "name" | "value" | "onChange" | "onBlur">;

export function RHFDateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  fieldId,
  ...dateProps
}: RHFDateFieldProps<TFieldValues>) {
  const resolvedId = fieldId ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        return (
          <FormFieldShell
            fieldId={resolvedId}
            label={label}
            required={required}
            description={description}
            errorMessage={errorMessage}
          >
            <DateField
              id={resolvedId}
              name={field.name}
              value={field.value == null ? "" : String(field.value)}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={Boolean(fieldState.error)}
              {...dateProps}
              {...getFieldErrorAriaProps(resolvedId, errorMessage)}
            />
          </FormFieldShell>
        );
      }}
    />
  );
}
