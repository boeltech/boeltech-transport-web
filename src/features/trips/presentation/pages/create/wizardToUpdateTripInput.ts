/**
 * Construye el mismo `UpdateTripInput` que envía el wizard al editar un viaje,
 * para validarlo con `updateTripSchema` del paquete (ADR-0043 WS-D).
 */
import type { UpdateTripInput } from "@features/trips/domain";
import type { TripWizardFormValues } from "./components/validation";
import { buildCreateTripInputFromWizardValues } from "./wizardToCreateTripInput";

export function buildUpdateTripInputFromWizardValues(
  data: TripWizardFormValues,
): UpdateTripInput {
  const base = buildCreateTripInputFromWizardValues(data);
  return {
    vehicleId: base.vehicleId,
    driverId: base.driverId,
    clientId: base.clientId,
    cfdiDocumentIntent: base.cfdiDocumentIntent,
    scheduledDeparture: base.scheduledDeparture,
    scheduledArrival: base.scheduledArrival,
    originAddress: base.originAddress,
    originCity: base.originCity,
    originState: base.originState,
    destinationAddress: base.destinationAddress,
    destinationCity: base.destinationCity,
    destinationState: base.destinationState,
    cargoDescription: base.cargoDescription,
    cargoWeight: base.cargoWeight,
    cargoValue: base.cargoValue,
    numTotalMercancias: base.numTotalMercancias,
    pesoBrutoTotal: base.pesoBrutoTotal,
    unidadPeso: base.unidadPeso,
    baseRate: base.baseRate,
    internalStaff: base.internalStaff,
    notes: base.notes,
    stops: base.stops,
    cargos: base.cargos,
    estimatedExpenses: base.estimatedExpenses,
  };
}
