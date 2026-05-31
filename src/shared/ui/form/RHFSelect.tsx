import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { FieldInlineError } from "./FieldInlineError";
import { getFieldErrorAriaProps } from "./fieldErrorAria";

export type RHFSelectOption = {
  value: string;
  label: string;
};

type RHFSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  options: RHFSelectOption[];
  allowNone?: boolean;
  placeholder?: string;
  noneLabel?: string;
  noneValue?: string;
  /** `id` del trigger; por defecto el nombre del campo. */
  triggerId?: string;
  /** Muestra asterisco en un label externo; este componente no renderiza label. */
  showFieldError?: boolean;
};

export function RHFSelect<TFieldValues extends FieldValues>({
  control,
  name,
  options,
  allowNone = true,
  placeholder = "Seleccionar",
  noneLabel = "Sin especificar",
  noneValue = "__none__",
  triggerId,
  showFieldError = true,
}: RHFSelectProps<TFieldValues>) {
  const resolvedTriggerId = triggerId ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const rawValue = field.value as string | undefined | null;
        const normalizedValue = typeof rawValue === "string" ? rawValue.trim() : rawValue;
        const resolvedValue =
          normalizedValue && normalizedValue.length > 0
            ? normalizedValue
            : allowNone
              ? noneValue
              : (options[0]?.value ?? "");
        const errorMessage = fieldState.error?.message;

        return (
          <div className="space-y-2">
            <Select
              key={`${String(name)}-${resolvedValue}`}
              value={resolvedValue}
              onValueChange={(value) =>
                field.onChange(allowNone && value === noneValue ? undefined : value)
              }
            >
              <SelectTrigger
                id={resolvedTriggerId}
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(resolvedTriggerId, errorMessage)}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {allowNone && <SelectItem value={noneValue}>{noneLabel}</SelectItem>}
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showFieldError ? (
              <FieldInlineError fieldId={resolvedTriggerId} message={errorMessage} />
            ) : null}
          </div>
        );
      }}
    />
  );
}
