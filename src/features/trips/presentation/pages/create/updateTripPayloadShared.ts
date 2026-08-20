import type { CreateTripInput, UpdateTripInput } from "@features/trips/domain";

/**
 * Mapea el body de creación al body de edición.
 * Mantiene una sola lista canónica de campos compartidos entre create/update.
 */
export function buildUpdateTripInputFromCreateInput(
  base: CreateTripInput,
): UpdateTripInput {
  return {
    vehicleId: base.vehicleId,
    driverId: base.driverId,
    trailers: base.trailers,
    satConfigAutotransporteCode: base.satConfigAutotransporteCode,
    clientId: base.clientId,
    originBranchId: base.originBranchId,
    cfdiDocumentIntent: base.cfdiDocumentIntent,
    scheduledDeparture: base.scheduledDeparture,
    scheduledArrival: base.scheduledArrival,
    startMileage: base.startMileage,
    originCity: base.originCity,
    originState: base.originState,
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
    allowExpiredDocs: base.allowExpiredDocs,
  };
}
