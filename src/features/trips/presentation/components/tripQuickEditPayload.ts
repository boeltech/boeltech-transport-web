import type {
  CreateStopInput,
  CreateTripInput,
  Trip,
  UpdateTripInput,
} from "@features/trips/domain";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";
import { buildUpdateTripInputFromCreateInput } from "../pages/create/updateTripPayloadShared";

const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;

export type StopFiscalStatus = "ok" | "pending" | "invalid";

export type TripQuickEditStopValues = {
  stopId: string;
  sequenceOrder: number;
  locationName: string;
  estimatedArrival: string;
  distanceFromPreviousKm: string;
  rfcRemitenteDestinatario: string;
  nombreRemitenteDestinatario: string;
  deliveryRfcRemitenteDestinatario: string;
  deliveryNombreRemitenteDestinatario: string;
};

export type TripQuickEditValues = {
  scheduledDeparture: string;
  scheduledArrival: string;
  stops: TripQuickEditStopValues[];
};

export function mapTripToQuickEditValues(trip: Trip): TripQuickEditValues {
  const stops = [...(trip.stops ?? [])]
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .map<TripQuickEditStopValues>((stop) => ({
      stopId: stop.id,
      sequenceOrder: stop.sequenceOrder,
      locationName: stop.locationName ?? "",
      estimatedArrival: stop.estimatedArrival
        ? utcIsoToLocalInput(stop.estimatedArrival.toISOString())
        : "",
      distanceFromPreviousKm:
        stop.distanceFromPreviousKm == null ? "" : String(stop.distanceFromPreviousKm),
      rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario ?? "",
      nombreRemitenteDestinatario: stop.nombreRemitenteDestinatario ?? "",
      deliveryRfcRemitenteDestinatario: stop.deliveryRfcRemitenteDestinatario ?? "",
      deliveryNombreRemitenteDestinatario:
        stop.deliveryNombreRemitenteDestinatario ?? "",
    }));

  return {
    scheduledDeparture: utcIsoToLocalInput(trip.scheduledDeparture.toISOString()),
    scheduledArrival: trip.scheduledArrival
      ? utcIsoToLocalInput(trip.scheduledArrival.toISOString())
      : "",
    stops,
  };
}

function normalizeText(value: string): string {
  return value.trim();
}

function normalizeRfc(value: string): string {
  return normalizeText(value).toUpperCase();
}

function parseDistance(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * El schema API exige `city` con longitud mínima 2. Algunos viajes viejos traen ciudad vacía
 * aunque tengan nombre de ubicación o dirección; derivamos un valor válido sin inventar CP.
 */
function resolveStopCityForApi(stop: NonNullable<Trip["stops"]>[number]): string {
  const candidates = [
    stop.city,
    stop.locationName,
    stop.colonia,
    stop.street,
    stop.address,
  ];
  for (const raw of candidates) {
    const t = (raw ?? "").trim();
    if (t.length >= 2) return t;
  }
  const cp = (stop.postalCode ?? "").trim();
  if (cp.length >= 2) return `CP ${cp}`;
  return "Sin ciudad";
}

function mapStopToCreateStopInput(
  source: NonNullable<Trip["stops"]>[number],
  edited: TripQuickEditStopValues | undefined,
): CreateStopInput {
  const distanceFromPreviousKm = edited
    ? parseDistance(edited.distanceFromPreviousKm)
    : source.distanceFromPreviousKm ?? undefined;

  return {
    sequenceOrder: source.sequenceOrder,
    stopType: source.stopType,
    addressId: source.addressId ?? undefined,
    address: source.address || "",
    city: resolveStopCityForApi(source),
    state: source.state ?? undefined,
    postalCode: source.postalCode ?? undefined,
    latitude: source.latitude ?? undefined,
    longitude: source.longitude ?? undefined,
    locationName: normalizeText(edited?.locationName ?? source.locationName ?? "") || undefined,
    contactName: source.contactName ?? undefined,
    contactPhone: source.contactPhone ?? undefined,
    estimatedArrival:
      edited?.estimatedArrival && edited.estimatedArrival.trim()
        ? localInputToUtcIso(edited.estimatedArrival)
        : source.estimatedArrival
          ? source.estimatedArrival.toISOString()
          : undefined,
    notes: source.notes ?? undefined,
    idUbicacion: source.idUbicacion ?? undefined,
    street: source.street ?? undefined,
    exteriorNumber: source.exteriorNumber ?? undefined,
    interiorNumber: source.interiorNumber ?? undefined,
    colonia: source.colonia ?? undefined,
    reference: source.reference ?? undefined,
    satCountryCode: source.satCountryCode ?? undefined,
    satStateCode: source.satEstadoCode ?? undefined,
    satMunicipalityCode: source.satMunicipioCode ?? undefined,
    satLocalityCode: source.satLocalidadCode ?? undefined,
    satNeighborhoodCode: source.satColoniaCode ?? undefined,
    rfcRemitenteDestinatario:
      normalizeRfc(edited?.rfcRemitenteDestinatario ?? source.rfcRemitenteDestinatario ?? "") ||
      undefined,
    nombreRemitenteDestinatario:
      normalizeText(
        edited?.nombreRemitenteDestinatario ?? source.nombreRemitenteDestinatario ?? "",
      ) || undefined,
    deliveryRfcRemitenteDestinatario:
      normalizeRfc(
        edited?.deliveryRfcRemitenteDestinatario ??
          source.deliveryRfcRemitenteDestinatario ??
          "",
      ) || undefined,
    deliveryNombreRemitenteDestinatario:
      normalizeText(
        edited?.deliveryNombreRemitenteDestinatario ??
          source.deliveryNombreRemitenteDestinatario ??
          "",
      ) || undefined,
    remitentePartnerId: source.remitentePartnerId ?? undefined,
    destinatarioPartnerId: source.destinatarioPartnerId ?? undefined,
    distanceFromPreviousKm:
      source.sequenceOrder === 0
        ? undefined
        : distanceFromPreviousKm != null && distanceFromPreviousKm > 0
          ? distanceFromPreviousKm
          : undefined,
    distanceSource: source.distanceSource ?? undefined,
    distanceProvider: source.distanceProvider ?? undefined,
    distanceConfidence: source.distanceConfidence ?? undefined,
    distanceComputedAt: source.distanceComputedAt?.toISOString() ?? undefined,
    clientId: source.clientId ?? undefined,
    clientAddressId: source.clientAddressId ?? undefined,
  };
}

export function buildUpdateTripInputFromQuickEditValues(
  trip: Trip,
  values: TripQuickEditValues,
): UpdateTripInput {
  const editedById = new Map(values.stops.map((stop) => [stop.stopId, stop]));
  const createLike: CreateTripInput = {
    vehicleId: trip.vehicleId,
    driverId: trip.driverId,
    clientId: trip.clientId ?? undefined,
    cfdiDocumentIntent: trip.cfdiDocumentIntent,
    scheduledDeparture: localInputToUtcIso(values.scheduledDeparture),
    scheduledArrival: values.scheduledArrival
      ? localInputToUtcIso(values.scheduledArrival)
      : undefined,
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
  return buildUpdateTripInputFromCreateInput(createLike);
}

export function getStopFiscalStatus(
  stop: Pick<
    TripQuickEditStopValues,
    "rfcRemitenteDestinatario" | "deliveryRfcRemitenteDestinatario"
  >,
): StopFiscalStatus {
  const candidate =
    normalizeRfc(stop.deliveryRfcRemitenteDestinatario) ||
    normalizeRfc(stop.rfcRemitenteDestinatario);
  if (!candidate) return "pending";
  if (!RFC_REGEX.test(candidate)) return "invalid";
  return "ok";
}

export function validateQuickEditStopsFiscal(
  stops: TripQuickEditStopValues[],
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const stop of stops) {
    const stopErrors: string[] = [];
    const mainRfc = normalizeRfc(stop.rfcRemitenteDestinatario);
    const deliveryRfc = normalizeRfc(stop.deliveryRfcRemitenteDestinatario);

    if (!mainRfc && !deliveryRfc) {
      stopErrors.push("Captura RFC remitente/destinatario o RFC de entrega.");
    }
    if (mainRfc && !RFC_REGEX.test(mainRfc)) {
      stopErrors.push("El RFC remitente/destinatario tiene formato inválido.");
    }
    if (deliveryRfc && !RFC_REGEX.test(deliveryRfc)) {
      stopErrors.push("El RFC de entrega tiene formato inválido.");
    }
    if (stopErrors.length > 0) {
      errors[stop.stopId] = stopErrors;
    }
  }
  return errors;
}
