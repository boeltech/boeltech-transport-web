import { Controller, type Control } from "react-hook-form";
import { Scale } from "lucide-react";

import { Input } from "@shared/ui/input";
import { AlertWithIcon } from "@shared/ui/alert";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { wizardCopy } from "../../../../copy";

import type { TripCargoFormValues } from "../validation";

const sheet = wizardCopy.cargo.sheet;

export interface CargoMovementSheetQuantityWeightSectionProps {
  control: Control<TripCargoFormValues>;
  satUnitName: string;
  wouldExceedCapacity: boolean;
  isNearCapacityProjection: boolean;
  vehicleCapacityKg?: number;
  projectedWeight: number;
  /** Peso libre en la unidad antes de esta mercancía; `null` si no hay capacidad. */
  availableKg: number | null;
  formatWeight: (value: number) => string;
}

export function CargoMovementSheetQuantityWeightSection({
  control,
  satUnitName,
  wouldExceedCapacity,
  isNearCapacityProjection,
  vehicleCapacityKg,
  projectedWeight,
  availableKg,
  formatWeight,
}: CargoMovementSheetQuantityWeightSectionProps) {
  const availabilityHint =
    availableKg == null
      ? undefined
      : availableKg < 0
        ? sheet.format.overCapacityWeight(formatWeight(Math.abs(availableKg)))
        : sheet.format.availableWeight(formatWeight(availableKg));

  return (
    <FormSectionCard
      title={sheet.section.quantity}
      icon={<Scale className="h-4 w-4" />}
      contentClassName="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2 [&_label]:min-h-5">
        <Controller
          control={control}
          name="units"
          render={({ field, fieldState }) => {
            const errorMessage = fieldState.error?.message;
            return (
              <FormFieldShell
                fieldId="cargo-units"
                label={sheet.label.units}
                required
                errorMessage={errorMessage}
              >
                <div className="flex gap-2">
                  <Input
                    id="cargo-units"
                    type="number"
                    min="1"
                    placeholder={sheet.placeholder.units}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    onBlur={field.onBlur}
                    className="flex-1"
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps("cargo-units", errorMessage)}
                  />
                  <span className="flex min-w-[60px] items-center text-sm text-muted-foreground">
                    {satUnitName}
                  </span>
                </div>
              </FormFieldShell>
            );
          }}
        />

        <Controller
          control={control}
          name="weightInKg"
          render={({ field, fieldState }) => {
            const errorMessage = fieldState.error?.message;
            return (
              <FormFieldShell
                fieldId="cargo-weight-kg"
                label={sheet.label.weight}
                required
                description={availabilityHint}
                errorMessage={errorMessage}
              >
                <div className="flex gap-2">
                  <Input
                    id="cargo-weight-kg"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={sheet.placeholder.weight}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    onBlur={field.onBlur}
                    className="flex-1"
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps("cargo-weight-kg", errorMessage)}
                  />
                  <span
                    className="flex min-w-[60px] items-center text-sm invisible select-none"
                    aria-hidden
                  >
                    {satUnitName}
                  </span>
                </div>
              </FormFieldShell>
            );
          }}
        />
      </div>

      {wouldExceedCapacity && vehicleCapacityKg ? (
        <AlertWithIcon
          variant="destructive"
          title={sheet.capacityAlert.exceededTitle}
        >
          {sheet.format.capacityProjection(
            formatWeight(projectedWeight),
            formatWeight(vehicleCapacityKg),
            (projectedWeight / vehicleCapacityKg) * 100,
          )}
        </AlertWithIcon>
      ) : null}
      {!wouldExceedCapacity && isNearCapacityProjection && vehicleCapacityKg ? (
        <AlertWithIcon variant="warning" title={sheet.capacityAlert.nearTitle}>
          {sheet.format.capacityProjection(
            formatWeight(projectedWeight),
            formatWeight(vehicleCapacityKg),
            (projectedWeight / vehicleCapacityKg) * 100,
          )}
        </AlertWithIcon>
      ) : null}
    </FormSectionCard>
  );
}
