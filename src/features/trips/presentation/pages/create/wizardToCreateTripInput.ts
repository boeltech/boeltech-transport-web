/**
 * Construye el mismo `CreateTripInput` que envía el wizard al crear un viaje,
 * para validarlo con `createTripSchema` del paquete (ADR-0043 WS-D).
 */
import type { CreateStopInput, CreateTripInput } from "@features/trips/domain";
import type { CurrencyType } from "@features/trips/domain";
import type { TripWizardFormValues } from "./components/validation";
import { buildTripEndpointSummary, mapWizardStopsToCreateInput } from "./wizardStopPayload";
import {
  buildMercanciasHeaderSummary,
  mapWizardCargosToCreateInput,
} from "./wizardCargoPayload";
import { localInputToUtcIso } from "@shared/utils/dateUtils";
import { deriveAllowExpiredDocs } from "./tripAssignmentExpiredDocs";

function mapWizardTrailers(
  data: TripWizardFormValues,
): CreateTripInput["trailers"] {
  const list = (data.trailers ?? [])
    .filter((t) => !!t.trailerId)
    .map((t) => ({
      trailerId: t.trailerId,
      position: t.position,
    }))
    .sort((a, b) => a.position - b.position);
  return list.length > 0 ? list : undefined;
}

export type BuildCreateTripInputOptions = {
  /** ADR-0071: hold comercial sin stops/cargos. */
  createIntent?: "reserve" | "full";
  /** ADR-0078: paradas clonadas del corredor en reserve. */
  clonedStops?: CreateStopInput[];
};

export function buildCreateTripInputFromWizardValues(
  data: TripWizardFormValues,
  assignmentContext?: {
    vehicle?: { insuranceExpiry: string | null; sctPermitExpiry: string | null };
    driver?: { isLicenseExpired: boolean };
  },
  buildOptions?: BuildCreateTripInputOptions,
): CreateTripInput {
  const createIntent = buildOptions?.createIntent ?? "full";
  const allowExpiredDocs = assignmentContext
    ? deriveAllowExpiredDocs(assignmentContext.vehicle, assignmentContext.driver)
    : undefined;
  const trailers = mapWizardTrailers(data);
  const satConfigAutotransporteCode =
    data.satConfigAutotransporteCode?.trim() || undefined;

  if (createIntent === "reserve") {
    const clonedStops = buildOptions?.clonedStops;
    return {
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      trailers,
      satConfigAutotransporteCode,
      clientId: data.clientId,
      originBranchId: data.originBranchId?.trim() || undefined,
      cfdiDocumentIntent: data.cfdiDocumentIntent ?? "ingreso",
      scheduledDeparture: localInputToUtcIso(data.scheduledDeparture),
      scheduledArrival: data.scheduledArrival
        ? localInputToUtcIso(data.scheduledArrival)
        : undefined,
      ...(data.startMileage != null ? { startMileage: data.startMileage } : {}),
      originCity: data.originCity?.trim() || "",
      destinationCity: data.destinationCity?.trim() || "",
      baseRate: data.baseRate,
      notes: data.notes || undefined,
      options: { createIntent: "reserve" },
      allowExpiredDocs,
      ...(clonedStops && clonedStops.length > 0 ? { stops: clonedStops } : {}),
    };
  }

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
    trailers,
    satConfigAutotransporteCode,
    clientId: data.clientId,
    originBranchId: data.originBranchId?.trim() || undefined,
    cfdiDocumentIntent: data.cfdiDocumentIntent ?? "ingreso",
    scheduledDeparture: localInputToUtcIso(data.scheduledDeparture),
    scheduledArrival: data.scheduledArrival
      ? localInputToUtcIso(data.scheduledArrival)
      : undefined,
    startMileage: data.startMileage,
    originCity: originSummary?.city || data.originCity?.trim() || "",
    originState: originSummary?.state || undefined,
    destinationCity: destSummary?.city || data.destinationCity?.trim() || "",
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
      internalRole: member.internalRole ?? "helper",
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
    allowExpiredDocs,
  };
}
