import { Controller, type Control, type UseFormGetValues, type UseFormSetValue } from "react-hook-form";
import { FileText } from "lucide-react";

import { Input } from "@shared/ui/input";
import { FormFieldShell, RHFTextField } from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import {
  ProductoServicioCPSearch,
  UnidadMedidaSearch,
} from "@features/catalogs";
import { extractCargoRegulatoryFlags } from "../cargoRegulatory";

import type { TripCargoFormValues } from "../validation";

export interface CargoMovementSheetProductSectionProps {
  control: Control<TripCargoFormValues>;
  setValue: UseFormSetValue<TripCargoFormValues>;
  getValues: UseFormGetValues<TripCargoFormValues>;
  onHazmatSectionOpen: () => void;
}

export function CargoMovementSheetProductSection({
  control,
  setValue,
  getValues,
  onHazmatSectionOpen,
}: CargoMovementSheetProductSectionProps) {
  return (
    <FormSectionCard
      title="Producto y unidad de medida"
      icon={<FileText className="h-4 w-4" />}
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
              label="Producto o servicio transportado"
              required
              description="Elija del catálogo de mercancías y servicios; puede buscar por nombre o por clave. El sistema enlaza la clave al timbrado."
              errorMessage={errorMessage}
            >
              <ProductoServicioCPSearch
                value={field.value || null}
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
                    onHazmatSectionOpen();
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
        label="Descripción de la mercancía"
        required
        placeholder="Se completa al elegir del catálogo; puede editarla..."
        description="Se completa al elegir el producto del catálogo; puede ajustarla para mayor detalle operativo."
      />

      <Controller
        control={control}
        name="satUnitCode"
        render={({ field, fieldState }) => {
          const errorMessage = fieldState.error?.message;
          return (
            <FormFieldShell
              fieldId="cargo-sat-unit"
              label="Unidad de medida"
              required
              description="El sistema conserva la unidad elegida del catálogo para la documentación fiscal."
              errorMessage={errorMessage}
            >
              <UnidadMedidaSearch
                value={field.value || null}
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

      <Controller
        control={control}
        name="currency"
        render={({ field }) => (
          <FormFieldShell
            fieldId="cargo-currency"
            label="Moneda SAT"
            description="En v1 nacional se usa MXN por defecto para la mercancía."
          >
            <Input
              id="cargo-currency"
              value={field.value || "MXN"}
              disabled
              className="bg-muted"
            />
          </FormFieldShell>
        )}
      />
    </FormSectionCard>
  );
}
