/**
 * Paso 2 del wizard de reserva (ADR-0071): unidad y conductor.
 * Tarifa y km viven en «Completar al confirmar» (PD1).
 */
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { AssignableVehicleItem } from "@features/vehicles/domain";
import type { AssignableDriverItem } from "../tripAssignmentDrivers";
import type { TripWizardFormValues } from "./validation";
import { TripAssignmentResourceFields } from "./TripAssignmentResourceFields";

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
  const { watch, setValue } = form;
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
    if (form.getValues("startMileage") == null && mileage != null) {
      setValue("startMileage", mileage, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [selectedVehicleId, vehicles, setValue, form]);

  return (
    <TripAssignmentResourceFields
      form={form}
      vehicles={vehicles}
      drivers={drivers}
      isLoadingVehicles={isLoadingVehicles}
      isLoadingDrivers={isLoadingDrivers}
      idPrefix="reserve-"
      density="reserve"
    />
  );
}
