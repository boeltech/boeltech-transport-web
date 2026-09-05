import { memo, useCallback } from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Label } from "@shared/ui/label";
import { FieldInlineError } from "@shared/ui/form";
import {
  SatCatalogCombobox,
  type SatCatalogOption,
} from "./SatCatalogCombobox";
import { satCatalogComboboxCopy } from "./satCatalogComboboxCopy";
import { resolveCatalogCode } from "./satCatalogCodeUtils";

function getFieldPath(prefix: string, field: string): string {
  if (!prefix) return field;
  return `${prefix}.${field}`;
}

export type AddressCatalogOrManualFieldProps<
  TFieldValues extends FieldValues = FieldValues,
> = {
  control: Control<TFieldValues>;
  namePrefix: string;
  codeFieldName: string;
  nameFieldName: string;
  options: SatCatalogOption[];
  label: string;
  required?: boolean;
  catalogPlaceholder: string;
  catalogSearchPlaceholder: string;
  catalogEmptyText?: string;
  catalogAriaLabel: string;
  disabled?: boolean;
  loading?: boolean;
  /** When true, FieldInlineError prefers name error, then code error. */
  preferNameError?: boolean;
  /** CP de 5 dígitos para desambiguar short codes `{CP}-{colonia}`. */
  postalCode?: string | null;
};

function AddressCatalogOrManualFieldInner<
  TFieldValues extends FieldValues = FieldValues,
>({
  control,
  namePrefix,
  codeFieldName,
  nameFieldName,
  options,
  label,
  required = false,
  catalogPlaceholder,
  catalogSearchPlaceholder,
  catalogEmptyText,
  catalogAriaLabel,
  disabled = false,
  loading = false,
  preferNameError = true,
  postalCode = null,
}: AddressCatalogOrManualFieldProps<TFieldValues>) {
  const codePath = getFieldPath(namePrefix, codeFieldName) as Path<TFieldValues>;
  const namePath = getFieldPath(namePrefix, nameFieldName) as Path<TFieldValues>;

  const codeController = useController({ control, name: codePath });
  const nameController = useController({ control, name: namePath });

  const catalogId = `${namePrefix || "address"}-${codeFieldName}`;

  const codeRaw = String(codeController.field.value ?? "").trim();
  const catalogValue = resolveCatalogCode(codeRaw, options, postalCode);
  const displayName = String(nameController.field.value ?? "");

  const errorMessage = preferNameError
    ? (nameController.fieldState.error?.message ??
      codeController.fieldState.error?.message)
    : (codeController.fieldState.error?.message ??
      nameController.fieldState.error?.message);

  const handleCatalogChange = useCallback(
    (code: string) => {
      if (!code) {
        codeController.field.onChange("");
        return;
      }
      const selected = options.find((item) => item.code === code);
      // Persist the exact catalog code (no short truncation — avoids CP collisions).
      codeController.field.onChange(code);
      nameController.field.onChange(selected?.name ?? "");
    },
    [codeController.field, nameController.field, options],
  );

  const handleFreeTextSelect = useCallback(
    (name: string) => {
      nameController.field.onChange(name);
      if (String(codeController.field.value ?? "").trim()) {
        codeController.field.onChange("");
      }
    },
    [codeController.field, nameController.field],
  );

  const handleClear = useCallback(() => {
    codeController.field.onChange("");
    nameController.field.onChange("");
  }, [codeController.field, nameController.field]);

  return (
    <div className="space-y-2">
      <Label htmlFor={catalogId}>
        {label}
        {required ? " *" : ""}
      </Label>
      <SatCatalogCombobox
        id={catalogId}
        options={options}
        value={catalogValue}
        displayName={displayName}
        onValueChange={handleCatalogChange}
        allowFreeText
        onFreeTextSelect={handleFreeTextSelect}
        allowClear
        onClear={handleClear}
        freeTextLabel={satCatalogComboboxCopy.useAsFreeText}
        emptyNoCatalogText={satCatalogComboboxCopy.emptyNoCatalog}
        placeholder={catalogPlaceholder}
        searchPlaceholder={catalogSearchPlaceholder}
        emptyText={catalogEmptyText}
        aria-label={catalogAriaLabel}
        disabled={disabled}
        loading={loading}
        postalCode={postalCode}
        error={Boolean(
          codeController.fieldState.error || nameController.fieldState.error,
        )}
        errorMessage={errorMessage}
      />
      <FieldInlineError fieldId={catalogId} message={errorMessage} />
    </div>
  );
}

export const AddressCatalogOrManualField = memo(
  AddressCatalogOrManualFieldInner,
) as typeof AddressCatalogOrManualFieldInner;
