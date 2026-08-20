import type { ReactNode } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { DateTimeField, type DateTimeFieldProps } from "./DateTimeField";
import { FormFieldShell } from "./FormFieldShell";
import { getFieldErrorAriaProps } from "./fieldErrorAria";

export type RHFDateTimeFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: ReactNode;
  required?: boolean;
  description?: ReactNode;
  fieldId?: string;
} & Omit<
  DateTimeFieldProps,
  "id" | "name" | "value" | "onChange" | "onBlur"
>;

export function RHFDateTimeField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  fieldId,
  ...dateTimeProps
}: RHFDateTimeFieldProps<TFieldValues>) {
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
            <DateTimeField
              id={resolvedId}
              name={field.name}
              value={field.value == null ? "" : String(field.value)}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={Boolean(fieldState.error)}
              {...dateTimeProps}
              {...getFieldErrorAriaProps(resolvedId, errorMessage)}
            />
          </FormFieldShell>
        );
      }}
    />
  );
}
