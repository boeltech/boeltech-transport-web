import { Controller, type Control } from "react-hook-form";
import { AlertTriangle, Gauge, Scale } from "lucide-react";

import { Input } from "@shared/ui/input";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";

import type { TripCargoFormValues } from "../validation";

export interface CargoMovementSheetQuantityWeightSectionProps {
  control: Control<TripCargoFormValues>;
  satUnitName: string;
  wouldExceedCapacity: boolean;
  isNearCapacityProjection: boolean;
  vehicleCapacityKg?: number;
  projectedWeight: number;
  formatWeight: (value: number) => string;
}

export function CargoMovementSheetQuantityWeightSection({
  control,
  satUnitName,
  wouldExceedCapacity,
  isNearCapacityProjection,
  vehicleCapacityKg,
  projectedWeight,
  formatWeight,
}: CargoMovementSheetQuantityWeightSectionProps) {
  return (
    <FormSectionCard
      title="Cantidad y peso"
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
                label="Cantidad"
                required
                errorMessage={errorMessage}
              >
                <div className="flex gap-2">
                  <Input
                    id="cargo-units"
                    type="number"
                    min="1"
                    placeholder="0"
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
                label="Peso total (kg)"
                required
                errorMessage={errorMessage}
              >
                <div className="flex gap-2">
                  <Input
                    id="cargo-weight-kg"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
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
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive-soft p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          <div className="text-xs text-destructive-soft-foreground">
            <p className="font-medium">
              ¡Esta carga excederá la capacidad del vehículo!
            </p>
            <p className="mt-1">
              Peso proyectado: {formatWeight(projectedWeight)} /{" "}
              {formatWeight(vehicleCapacityKg)} (
              {((projectedWeight / vehicleCapacityKg) * 100).toFixed(1)}%)
            </p>
          </div>
        </div>
      ) : null}
      {!wouldExceedCapacity && isNearCapacityProjection && vehicleCapacityKg ? (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3">
          <Gauge className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
          <div className="text-xs text-warning-soft-foreground">
            <p className="font-medium">Capacidad casi al límite</p>
            <p className="mt-1">
              Peso proyectado: {formatWeight(projectedWeight)} /{" "}
              {formatWeight(vehicleCapacityKg)} (
              {((projectedWeight / vehicleCapacityKg) * 100).toFixed(1)}%)
            </p>
          </div>
        </div>
      ) : null}
    </FormSectionCard>
  );
}
