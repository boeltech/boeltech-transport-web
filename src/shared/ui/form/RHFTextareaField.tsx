import type { ComponentProps, ReactNode } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { FormFieldShell } from "./FormFieldShell";
import { getFieldErrorAriaProps } from "./fieldErrorAria";
import { Textarea } from "@shared/ui/text-area";

export type RHFTextareaFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: ReactNode;
  required?: boolean;
  description?: ReactNode;
  fieldId?: string;
} & Omit<
  ComponentProps<typeof Textarea>,
  "name" | "id" | "value" | "onChange" | "onBlur" | "ref"
>;

export function RHFTextareaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  fieldId,
  ...textareaProps
}: RHFTextareaFieldProps<TFieldValues>) {
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
            <Textarea
              id={resolvedId}
              {...field}
              value={field.value == null ? "" : String(field.value)}
              {...textareaProps}
              error={Boolean(fieldState.error)}
              {...getFieldErrorAriaProps(resolvedId, errorMessage)}
            />
          </FormFieldShell>
        );
      }}
    />
  );
}
