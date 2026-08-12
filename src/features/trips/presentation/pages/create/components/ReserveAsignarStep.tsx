/**
 * Paso 2 del wizard de reserva (ADR-0071): unidad, conductor, tarifa y km inicial.
 */
import { useEffect } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

import { FormFieldShell, getFieldErrorAriaProps, RHFMoneyField } from "@shared/ui/form";
import { Input } from "@shared/ui/input";

import type { AssignableVehicleItem } from "@features/vehicles/domain";
import type { AssignableDriverItem } from "../tripAssignmentDrivers";
import type { TripWizardFormValues } from "./validation";
import { TripAssignmentResourceFields } from "./TripAssignmentResourceFields";
import { wizardCopy } from "../../../copy";

const shell = wizardCopy.shell;
const reserve = shell.reserve;
const basic = wizardCopy.basicInfo;

interface ReserveAsignarStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  vehicles: AssignableVehicleItem[];
  drivers: AssignableDriverItem[];
  isLoadingVehicles: boolean;
  isLoadingDrivers: boolean;
}

export function ReserveAsignarStep({
  form,
  vehicles,
  drivers,
  isLoadingVehicles,
  isLoadingDrivers,
}: ReserveAsignarStepProps) {
  const { control, watch, setValue } = form;
  const selectedVehicleId = watch("vehicleId");

  useEffect(() => {
    if (!selectedVehicleId) return;
    const vehicle = vehicles.find((item) => item.id === selectedVehicleId);
    if (!vehicle) return;
    const mileage =
      typeof vehicle.currentMileage === "number" &&
      Number.isFinite(vehicle.currentMileage)
        ? vehicle.currentMileage
        : undefined;
    setValue("vehicleCurrentMileage", mileage, { shouldDirty: false });
    setValue("startMileage", mileage, { shouldDirty: false, shouldValidate: true });
  }, [selectedVehicleId, vehicles, setValue]);

  const vehicleCurrentMileage = watch("vehicleCurrentMileage");

  return (
    <div className="space-y-6">
      <TripAssignmentResourceFields
        form={form}
        vehicles={vehicles}
        drivers={drivers}
        isLoadingVehicles={isLoadingVehicles}
        isLoadingDrivers={isLoadingDrivers}
        idPrefix="reserve-"
        density="reserve"
      />

      <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <div className="max-w-sm">
          <RHFMoneyField
            control={control}
            name="baseRate"
            label={reserve.label.baseRate}
            description={reserve.hint.baseRate}
          />
        </div>

        <Controller
          control={control}
          name="startMileage"
          render={({ field, fieldState }) => (
            <FormFieldShell
              fieldId="reserve-startMileage"
              label={basic.label.startMileage}
              required
              errorMessage={fieldState.error?.message}
              description={
                vehicleCurrentMileage !== undefined
                  ? basic.format.currentMileage(vehicleCurrentMileage)
                  : "Captura el odómetro al salir; se usa al confirmar e iniciar el viaje."
              }
            >
              <Input
                id="reserve-startMileage"
                type="number"
                placeholder={basic.placeholder.startMileage}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(
                  "reserve-startMileage",
                  fieldState.error?.message,
                )}
              />
            </FormFieldShell>
          )}
        />
      </div>
    </div>
  );
}
