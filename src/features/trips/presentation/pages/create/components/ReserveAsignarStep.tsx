/**
 * Paso 2 del wizard de reserva (ADR-0071): unidad, conductor y tarifa.
 */
import { type UseFormReturn } from "react-hook-form";

import { RHFMoneyField } from "@shared/ui/form";

import type { AssignableVehicleItem } from "@features/vehicles/domain";
import type { AssignableDriverItem } from "../tripAssignmentDrivers";
import type { TripWizardFormValues } from "./validation";
import { TripAssignmentResourceFields } from "./TripAssignmentResourceFields";
import { wizardCopy } from "../../../copy";

const shell = wizardCopy.shell;
const reserve = shell.reserve;

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
  const { control } = form;

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

      <div className="max-w-sm">
        <RHFMoneyField
          control={control}
          name="baseRate"
          label={reserve.label.baseRate}
          description={reserve.hint.baseRate}
        />
      </div>
    </div>
  );
}
