import { Controller, type Control, type UseFormGetValues, type UseFormSetValue } from "react-hook-form";
import { Package } from "lucide-react";

import { FormFieldShell, RHFTextField, getFieldErrorAriaProps } from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import {
  ProductoServicioCPSearch,
  UnidadMedidaSearch,
} from "@features/catalogs";
import { extractCargoRegulatoryFlags } from "../cargoRegulatory";
import { wizardCopy } from "../../../../copy";

import type { TripCargoFormValues } from "../validation";

const sheet = wizardCopy.cargo.sheet;

export interface CargoMovementSheetProductSectionProps {
  control: Control<TripCargoFormValues>;
  setValue: UseFormSetValue<TripCargoFormValues>;
  getValues: UseFormGetValues<TripCargoFormValues>;
}

export function CargoMovementSheetProductSection({
  control,
  setValue,
  getValues,
}: CargoMovementSheetProductSectionProps) {
  return (
    <FormSectionCard
      title={sheet.section.product}
      icon={<Package className="h-4 w-4" />}
      contentClassName="space-y-4"
    >
      <Controller
        control={control}
        name="satProductCode"
        render={({ field, fieldState }) => {
          const errorMessage = fieldState.error?.message;
          return (
            <FormFieldShell
              fieldId="cargo-sat-product"
              label={sheet.label.product}
              required
              description={sheet.hint.product}
              errorMessage={errorMessage}
            >
              <ProductoServicioCPSearch
                id="cargo-sat-product"
                value={field.value || null}
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps("cargo-sat-product", errorMessage)}
                onSelect={(item) => {
                  const flags = extractCargoRegulatoryFlags(item.metadata);
                  setValue("satProductCode", item.code, { shouldDirty: true });
                  setValue("satProductDescription", item.name, {
                    shouldDirty: true,
                  });
                  if (!getValues("description")?.trim()) {
                    setValue("description", item.name, { shouldDirty: true });
                  }
                  setValue("requiresHazmat", flags.requiresHazmat, {
                    shouldDirty: true,
                  });
                  if (flags.requiresHazmat) {
                    setValue("hazardousMaterial", true, { shouldDirty: true });
                  }
                  setValue(
                    "sectorRequirements",
                    flags.sectorRequirements ?? {},
                    { shouldDirty: true },
                  );
                }}
                onClear={() => {
                  setValue("satProductCode", "", { shouldDirty: true });
                  setValue("satProductDescription", "", { shouldDirty: true });
                  setValue("requiresHazmat", false, { shouldDirty: true });
                  setValue("sectorRequirements", {}, { shouldDirty: true });
                }}
              />
            </FormFieldShell>
          );
        }}
      />

      <RHFTextField
        control={control}
        name="description"
        fieldId="cargo-description"
        label={sheet.label.description}
        required
        placeholder={sheet.placeholder.description}
        description={sheet.hint.description}
      />

      <Controller
        control={control}
        name="satUnitCode"
        render={({ field, fieldState }) => {
          const errorMessage = fieldState.error?.message;
          return (
            <FormFieldShell
              fieldId="cargo-sat-unit"
              label={sheet.label.unit}
              required
              description={sheet.hint.unit}
              errorMessage={errorMessage}
            >
              <UnidadMedidaSearch
                id="cargo-sat-unit"
                value={field.value || null}
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps("cargo-sat-unit", errorMessage)}
                onSelect={(item) => {
                  setValue("satUnitCode", item.code, { shouldDirty: true });
                  setValue("satUnitName", item.name, { shouldDirty: true });
                }}
                onClear={() => {
                  setValue("satUnitCode", "", { shouldDirty: true });
                  setValue("satUnitName", "", { shouldDirty: true });
                }}
              />
            </FormFieldShell>
          );
        }}
      />
    </FormSectionCard>
  );
}
