import { Controller, type Control, type UseFormSetValue } from "react-hook-form";
import { Scale } from "lucide-react";

import { Input } from "@shared/ui/input";
import { Progress } from "@shared/ui/progress";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  FormFieldShell,
  MoneyInput,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { UnidadMedidaSearch } from "@features/catalogs";
import { wizardCopy } from "../../../../copy";

import type { TripCargoFormValues } from "../validation";

const sheet = wizardCopy.cargo.sheet;

export interface CargoMovementSheetQuantityWeightSectionProps {
  control: Control<TripCargoFormValues>;
  setValue: UseFormSetValue<TripCargoFormValues>;
  wouldExceedCapacity: boolean;
  isNearCapacityProjection: boolean;
  vehicleCapacityKg?: number;
  /** Número de unidad del viaje; distingue «sin flota» vs «sin capacidad en catálogo». */
  vehicleUnitNumber?: string | null;
  projectedWeight: number;
  /** Peso libre en la unidad antes de esta carga; `null` si no hay capacidad. */
  availableKg: number | null;
  formatWeight: (value: number) => string;
  /** C9: borde destructive cuando la sección tiene el primer error. */
  className?: string;
}

export function CargoMovementSheetQuantityWeightSection({
  control,
  setValue,
  wouldExceedCapacity,
  isNearCapacityProjection,
  vehicleCapacityKg,
  vehicleUnitNumber = null,
  projectedWeight,
  availableKg,
  formatWeight,
  className,
}: CargoMovementSheetQuantityWeightSectionProps) {
  const hasCapacity =
    vehicleCapacityKg != null && vehicleCapacityKg > 0;
  const unitAssigned = Boolean(vehicleUnitNumber?.trim());
  const occupancyPct = hasCapacity
    ? Math.min(100, Math.round((projectedWeight / vehicleCapacityKg) * 100))
    : 0;
  const remainingAfter = hasCapacity
    ? Math.max(0, vehicleCapacityKg - projectedWeight)
    : 0;

  const meterHint = hasCapacity
    ? sheet.hint.capacityMeter(
        Math.round(projectedWeight).toLocaleString("es-MX"),
        Math.round(vehicleCapacityKg).toLocaleString("es-MX"),
        occupancyPct,
        Math.round(remainingAfter).toLocaleString("es-MX"),
      )
    : unitAssigned
      ? sheet.hint.capacityNoCapacityKnown
      : sheet.hint.capacityNoVehicle;

  return (
    <FormSectionCard
      title={sheet.section.quantity}
      icon={<Scale className="h-4 w-4" />}
      className={className}
      contentClassName="space-y-4"
    >
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 [&_label]:min-h-5">
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
                  className="min-w-0 tabular-nums font-mono"
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps("cargo-units", errorMessage)}
                />
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
                errorMessage={errorMessage}
              >
                <MoneyInput
                  id="cargo-weight-kg"
                  currencyCode=""
                  decimals={2}
                  locale="es-MX"
                  className="min-w-0 w-full font-mono"
                  placeholder={sheet.placeholder.weight}
                  value={field.value}
                  onValueChange={(next) => field.onChange(next)}
                  onBlur={field.onBlur}
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps("cargo-weight-kg", errorMessage)}
                />
              </FormFieldShell>
            );
          }}
        />
      </div>

      <div className="space-y-1.5">
        {hasCapacity ? (
          <Progress
            value={occupancyPct}
            className="h-1.5"
            indicatorClassName={
              wouldExceedCapacity
                ? "bg-destructive"
                : isNearCapacityProjection
                  ? "bg-warning"
                  : undefined
            }
            aria-label={meterHint}
          />
        ) : null}
        <p className="text-xs text-muted-foreground">{meterHint}</p>
        {availableKg != null && availableKg < 0 && !wouldExceedCapacity ? (
          <p className="text-xs text-destructive">
            {sheet.format.overCapacityWeight(
              formatWeight(Math.abs(availableKg)),
            )}
          </p>
        ) : null}
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
