import type { ReactNode } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { FormFieldShell } from "./FormFieldShell";
import { getFieldErrorAriaProps } from "./fieldErrorAria";

export type RHFSelectFieldOption = {
  value: string;
  label: ReactNode;
};

export type RHFSelectFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: ReactNode;
  options: RHFSelectFieldOption[];
  required?: boolean;
  description?: ReactNode;
  placeholder?: string;
  fieldId?: string;
  disabled?: boolean;
};

export function RHFSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  required,
  description,
  placeholder = "Seleccionar",
  fieldId,
  disabled,
}: RHFSelectFieldProps<TFieldValues>) {
  const resolvedId = fieldId ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        const rawValue = field.value == null ? "" : String(field.value).trim();
        // Radix treats value="" as empty → placeholder «Seleccionar». Enums required
        // need a real option; never bind "".
        const resolvedValue =
          rawValue.length > 0 ? rawValue : (options[0]?.value ?? undefined);
        return (
          <FormFieldShell
            fieldId={resolvedId}
            label={label}
            required={required}
            description={description}
            errorMessage={errorMessage}
          >
            <Select
              key={`${String(name)}-${resolvedValue ?? "empty"}`}
              value={resolvedValue}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={resolvedId}
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldShell>
        );
      }}
    />
  );
}
