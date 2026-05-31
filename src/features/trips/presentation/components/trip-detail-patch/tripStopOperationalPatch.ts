import type { CreateTripInput, Trip, UpdateTripInput } from "@features/trips/domain";
import { localInputToUtcIso } from "@shared/utils/dateUtils";
import { buildUpdateTripInputFromCreateInput } from "../../pages/create/updateTripPayloadShared";

import { mapStopToCreateStopInput } from "./mapStopToCreateStopInput";
import {
  buildScheduleOverrideForDestinationStopEdit,
  isDestinationStop,
} from "./tripScheduledArrivalSync";
import type { TripStopOperationalValues } from "./tripStopOperationalFields";

export function buildCreateLikeFromTrip(
  trip: Trip,
  editedById: Map<string, TripStopOperationalValues>,
  scheduleOverride?: { scheduledDeparture: string; scheduledArrival: string },
): CreateTripInput {
  return {
    vehicleId: trip.vehicleId,
    driverId: trip.driverId,
    clientId: trip.clientId ?? undefined,
    cfdiDocumentIntent: trip.cfdiDocumentIntent,
    scheduledDeparture: scheduleOverride
      ? localInputToUtcIso(scheduleOverride.scheduledDeparture)
      : trip.scheduledDeparture.toISOString(),
    scheduledArrival: scheduleOverride
      ? scheduleOverride.scheduledArrival
        ? localInputToUtcIso(scheduleOverride.scheduledArrival)
        : undefined
      : trip.scheduledArrival?.toISOString(),
    startMileage: trip.mileage.start ?? undefined,
    originCity: trip.originCity,
    originState: trip.originState ?? undefined,
    destinationCity: trip.destinationCity,
    destinationState: trip.destinationState ?? undefined,
    cargoDescription: trip.cargo.description ?? undefined,
    cargoWeight: trip.cargo.weight ?? undefined,
    cargoValue: trip.cargo.value ?? undefined,
    baseRate: trip.costs.baseRate,
    notes: trip.notes ?? undefined,
    internalStaff:
      trip.internalStaff?.map((staff) => ({
        employeeId: staff.employeeId,
        internalRole: staff.internalRole ?? "helper",
        isPaymentResponsible: staff.isPaymentResponsible,
        paymentNotes: staff.paymentNotes ?? undefined,
      })) ?? [],
    stops: (trip.stops ?? []).map((stop) =>
      mapStopToCreateStopInput(stop, editedById.get(stop.id)),
    ),
    cargos: (trip.cargos ?? []).map((cargo) => ({
      clientId: cargo.clientId,
      description: cargo.description,
      satProductCode: cargo.satProductCode ?? undefined,
      satProductDescription: cargo.satProductDescription ?? undefined,
      satUnitCode: cargo.satUnitCode ?? undefined,
      satUnitName: cargo.satUnitName ?? undefined,
      units: cargo.units ?? undefined,
      weight: cargo.weight ?? undefined,
      weightInKg: cargo.weightInKg ?? undefined,
      volume: cargo.volume ?? undefined,
      declaredValue: cargo.declaredValue ?? undefined,
      currency: cargo.currency,
      hazardousMaterial: cargo.hazardousMaterial ?? false,
      hazardousMaterialCode: cargo.hazardousMaterialCode ?? undefined,
      packagingType: cargo.packagingType ?? undefined,
      packagingDescription: cargo.packagingDescription ?? undefined,
      notes: cargo.notes ?? undefined,
      specialInstructions: cargo.specialInstructions ?? undefined,
      movements: cargo.movements?.map((movement) => ({
        stopIndex: movement.stopIndex,
        movementType: movement.movementType,
        weight: movement.weight ?? undefined,
        units: movement.units ?? undefined,
        notes: movement.notes ?? undefined,
      })),
      sectorCofepris: cargo.sectorCofepris ?? undefined,
      nombreIngredienteActivo: cargo.nombreIngredienteActivo ?? undefined,
      nomQuimico: cargo.nomQuimico ?? undefined,
      denominacionGenericaProd: cargo.denominacionGenericaProd ?? undefined,
      denominacionDistintivaProd: cargo.denominacionDistintivaProd ?? undefined,
      fabricante: cargo.fabricante ?? undefined,
      fechaCaducidad: cargo.fechaCaducidad ?? undefined,
      loteMedicamento: cargo.loteMedicamento ?? undefined,
      formaFarmaceutica: cargo.formaFarmaceutica ?? undefined,
      condicionesEspTransp: cargo.condicionesEspTransp ?? undefined,
      registroSanitarioFolioAutorizacion:
        cargo.registroSanitarioFolioAutorizacion ?? undefined,
      permisoImportacion: cargo.permisoImportacion ?? undefined,
      folioImpoVucem: cargo.folioImpoVucem ?? undefined,
      numCas: cargo.numCas ?? undefined,
      razonSocialEmpImp: cargo.razonSocialEmpImp ?? undefined,
      numRegSanPlagCofepris: cargo.numRegSanPlagCofepris ?? undefined,
      datosFabricante: cargo.datosFabricante ?? undefined,
      datosFormulador: cargo.datosFormulador ?? undefined,
      datosMaquilador: cargo.datosMaquilador ?? undefined,
      usoAutorizado: cargo.usoAutorizado ?? undefined,
      aseguraCarga: cargo.aseguraCarga ?? undefined,
      polizaCarga: cargo.polizaCarga ?? undefined,
    })),
    estimatedExpenses: (trip.expenses ?? []).map((expense) => ({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      expenseDate: expense.expenseDate.toISOString(),
      location: expense.location ?? undefined,
      vendorName: expense.vendorName ?? undefined,
      notes: expense.notes ?? undefined,
      isEstimated: expense.isEstimated,
    })),
  };
}

export function buildStopOperationalUpdateInput(
  trip: Trip,
  stopId: string,
  values: TripStopOperationalValues,
): UpdateTripInput {
  const editedById = new Map<string, TripStopOperationalValues>([[stopId, values]]);
  const sourceStop = (trip.stops ?? []).find((stop) => stop.id === stopId);
  const scheduleOverride =
    sourceStop && isDestinationStop(sourceStop)
      ? buildScheduleOverrideForDestinationStopEdit(trip, values)
      : undefined;

  return buildUpdateTripInputFromCreateInput(
    buildCreateLikeFromTrip(trip, editedById, scheduleOverride),
  );
}
