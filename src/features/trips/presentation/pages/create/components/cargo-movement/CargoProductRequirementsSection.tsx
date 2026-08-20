/**
 * Requisitos que el catálogo del producto exige para esta mercancía.
 *
 * Sustituye a las secciones separadas de material peligroso y datos sectoriales:
 * solo se renderiza cuando algo es exigible y, dentro, solo los campos marcados
 * como obligatorios por `sectorRequirements`. El resto queda tras un enlace
 * secundario para casos en que el usuario quiera capturarlos de todos modos.
 *
 * La fuente de obligatoriedad sigue siendo `@boeltech/cfdi-domain`
 * (`extractCargoRegulatoryFlags` / `getMissingSectorRequiredFields`); aquí solo
 * se decide qué mostrar.
 */

import { useState } from "react";
import { Controller, type Control } from "react-hook-form";
import { ClipboardList } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { FormFieldShell, RHFTextField, getFieldErrorAriaProps } from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import {
  MaterialPeligrosoSearch,
  TipoEmbalajeSelect,
} from "@features/catalogs";

import {
  sectorFieldLabels,
  type CargoSectorRequirements,
} from "../cargoRegulatory";
import { splitSectorFieldsByRequirement } from "./cargoRequirementFields";
import { wizardCopy } from "../../../../copy";
import type { TripCargoFormValues } from "../validation";

const sheet = wizardCopy.cargo.sheet;

/** `fechaCaducidad` se captura con selector de fecha, el resto es texto libre. */
type SectorTextField = Exclude<keyof CargoSectorRequirements, "fechaCaducidad">;

export interface CargoProductRequirementsSectionProps {
  control: Control<TripCargoFormValues>;
  /** Campos exigidos por el catálogo del producto. */
  sectorRequirements?: CargoSectorRequirements;
  /** Exigidos y aún vacíos (calculado con el paquete de dominio). */
  missingSectorFields: Array<keyof CargoSectorRequirements>;
  /** La mercancía está declarada como material peligroso. */
  showHazmatFields: boolean;
}

export function CargoProductRequirementsSection({
  control,
  sectorRequirements,
  missingSectorFields,
  showHazmatFields,
}: CargoProductRequirementsSectionProps) {
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const { required: requiredFields, optional: optionalFields } =
    splitSectorFieldsByRequirement(sectorRequirements);
  const visibleFields = showOptionalFields
    ? [...requiredFields, ...optionalFields]
    : requiredFields;

  return (
    <FormSectionCard
      title={sheet.section.requirements}
      description={
        requiredFields.length > 0 || showHazmatFields
          ? sheet.hint.requirements
          : sheet.hint.requirementsOptional
      }
      icon={<ClipboardList className="h-4 w-4" />}
      contentClassName="space-y-4"
    >
      {showHazmatFields && (
        <div className="space-y-4">
          <Controller
            control={control}
            name="hazardousMaterialCode"
            render={({ field, fieldState }) => {
              const errorMessage = fieldState.error?.message;
              return (
              <FormFieldShell
                fieldId="cargo-hazmat-code"
                label={sheet.label.hazmatCode}
                required
                errorMessage={errorMessage}
              >
                <MaterialPeligrosoSearch
                  id="cargo-hazmat-code"
                  value={field.value || null}
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps("cargo-hazmat-code", errorMessage)}
                  onSelect={(item) => field.onChange(item.code)}
                  onClear={() => field.onChange("")}
                />
              </FormFieldShell>
              );
            }}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              control={control}
              name="packagingType"
              render={({ field, fieldState }) => {
                const errorMessage = fieldState.error?.message;
                return (
                <FormFieldShell
                  fieldId="cargo-packaging-type"
                  label={sheet.label.packagingType}
                  required
                  errorMessage={errorMessage}
                >
                  <TipoEmbalajeSelect
                    triggerId="cargo-packaging-type"
                    value={field.value || ""}
                    onValueChange={(value) => field.onChange(value)}
                    placeholder={sheet.placeholder.packagingType}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(
                      "cargo-packaging-type",
                      errorMessage,
                    )}
                  />
                </FormFieldShell>
                );
              }}
            />

            <RHFTextField
              control={control}
              name="packagingDescription"
              fieldId="cargo-packaging-description"
              label={sheet.label.packagingDescription}
              required
              placeholder={sheet.placeholder.packagingDescription}
            />
          </div>
        </div>
      )}

      {visibleFields.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleFields.map((fieldName) =>
            fieldName === "fechaCaducidad" ? (
              <Controller
                key={fieldName}
                control={control}
                name="fechaCaducidad"
                render={({ field, fieldState }) => {
                  const errorMessage = fieldState.error?.message;
                  return (
                    <FormFieldShell
                      fieldId="cargo-fecha-caducidad"
                      label={sheet.label.expiryDate}
                      required={Boolean(sectorRequirements?.fechaCaducidad)}
                      errorMessage={errorMessage}
                    >
                      <Input
                        id="cargo-fecha-caducidad"
                        type="date"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={Boolean(fieldState.error)}
                        {...getFieldErrorAriaProps(
                          "cargo-fecha-caducidad",
                          errorMessage,
                        )}
                      />
                    </FormFieldShell>
                  );
                }}
              />
            ) : (
              <RHFTextField
                key={fieldName}
                control={control}
                name={fieldName as SectorTextField}
                fieldId={`cargo-${fieldName}`}
                label={sheet.sectorLabel[fieldName as SectorTextField]}
                required={Boolean(sectorRequirements?.[fieldName])}
              />
            ),
          )}
        </div>
      )}

      {missingSectorFields.length > 0 && (
        <p className="text-xs text-warning">
          {sheet.hint.pendingFields}{" "}
          {missingSectorFields
            .map((field) => sectorFieldLabels[field])
            .join(", ")}
        </p>
      )}

      {optionalFields.length > 0 && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-sm"
          onClick={() => setShowOptionalFields((prev) => !prev)}
        >
          {showOptionalFields
            ? sheet.action.hideExtraProductFields
            : sheet.action.showAllProductFields}
        </Button>
      )}
    </FormSectionCard>
  );
}
