import {
  StopType,
  mapSnapshotToCreateStops,
  type ClientCorridor,
  type CreateStopInput,
  type StopTypeValue,
  type TripStop,
} from "@features/trips/domain";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import { utcIsoToLocalInput } from "@shared/utils/dateUtils";
import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";

import { mapStopToReplaceStopInput } from "../trip-detail-patch/mapStopToCreateStopInput";
import {
  addressSearchItemToDialogSlice,
  type StopFormData,
} from "../../pages/create/components/stopDialogAddressMapper";
import {
  mapWizardStopsToCreateInput,
  type WizardStopRow,
} from "../../pages/create/wizardStopPayload";
import {
  getRouteStopCategory,
  groupStopsForRouteDetail,
  type RouteStopCategory,
} from "./tripRouteDetailHelpers";

export {
  ownerTypesForRouteSlot,
  ROUTE_ORIGIN_OWNER_TYPES,
  ROUTE_STOP_OWNER_TYPES,
} from "./routeAddressPickerOwnerTypes";

export function resequenceStops(stops: CreateStopInput[]): CreateStopInput[] {
  return stops.map((stop, index) => ({ ...stop, sequenceOrder: index + 1 }));
}

function createStopCategory(stop: CreateStopInput): RouteStopCategory {
  const types = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];
  if (types.includes(StopType.ORIGIN)) return "origin";
  if (types.includes(StopType.DESTINATION)) return "destination";
  return "waypoint";
}

function omitSegmentDistance(stop: CreateStopInput): CreateStopInput {
  const next = { ...stop };
  delete next.distanceFromPreviousKm;
  delete next.distanceSource;
  delete next.distanceProvider;
  delete next.distanceConfidence;
  delete next.distanceComputedAt;
  return next;
}

function withHaversineDistance(
  stop: CreateStopInput,
  km: number,
): CreateStopInput {
  return {
    ...stop,
    distanceFromPreviousKm: km,
    distanceSource: "haversine_fallback",
    distanceProvider: "mapbox",
    distanceConfidence: "low",
    distanceComputedAt: new Date().toISOString(),
  };
}

/**
 * Inserta una escala antes del destino (origen → escalas → destino).
 * Si no hay destino tipado, la coloca antes de la última parada.
 */
export function insertWaypointStop(
  stops: CreateStopInput[],
  waypoint: CreateStopInput,
): CreateStopInput[] {
  const destIndex = stops.findIndex(
    (stop) => createStopCategory(stop) === "destination",
  );
  if (destIndex >= 0) {
    return [...stops.slice(0, destIndex), waypoint, ...stops.slice(destIndex)];
  }
  if (stops.length >= 2) {
    const last = stops.length - 1;
    return [...stops.slice(0, last), waypoint, stops[last]!];
  }
  return [...stops, waypoint];
}

/**
 * Sincroniza `distanceFromPreviousKm` con el vecino anterior en el orden actual.
 * Recalcula tramos no manuales (Haversine×1,30). Conserva `distanceSource: "manual"`.
 */
export function syncCreateStopSegmentDistances(
  stops: CreateStopInput[],
): CreateStopInput[] {
  if (stops.length === 0) return stops;

  return stops.map((stop, index) => {
    if (index === 0) return omitSegmentDistance(stop);

    if (stop.distanceSource === "manual" && stop.distanceFromPreviousKm) {
      return stop;
    }

    const previous = stops[index - 1];
    const estimated = estimateRoadDistanceKm(
      previous?.latitude,
      previous?.longitude,
      stop.latitude,
      stop.longitude,
    );

    if (estimated != null && estimated > 0) {
      return withHaversineDistance(stop, estimated);
    }

    return omitSegmentDistance(stop);
  });
}

/** @deprecated Usar `syncCreateStopSegmentDistances`. */
export function fillMissingCreateStopDistances(
  stops: CreateStopInput[],
): CreateStopInput[] {
  return syncCreateStopSegmentDistances(stops);
}

export function orderStopsForRouteLine(
  stops: CreateStopInput[],
): CreateStopInput[] {
  const origin = stops.filter((stop) => createStopCategory(stop) === "origin");
  const destination = stops.filter(
    (stop) => createStopCategory(stop) === "destination",
  );
  const waypoints = stops.filter(
    (stop) => createStopCategory(stop) === "waypoint",
  );
  return [...origin, ...waypoints, ...destination];
}

export function finalizeReplaceStopsPayload(
  stops: CreateStopInput[],
): CreateStopInput[] {
  return syncCreateStopSegmentDistances(
    resequenceStops(orderStopsForRouteLine(stops)),
  );
}

export function stopFormDataToCreateInput(
  data: StopFormData,
  sequenceOrder: number,
): CreateStopInput {
  const mapped = mapWizardStopsToCreateInput([
    {
      ...data,
      sequenceOrder,
      stopType: data.stopType ?? [],
    } as WizardStopRow,
  ]);
  if (!mapped?.[0]) {
    throw new Error("No se pudo armar la parada");
  }
  // Replace destruye addresses owned por stop; nunca reenviar addressId de snapshot.
  const nextStop = { ...mapped[0], sequenceOrder };
  delete nextStop.addressId;
  return nextStop;
}

export function mapTripStopToStopFormData(stop: TripStop): StopFormData {
  return {
    id: stop.id,
    sequenceOrder: stop.sequenceOrder,
    stopType: stop.stopType,
    stopCategory: getRouteStopCategory(stop),
    clientId: stop.clientId ?? "",
    clientAddressId: stop.clientAddressId ?? "",
    sourceAddressId: stop.sourceAddressId ?? "",
    addressId: stop.addressId ?? "",
    locationName: stop.locationName || "",
    satCountryCode: stop.satCountryCode ?? "MEX",
    satStateCode: stop.satEstadoCode || "",
    satMunicipalityCode: stop.satMunicipioCode || "",
    postalCode: stop.postalCode || "",
    satLocalityCode: stop.satLocalidadCode || undefined,
    satNeighborhoodCode: stop.satColoniaCode || undefined,
    neighborhoodName: stop.colonia || undefined,
    cityName: stop.city || undefined,
    street: stop.street || undefined,
    exteriorNumber: stop.exteriorNumber || undefined,
    interiorNumber: stop.interiorNumber || undefined,
    reference: stop.reference || undefined,
    rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario || undefined,
    nombreRemitenteDestinatario: stop.nombreRemitenteDestinatario || undefined,
    deliveryRfcRemitenteDestinatario:
      stop.deliveryRfcRemitenteDestinatario ?? "",
    deliveryNombreRemitenteDestinatario:
      stop.deliveryNombreRemitenteDestinatario ?? "",
    remitentePartnerId: stop.remitentePartnerId ?? "",
    destinatarioPartnerId: stop.destinatarioPartnerId ?? "",
    distanceFromPreviousKm: stop.distanceFromPreviousKm ?? undefined,
    distanceSource: stop.distanceSource ?? undefined,
    distanceProvider: stop.distanceProvider ?? undefined,
    distanceConfidence: stop.distanceConfidence ?? undefined,
    distanceComputedAt: stop.distanceComputedAt
      ? stop.distanceComputedAt.toISOString()
      : undefined,
    contactName: stop.contactName || undefined,
    contactPhone: stop.contactPhone || undefined,
    notes: stop.notes || undefined,
    latitude: stop.latitude || undefined,
    longitude: stop.longitude || undefined,
    estimatedArrival: stop.estimatedArrival
      ? utcIsoToLocalInput(stop.estimatedArrival.toISOString())
      : undefined,
  };
}

export function buildReplaceStopsPayload(params: {
  existingStops: readonly TripStop[];
  submitted: StopFormData;
  editingStopId?: string | null;
  endpointDraft?: ComposerEndpointDraft;
}): CreateStopInput[] {
  const { existingStops, submitted, editingStopId, endpointDraft } = params;

  if (editingStopId) {
    const next = existingStops.map((stop) =>
      stop.id === editingStopId
        ? stopFormDataToCreateInput(submitted, stop.sequenceOrder)
        : mapStopToReplaceStopInput(stop, undefined),
    );
    return finalizeReplaceStopsPayload(next);
  }

  const created = stopFormDataToCreateInput(
    submitted,
    existingStops.length + 1,
  );
  const category =
    submitted.stopCategory ?? createStopCategory(created);

  return mergeSubmittedStopWithEndpointDraft({
    existingStops,
    submitted: created,
    submittedCategory: category,
    draft: endpointDraft ?? {},
  });
}

export function composerStopTypes(
  category: RouteStopCategory,
): StopTypeValue[] {
  if (category === "origin") return [StopType.ORIGIN, StopType.PICKUP];
  if (category === "destination") return [StopType.DESTINATION, StopType.DELIVERY];
  return [StopType.WAYPOINT];
}

export function addressSearchItemToCreateStopInput(
  item: AddressSearchListItem,
  category: RouteStopCategory,
  sequenceOrder: number,
): CreateStopInput {
  const slice = addressSearchItemToDialogSlice(item);
  return stopFormDataToCreateInput(
    {
      ...slice,
      stopCategory: category,
      stopType: composerStopTypes(category),
    },
    sequenceOrder,
  );
}

export function upsertComposerStop(params: {
  existingStops: readonly TripStop[];
  category: RouteStopCategory;
  item: AddressSearchListItem;
}): CreateStopInput[] {
  const { existingStops, category, item } = params;
  const { origin, destination, ordered } = groupStopsForRouteDetail(existingStops);

  const others = (excludeId?: string) =>
    ordered
      .filter((stop) => stop.id !== excludeId)
      .map((stop) => mapStopToReplaceStopInput(stop, undefined));

  if (category === "origin") {
    const next = addressSearchItemToCreateStopInput(item, "origin", 1);
    return finalizeReplaceStopsPayload([next, ...others(origin?.id)]);
  }

  if (category === "destination") {
    const next = addressSearchItemToCreateStopInput(item, "destination", 1);
    return finalizeReplaceStopsPayload([...others(destination?.id), next]);
  }

  const next = addressSearchItemToCreateStopInput(item, "waypoint", 1);
  const mapped = ordered.map((stop) => mapStopToReplaceStopInput(stop, undefined));
  return finalizeReplaceStopsPayload(insertWaypointStop(mapped, next));
}

export function replaceStopsFromCorridor(
  corridor: ClientCorridor,
): CreateStopInput[] {
  return finalizeReplaceStopsPayload(mapSnapshotToCreateStops(corridor.stopsSnapshot));
}

/** Borrador local del composer antes del primer PUT (≥2 paradas). */
export type ComposerEndpointDraft = {
  origin?: AddressSearchListItem;
  destination?: AddressSearchListItem;
};

export function pickerItemLabel(item: AddressSearchListItem): string {
  return (
    item.locationName?.trim() ||
    [item.street, item.exteriorNumber].filter(Boolean).join(" ").trim() ||
    item.postalCode ||
    item.id
  );
}

/**
 * Une paradas ya persistidas con picks locales de origen/destino.
 * No incluye escalas del draft (solo endpoints).
 */
export function mergeComposerEndpointDraft(params: {
  existingStops: readonly TripStop[];
  draft: ComposerEndpointDraft;
}): CreateStopInput[] {
  const { existingStops, draft } = params;
  const { origin, destination, waypoints } = groupStopsForRouteDetail(
    existingStops,
  );

  const originInput = draft.origin
    ? addressSearchItemToCreateStopInput(draft.origin, "origin", 1)
    : origin
      ? mapStopToReplaceStopInput(origin, undefined)
      : null;

  const destinationInput = draft.destination
    ? addressSearchItemToCreateStopInput(draft.destination, "destination", 1)
    : destination
      ? mapStopToReplaceStopInput(destination, undefined)
      : null;

  const waypointInputs = waypoints.map((stop) =>
    mapStopToReplaceStopInput(stop, undefined),
  );

  return finalizeReplaceStopsPayload([
    ...(originInput ? [originInput] : []),
    ...waypointInputs,
    ...(destinationInput ? [destinationInput] : []),
  ]);
}

/**
 * Alta desde Completar domicilio: une el formulario con el pick del otro extremo
 * que aún vive en el borrador del composer (sin PUT hasta tener el par).
 */
export function mergeSubmittedStopWithEndpointDraft(params: {
  existingStops: readonly TripStop[];
  submitted: CreateStopInput;
  submittedCategory: RouteStopCategory;
  draft: ComposerEndpointDraft;
}): CreateStopInput[] {
  const merged = mergeComposerEndpointDraft({
    existingStops: params.existingStops,
    draft: params.draft,
  });

  if (params.submittedCategory === "waypoint") {
    return finalizeReplaceStopsPayload(
      insertWaypointStop(merged, params.submitted),
    );
  }
  if (params.submittedCategory === "origin") {
    return finalizeReplaceStopsPayload([
      params.submitted,
      ...merged.filter((stop) => createStopCategory(stop) !== "origin"),
    ]);
  }
  if (params.submittedCategory === "destination") {
    return finalizeReplaceStopsPayload([
      ...merged.filter((stop) => createStopCategory(stop) !== "destination"),
      params.submitted,
    ]);
  }

  return finalizeReplaceStopsPayload([...merged, params.submitted]);
}

/** El API exige ≥2 en scheduled; el primer armado también debe enviar el par. */
export function canPersistComposerStops(stops: CreateStopInput[]): boolean {
  return stops.length >= 2;
}

export function catalogAddressIdFromStop(stop: TripStop): string | null {
  const source = stop.sourceAddressId?.trim();
  if (source) return source;
  const client = stop.clientAddressId?.trim();
  return client || null;
}

/** Origen y destino no pueden compartir la misma dirección de catálogo. */
export function isDuplicateComposerEndpointAddress(params: {
  category: "origin" | "destination";
  catalogAddressId: string;
  existingStops: readonly TripStop[];
  draft: ComposerEndpointDraft;
}): boolean {
  const { category, catalogAddressId, existingStops, draft } = params;
  if (!catalogAddressId.trim()) return false;

  const { origin, destination } = groupStopsForRouteDetail(existingStops);
  const otherCatalogId =
    category === "origin"
      ? (draft.destination?.id ??
        (destination ? catalogAddressIdFromStop(destination) : null))
      : (draft.origin?.id ?? (origin ? catalogAddressIdFromStop(origin) : null));

  return Boolean(otherCatalogId && otherCatalogId === catalogAddressId);
}
