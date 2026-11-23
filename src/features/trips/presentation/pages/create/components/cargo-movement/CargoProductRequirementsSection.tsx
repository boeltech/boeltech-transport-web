/**
 * Requisitos del producto (C8): hazmat como primer control, luego clave/embalaje
 * y campos sectoriales. El padre lo envuelve en `CargoOptionalSection`.
 */

import { useState, type ReactNode } from "react";
import { Controller, type Control } from "react-hook-form";
import { AlertTriangle } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Alert, AlertDescription } from "@shared/ui/alert";
import {
  FieldInlineError,
  FormFieldShell,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
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
  /** La carga está declarada como material peligroso. */
  showHazmatFields: boolean;
  hazardousMaterial: boolean;
  hazmatSwitchDisabled: boolean;
  onHazmatChange: (checked: boolean) => void;
  hazmatErrorMessage?: string;
  hazmatDescribedBy?: string;
  catalogHint: string | null;
  catalogRequirementUnknown: boolean;
  /** Contenido extra debajo del hazmat (p. ej. badges F2). */
  leadingSlot?: ReactNode;
}

export function CargoProductRequirementsSection({
  control,
  sectorRequirements,
  missingSectorFields,
  showHazmatFields,
  hazardousMaterial,
  hazmatSwitchDisabled,
  onHazmatChange,
  hazmatErrorMessage,
  hazmatDescribedBy,
  catalogHint,
  catalogRequirementUnknown,
}: CargoProductRequirementsSectionProps) {
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const { required: requiredFields, optional: optionalFields } =
    splitSectorFieldsByRequirement(sectorRequirements);
  const visibleFields = showOptionalFields
    ? [...requiredFields, ...optionalFields]
    : requiredFields;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Checkbox
            id="cargo-hazmat-checkbox"
            checked={hazardousMaterial}
            disabled={hazmatSwitchDisabled}
            onCheckedChange={(checked) => onHazmatChange(!!checked)}
            aria-invalid={Boolean(hazmatErrorMessage) || undefined}
            aria-describedby={hazmatDescribedBy}
          />
          <Label
            htmlFor="cargo-hazmat-checkbox"
            className="flex cursor-pointer items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4 text-warning" />
            {sheet.label.isHazmat}
          </Label>
        </div>
        {catalogHint && !catalogRequirementUnknown && (
          <p
            id="cargo-hazmat-catalog-hint"
            className="text-xs text-muted-foreground"
          >
            {catalogHint}
          </p>
        )}
        {catalogHint && catalogRequirementUnknown && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription id="cargo-hazmat-catalog-hint">
              {catalogHint}
            </AlertDescription>
          </Alert>
        )}
        <FieldInlineError
          fieldId="cargo-hazmat-checkbox"
          message={hazmatErrorMessage}
        />
      </div>

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
                    {...getFieldErrorAriaProps(
                      "cargo-hazmat-code",
                      errorMessage,
                    )}
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
    </div>
  );
}
