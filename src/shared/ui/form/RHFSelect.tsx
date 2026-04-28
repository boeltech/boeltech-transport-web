import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

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
};

export function RHFSelect<TFieldValues extends FieldValues>({
  control,
  name,
  options,
  allowNone = true,
  placeholder = "Seleccionar",
  noneLabel = "Sin especificar",
  noneValue = "__none__",
}: RHFSelectProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        (() => {
          const rawValue = field.value as string | undefined | null;
          const normalizedValue = typeof rawValue === "string" ? rawValue.trim() : rawValue;
          const resolvedValue =
            normalizedValue && normalizedValue.length > 0
              ? normalizedValue
              : allowNone
                ? noneValue
                : (options[0]?.value ?? "");
          return (
        <Select
          key={`${String(name)}-${resolvedValue}`}
          value={resolvedValue}
          onValueChange={(value) =>
            field.onChange(allowNone && value === noneValue ? undefined : value)
          }
        >
          <SelectTrigger>
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
          );
        })()
      )}
    />
  );
}
