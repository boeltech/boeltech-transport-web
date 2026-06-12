import type { ReactNode } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { FormFieldShell } from "./FormFieldShell";
import { getFieldErrorAriaProps } from "./fieldErrorAria";
import { MoneyInput, type MoneyInputProps } from "./MoneyInput";

export type RHFMoneyFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: ReactNode;
  required?: boolean;
  description?: ReactNode;
  fieldId?: string;
} & Omit<
  MoneyInputProps,
  "name" | "id" | "value" | "onValueChange" | "onBlur" | "ref"
>;

export function RHFMoneyField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  fieldId,
  ...moneyProps
}: RHFMoneyFieldProps<TFieldValues>) {
  const resolvedId = fieldId ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        const resolvedValue =
          typeof field.value === "number" && Number.isFinite(field.value)
            ? field.value
            : undefined;

        return (
          <FormFieldShell
            fieldId={resolvedId}
            label={label}
            required={required}
            description={description}
            errorMessage={errorMessage}
          >
            <MoneyInput
              id={resolvedId}
              name={field.name}
              value={resolvedValue}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={Boolean(fieldState.error)}
              {...moneyProps}
              {...getFieldErrorAriaProps(resolvedId, errorMessage)}
            />
          </FormFieldShell>
        );
      }}
    />
  );
}
