/**
 * Construye el mismo `CreateTripInput` que envía el wizard al crear un viaje,
 * para validarlo con `createTripSchema` del paquete (ADR-0043 WS-D).
 */
import type { CreateTripInput } from "@features/trips/domain";
import type { CurrencyType } from "@features/trips/domain";
import type { TripWizardFormValues } from "./components/validation";
import { buildTripEndpointSummary, mapWizardStopsToCreateInput } from "./wizardStopPayload";
import {
  buildMercanciasHeaderSummary,
  mapWizardCargosToCreateInput,
} from "./wizardCargoPayload";
import { localInputToUtcIso } from "@shared/utils/dateUtils";

export function buildCreateTripInputFromWizardValues(
  data: TripWizardFormValues,
): CreateTripInput {
  const mercanciasHeader = buildMercanciasHeaderSummary(data.cargos);
  const originStop = data.stops?.find((stop) => stop.stopType.includes("origin"));
  const destinationStop = data.stops?.find((stop) =>
    stop.stopType.includes("destination"),
  );
  const originSummary = originStop ? buildTripEndpointSummary(originStop) : null;
  const destSummary = destinationStop ? buildTripEndpointSummary(destinationStop) : null;

  return {
    vehicleId: data.vehicleId,
    driverId: data.driverId,
    clientId: data.clientId,
    cfdiDocumentIntent: data.cfdiDocumentIntent ?? "ingreso",
    scheduledDeparture: localInputToUtcIso(data.scheduledDeparture),
    scheduledArrival: data.scheduledArrival
      ? localInputToUtcIso(data.scheduledArrival)
      : undefined,
    startMileage: data.startMileage,
    originCity: originSummary?.city || "",
    originState: originSummary?.state || undefined,
    destinationCity: destSummary?.city || "",
    destinationState: destSummary?.state || undefined,
    cargoDescription: data.cargos?.[0]?.description,
    cargoWeight: data.cargos?.reduce((sum, c) => sum + (c.weight || 0), 0),
    cargoValue: data.cargos?.reduce((sum, c) => sum + (c.declaredValue || 0), 0),
    numTotalMercancias: mercanciasHeader.numTotalMercancias,
    pesoBrutoTotal: mercanciasHeader.pesoBrutoTotal,
    unidadPeso: mercanciasHeader.unidadPeso,
    baseRate: data.baseRate,
    internalStaff: data.internalStaff?.map((member) => ({
      employeeId: member.employeeId,
      internalRole: "helper" as const,
      isPaymentResponsible: member.isPaymentResponsible ?? false,
      paymentNotes: member.paymentNotes || undefined,
    })),
    notes: data.notes || undefined,
    stops: mapWizardStopsToCreateInput(data.stops),
    cargos: mapWizardCargosToCreateInput(data.cargos),
    estimatedExpenses: data.expenses?.map((expense) => ({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency as CurrencyType,
      vendorName: expense.vendorName || undefined,
      notes: expense.notes || undefined,
      isEstimated: true,
    })),
  };
}
