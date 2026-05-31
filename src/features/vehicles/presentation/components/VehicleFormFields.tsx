import type { ComponentProps, ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Label } from "@shared/ui/label";
import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  FieldInlineError,
  getFieldErrorAriaProps,
  normalizeRequiredFieldLabel,
} from "@shared/ui/form";
import { cn } from "@shared/lib/utils/cn";

/** Celdas de grid: sin estirar fila al mostrar errores. */
export const VEHICLE_FORM_GRID_ITEM_CLASS =
  "flex min-h-0 flex-col gap-2 space-y-0";

function VehicleGridGrowSpacer() {
  return (
    <div className="min-h-0 min-w-0 flex-1 shrink basis-0" aria-hidden />
  );
}

export function VehicleGridField({
  fieldId,
  label,
  required,
  errorMessage,
  children,
  className,
}: {
  fieldId: string;
  label: ReactNode;
  required?: boolean;
  errorMessage?: string;
  children: ReactNode;
  className?: string;
}) {
  const { displayLabel, showRequiredMark } = normalizeRequiredFieldLabel(
    label,
    required,
  );

  return (
    <div className={cn(VEHICLE_FORM_GRID_ITEM_CLASS, className)}>
      <Label htmlFor={fieldId} className="text-sm font-medium leading-none">
        {displayLabel}
        {showRequiredMark ? <span className="text-destructive"> *</span> : null}
      </Label>
      <VehicleGridGrowSpacer />
      {children}
      <FieldInlineError fieldId={fieldId} message={errorMessage} />
    </div>
  );
}

type GridInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: ReactNode;
  required?: boolean;
  fieldId?: string;
  className?: string;
} & Omit<
  ComponentProps<typeof Input>,
  "name" | "id" | "value" | "onChange" | "onBlur" | "ref"
>;

export function VehicleGridInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  fieldId,
  className,
  ...inputProps
}: GridInputProps<T>) {
  const resolvedId = fieldId ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        return (
          <VehicleGridField
            fieldId={resolvedId}
            label={label}
            required={required}
            errorMessage={errorMessage}
            className={className}
          >
            <Input
              id={resolvedId}
              {...field}
              value={field.value == null ? "" : String(field.value)}
              error={Boolean(fieldState.error)}
              {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              {...inputProps}
            />
          </VehicleGridField>
        );
      }}
    />
  );
}

type GridNumberProps<T extends FieldValues> = GridInputProps<T> & {
  emptyAs?: "undefined" | "null";
  parse?: (raw: string) => number | undefined;
};

export function VehicleGridNumberInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  fieldId,
  className,
  emptyAs = "undefined",
  parse,
  ...inputProps
}: GridNumberProps<T>) {
  const resolvedId = fieldId ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        return (
          <VehicleGridField
            fieldId={resolvedId}
            label={label}
            required={required}
            errorMessage={errorMessage}
            className={className}
          >
            <Input
              id={resolvedId}
              type="number"
              value={field.value ?? ""}
              error={Boolean(fieldState.error)}
              {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              onChange={(event) => {
                const val = event.target.value;
                if (val === "") {
                  field.onChange(emptyAs === "null" ? null : undefined);
                  return;
                }
                if (parse) {
                  field.onChange(parse(val));
                  return;
                }
                const n = Number(val);
                field.onChange(Number.isNaN(n) ? undefined : n);
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              {...inputProps}
            />
          </VehicleGridField>
        );
      }}
    />
  );
}

export type VehicleGridSelectOption = {
  value: string;
  label: ReactNode;
};

export function VehicleGridSelect<T extends FieldValues>({
  control,
  name,
  label,
  required,
  fieldId,
  className,
  options,
  placeholder = "Seleccionar",
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: ReactNode;
  required?: boolean;
  fieldId?: string;
  className?: string;
  options: VehicleGridSelectOption[];
  placeholder?: string;
}) {
  const resolvedId = fieldId ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        const value = field.value == null ? "" : String(field.value);
        return (
          <VehicleGridField
            fieldId={resolvedId}
            label={label}
            required={required}
            errorMessage={errorMessage}
            className={className}
          >
            <Select
              value={value}
              onValueChange={(next) => {
                if (next) field.onChange(next);
              }}
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
          </VehicleGridField>
        );
      }}
    />
  );
}

export function VehicleGridCatalogSlot<T extends FieldValues>({
  control,
  name,
  label,
  required,
  fieldId,
  className,
  children,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: ReactNode;
  required?: boolean;
  fieldId?: string;
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
        <VehicleGridField
          fieldId={resolvedId}
          label={label}
          required={required}
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
        </VehicleGridField>
      )}
    />
  );
}
