/**
 * Paso 2 del wizard de reserva (ADR-0071): asignación de unidad y conductor.
 */
import { type UseFormReturn } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{shell.step.asignar.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {shell.step.asignar.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <TripAssignmentResourceFields
            form={form}
            vehicles={vehicles}
            drivers={drivers}
            isLoadingVehicles={isLoadingVehicles}
            isLoadingDrivers={isLoadingDrivers}
            idPrefix="reserve-"
          />

          <div className="max-w-sm">
            <RHFMoneyField
              control={control}
              name="baseRate"
              label={reserve.label.baseRate}
              description={reserve.hint.baseRate}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
