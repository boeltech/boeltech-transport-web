/**
 * F4b — helpers de «Planear retorno» (inferencia UI; sin FK persistida).
 * TEC Q-R1…Q-R3 · R2–R7 · R10.
 */

import {
  CargoStatus,
  StopType,
  type CreateStopInput,
  type ReplanPendingStopInput,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";
import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";

import { formatRouteStopPlaceLabel } from "../../helpers/routeStopPlaceLabel";
import { tripHasMultiUnloadDeliveryGap } from "../../utils/tripCargoDeliveryAssignment";
import { mapStopToReplaceStopInput } from "../trip-detail-patch/mapStopToCreateStopInput";
import {
  resequenceStops,
  syncCreateStopSegmentDistances,
} from "../trip-route/buildReplaceStopsPayload";
import {
  getRouteStopCategory,
  sumRouteSegmentDistanceKm,
} from "../trip-route/tripRouteDetailHelpers";
import { isTripStopImmutableMidTrip } from "../trip-route/isStopImmutableMidTrip";

export type PlanReturnTiming = "at_end" | "before_next";

/** Timing canónico domain/API (`return_planned.payload.timing`). */
export type ReturnPlannedDomainTiming =
  | "at_end"
  | "before_continuing"
  | "as_new_destination";

/**
 * UI (`at_end` | `before_next`) → enum domain.
 * Sin entregas pendientes = Destino → `as_new_destination`.
 */
export function mapPlanReturnTimingToDomain(params: {
  timing: PlanReturnTiming;
  hasPendingDeliveries: boolean;
}): ReturnPlannedDomainTiming {
  if (!params.hasPendingDeliveries) return "as_new_destination";
  if (params.timing === "before_next") return "before_continuing";
  return "at_end";
}

export type PlanReturnDestinationSource = "pickup" | "other";

export type PlanReturnDestination = {
  readonly source: PlanReturnDestinationSource;
  readonly locationName: string;
  readonly addressLine: string;
  readonly createInput: CreateStopInput;
  /** Parada de recogida cuando source=pickup. */
  readonly pickupStopId?: string;
};

export type PendingDeliveryContext = {
  readonly stop: TripStop;
  readonly cargo: TripCargo;
  readonly placeLabel: string;
};

export type PlanReturnRoutePreviewStop = {
  readonly key: string;
  readonly placeLabel: string;
  readonly isReturn: boolean;
  readonly isImmutable: boolean;
  readonly estimatedArrival: Date | null;
  readonly statusLabel?: string;
};

export type PlanReturnImpact = {
  readonly totalKm: number | null;
  readonly deltaKm: number | null;
  readonly previousStopCount: number;
  readonly nextStopCount: number;
  readonly arrivalAtReturn: Date | null;
  readonly nextPendingArrival: Date | null;
  readonly nextPendingPlaceLabel: string | null;
  readonly previewStops: PlanReturnRoutePreviewStop[];
};

function normalizeStopTypes(
  stopType: TripStop["stopType"] | CreateStopInput["stopType"],
): string[] {
  return (Array.isArray(stopType) ? stopType : [stopType]).map(String);
}

function withoutDestinationType(
  stopType: TripStop["stopType"],
): CreateStopInput["stopType"] {
  const types = normalizeStopTypes(stopType).filter(
    (t) => t !== StopType.DESTINATION && t !== "destination",
  );
  if (!types.includes(StopType.WAYPOINT) && !types.includes("waypoint")) {
    types.unshift(StopType.WAYPOINT);
  }
  if (!types.includes(StopType.DELIVERY) && !types.includes("delivery")) {
    types.push(StopType.DELIVERY);
  }
  return types as CreateStopInput["stopType"];
}

function stopAddressLine(stop: TripStop): string {
  const parts: string[] = [];
  if (stop.street?.trim()) {
    let line = stop.street.trim();
    if (stop.exteriorNumber?.trim()) line += ` ${stop.exteriorNumber.trim()}`;
    parts.push(line);
  }
  if (stop.colonia?.trim()) parts.push(stop.colonia.trim());
  if (stop.city?.trim()) parts.push(stop.city.trim());
  if (stop.postalCode?.trim()) parts.push(`C.P. ${stop.postalCode.trim()}`);
  if (parts.length > 0) return parts.join(", ");
  return (stop.address ?? "").trim() || formatRouteStopPlaceLabel(stop);
}

/** Cargas `returned` (orden por updated/picked; estable por id). */
export function listReturnedCargos(
  cargos: readonly TripCargo[],
): TripCargo[] {
  return cargos
    .filter((c) => c.status === CargoStatus.RETURNED)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Carga objetivo del Sheet mientras `return_replan_required`.
 * Multi-carga: la última `returned` (por id estable) — el gate vuelve a true
 * tras cada Devolver; el operador planea una a la vez.
 */
export function resolvePlanReturnTargetCargo(
  cargos: readonly TripCargo[],
): TripCargo | null {
  const returned = listReturnedCargos(cargos);
  if (returned.length === 0) return null;
  return returned[returned.length - 1] ?? null;
}

export function resolveCargoPickupStop(
  cargo: TripCargo,
  orderedStops: readonly TripStop[],
): TripStop | null {
  const pickup = cargo.movements.find((m) => m.movementType === "pickup");
  if (!pickup) return null;
  if (pickup.stopId) {
    const byId = orderedStops.find((s) => s.id === pickup.stopId);
    if (byId) return byId;
  }
  const byIndex = orderedStops[pickup.stopIndex];
  return byIndex ?? null;
}

export function destinationFromPickupStop(
  pickup: TripStop,
): PlanReturnDestination {
  const base = mapStopToReplaceStopInput(pickup);
  return {
    source: "pickup",
    locationName: formatRouteStopPlaceLabel(pickup),
    addressLine: stopAddressLine(pickup),
    pickupStopId: pickup.id,
    createInput: {
      ...base,
      sequenceOrder: 0,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      notes: undefined,
      estimatedArrival: undefined,
      estimatedDeparture: undefined,
      distanceFromPreviousKm: undefined,
      distanceSource: undefined,
      distanceProvider: undefined,
      distanceConfidence: undefined,
      distanceComputedAt: undefined,
      idUbicacion: undefined,
    },
  };
}

export function destinationFromCreateInput(
  input: CreateStopInput,
): PlanReturnDestination {
  const locationName =
    input.locationName?.trim() ||
    input.city?.trim() ||
    input.address?.trim() ||
    "Ubicación";
  const addressParts = [
    input.street?.trim(),
    input.exteriorNumber?.trim()
      ? `#${input.exteriorNumber.trim()}`
      : null,
    input.colonia?.trim(),
    input.city?.trim(),
    input.postalCode?.trim() ? `C.P. ${input.postalCode.trim()}` : null,
  ].filter(Boolean);
  return {
    source: "other",
    locationName,
    addressLine:
      addressParts.length > 0
        ? addressParts.join(", ")
        : (input.address ?? locationName),
    createInput: {
      ...input,
      sequenceOrder: 0,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      notes: undefined,
      estimatedArrival: undefined,
      estimatedDeparture: undefined,
      distanceFromPreviousKm: undefined,
      distanceSource: undefined,
      distanceProvider: undefined,
      distanceConfidence: undefined,
      distanceComputedAt: undefined,
      idUbicacion: undefined,
    },
  };
}

/**
 * F5d-c: hay cargas activas (pending/in_transit) sin delivery con ≥2 unloads.
 * Evita el empty «Ya no quedan entregas» mentiroso en Planear retorno.
 */
export function hasMultiUnloadActiveCargoWithoutDelivery(
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
): boolean {
  return tripHasMultiUnloadDeliveryGap(orderedStops, cargos);
}

/**
 * Entregas pendientes de otras cargas (pending / in_transit) en paradas
 * aún mutables mid-trip.
 */
export function listPendingDeliveriesForOtherCargos(
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
  excludeCargoId: string,
): PendingDeliveryContext[] {
  const out: PendingDeliveryContext[] = [];
  for (const cargo of cargos) {
    if (cargo.id === excludeCargoId) continue;
    if (
      cargo.status !== CargoStatus.PENDING &&
      cargo.status !== CargoStatus.IN_TRANSIT
    ) {
      continue;
    }
    const delivery = cargo.movements.find((m) => m.movementType === "delivery");
    if (!delivery) continue;
    const stop =
      (delivery.stopId
        ? orderedStops.find((s) => s.id === delivery.stopId)
        : undefined) ?? orderedStops[delivery.stopIndex];
    if (!stop) continue;
    if (isTripStopImmutableMidTrip(stop)) continue;
    out.push({
      stop,
      cargo,
      placeLabel: formatRouteStopPlaceLabel(stop),
    });
  }
  out.sort((a, b) => a.stop.sequenceOrder - b.stop.sequenceOrder);
  return out;
}

function stopMatchesPlace(
  stop: TripStop,
  place: Pick<
    CreateStopInput,
    "sourceAddressId" | "address" | "city" | "locationName" | "latitude" | "longitude"
  >,
): boolean {
  const src = place.sourceAddressId?.trim();
  if (src && (stop.sourceAddressId === src || stop.addressId === src)) {
    return true;
  }
  const name = (place.locationName ?? "").trim().toLowerCase();
  const city = (place.city ?? "").trim().toLowerCase();
  if (
    name &&
    (stop.locationName ?? "").trim().toLowerCase() === name &&
    (!city || (stop.city ?? "").trim().toLowerCase() === city)
  ) {
    return true;
  }
  if (
    place.latitude != null &&
    place.longitude != null &&
    stop.latitude != null &&
    stop.longitude != null
  ) {
    const dLat = Math.abs(stop.latitude - place.latitude);
    const dLng = Math.abs(stop.longitude - place.longitude);
    if (dLat < 0.0005 && dLng < 0.0005) return true;
  }
  return false;
}

/**
 * Candidata a R7: pending (planeada) o in_progress (visita activa).
 * F4c: los CTAs anidados solo aparecen en at_stop; si la inferencia excluyera
 * in_progress, el gate «cero CTAs sobre returned» no correría al llegar.
 * Completadas / salidas no aplican (ya no es recepción pendiente).
 */
function isReturnStopVisitCandidate(stop: TripStop, pickupId: string): boolean {
  if (stop.id === pickupId) return false;
  const status = String(stop.status);
  return status === "pending" || status === "in_progress";
}

/**
 * R7 — etiqueta «Retorno» por inferencia: carga returned → pickup →
 * parada pending/in_progress cuya dirección coincide con el pickup
 * (apareo cronológico). Sin FK (Q-R1).
 */
export function resolveReturnStopForCargo(
  cargo: TripCargo,
  orderedStops: readonly TripStop[],
  claimedStopIds: ReadonlySet<string> = new Set(),
): TripStop | null {
  if (cargo.status !== CargoStatus.RETURNED) return null;
  const pickup = resolveCargoPickupStop(cargo, orderedStops);
  if (!pickup) return null;

  const place = mapStopToReplaceStopInput(pickup);
  const candidates = orderedStops.filter(
    (s) =>
      !claimedStopIds.has(s.id) && isReturnStopVisitCandidate(s, pickup.id),
  );

  const match = candidates.find((s) => stopMatchesPlace(s, place));
  return match ?? null;
}

export function resolveReturnStopLabelMap(
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
): Map<string, { cargo: TripCargo; placeLabel: string }> {
  const claimed = new Set<string>();
  const map = new Map<string, { cargo: TripCargo; placeLabel: string }>();
  for (const cargo of listReturnedCargos(cargos)) {
    const stop = resolveReturnStopForCargo(cargo, orderedStops, claimed);
    if (!stop) continue;
    claimed.add(stop.id);
    map.set(stop.id, {
      cargo,
      placeLabel: formatRouteStopPlaceLabel(stop),
    });
  }
  return map;
}

/** True si hay al menos una parada inferida como retorno (badge «Con retorno»). */
export function tripHasInferredReturnStop(
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
): boolean {
  return resolveReturnStopLabelMap(cargos, orderedStops).size > 0;
}

/**
 * Badge R8 de carga returned.
 * `returnReplanRequired` → ámbar «a bordo»; si no y hay lugar → neutro «regresa a».
 */
export function resolveReturnedCargoBadge(params: {
  cargo: TripCargo;
  returnReplanRequired: boolean;
  orderedStops: readonly TripStop[];
  returnPlaceLabel?: string | null;
}): {
  label: string;
  variant: "warning" | "neutral";
  tone: "soft";
} | null {
  if (params.cargo.status !== CargoStatus.RETURNED) return null;
  if (params.returnReplanRequired) {
    return {
      label: "Devuelta · a bordo",
      variant: "warning",
      tone: "soft",
    };
  }
  const place =
    params.returnPlaceLabel?.trim() ||
    (() => {
      const stop = resolveReturnStopForCargo(
        params.cargo,
        params.orderedStops,
      );
      return stop ? formatRouteStopPlaceLabel(stop) : null;
    })();
  if (place) {
    return {
      label: `Devuelta · regresa a ${place}`,
      variant: "neutral",
      tone: "soft",
    };
  }
  return {
    label: "Devuelta · a bordo",
    variant: "warning",
    tone: "soft",
  };
}

function buildProjectedOrderedInputs(params: {
  orderedStops: readonly TripStop[];
  returnDestination: PlanReturnDestination;
  timing: PlanReturnTiming;
  hasPendingDeliveries: boolean;
}): CreateStopInput[] {
  const { orderedStops, returnDestination, timing, hasPendingDeliveries } =
    params;
  const base = orderedStops.map((s) => mapStopToReplaceStopInput(s));

  const returnInput: CreateStopInput = {
    ...returnDestination.createInput,
  };

  if (!hasPendingDeliveries || timing === "at_end") {
    const next = base.map((input, index) => {
      const stop = orderedStops[index]!;
      if (
        getRouteStopCategory(stop) === "destination" &&
        !isTripStopImmutableMidTrip(stop)
      ) {
        return {
          ...input,
          stopType: withoutDestinationType(stop.stopType),
        };
      }
      return input;
    });
    returnInput.stopType = [StopType.DESTINATION, StopType.DELIVERY];
    next.push(returnInput);
    return resequenceStops(next);
  }

  // before_next: insertar retorno como primera pending (waypoint) tras inmutables.
  returnInput.stopType = [StopType.WAYPOINT, StopType.DELIVERY];
  const firstPendingIdx = orderedStops.findIndex(
    (s) => !isTripStopImmutableMidTrip(s),
  );
  if (firstPendingIdx < 0) {
    returnInput.stopType = [StopType.DESTINATION, StopType.DELIVERY];
    return resequenceStops([...base, returnInput]);
  }
  const next = [
    ...base.slice(0, firstPendingIdx),
    returnInput,
    ...base.slice(firstPendingIdx),
  ];
  return resequenceStops(next);
}

function resolveReturnInsertIndex(params: {
  orderedStops: readonly TripStop[];
  timing: PlanReturnTiming;
  hasPendingDeliveries: boolean;
  projectedLength: number;
}): number {
  if (params.hasPendingDeliveries && params.timing === "before_next") {
    const firstPending = params.orderedStops.findIndex(
      (s) => !isTripStopImmutableMidTrip(s),
    );
    return firstPending >= 0 ? firstPending : params.projectedLength - 1;
  }
  return params.projectedLength - 1;
}

/**
 * Construye `pending_stops` con `id` en modify e insert sin `id` para el retorno.
 * Omite inmutables mid-trip (ADR-0093).
 */
export function buildPlanReturnPendingStops(params: {
  orderedStops: readonly TripStop[];
  returnDestination: PlanReturnDestination;
  timing: PlanReturnTiming;
  hasPendingDeliveries: boolean;
}): ReplanPendingStopInput[] {
  const projected = syncCreateStopSegmentDistances(
    buildProjectedOrderedInputs(params),
  );
  const returnIndex = resolveReturnInsertIndex({
    ...params,
    projectedLength: projected.length,
  });

  const existingInOrder = [...params.orderedStops];
  let existingCursor = 0;
  const result: ReplanPendingStopInput[] = [];

  for (let i = 0; i < projected.length; i++) {
    const input = projected[i]!;
    if (i === returnIndex) {
      result.push({ ...input });
      continue;
    }
    const existing = existingInOrder[existingCursor];
    existingCursor += 1;
    if (!existing) {
      result.push({ ...input });
      continue;
    }
    if (isTripStopImmutableMidTrip(existing)) {
      continue;
    }
    result.push({ ...input, id: existing.id });
  }

  return result;
}

function estimateArrivalChain(
  stops: CreateStopInput[],
  seedArrival: Date | null,
): Array<Date | null> {
  const out: Array<Date | null> = [];
  let cursor = seedArrival;
  for (let i = 0; i < stops.length; i++) {
    if (i === 0) {
      out.push(cursor);
      continue;
    }
    const km = stops[i]?.distanceFromPreviousKm;
    if (cursor && km != null && km > 0) {
      // ~50 km/h operativo estimado
      const hours = km / 50;
      cursor = new Date(cursor.getTime() + hours * 3600_000);
      out.push(cursor);
    } else {
      out.push(stops[i]?.estimatedArrival ? new Date(stops[i]!.estimatedArrival!) : cursor);
    }
  }
  return out;
}

export function estimatePlanReturnImpact(params: {
  orderedStops: readonly TripStop[];
  returnDestination: PlanReturnDestination;
  timing: PlanReturnTiming;
  hasPendingDeliveries: boolean;
  pendingDeliveries: readonly PendingDeliveryContext[];
}): PlanReturnImpact {
  const previousKm = sumRouteSegmentDistanceKm(params.orderedStops);
  const previousStopCount = params.orderedStops.length;
  const projected = syncCreateStopSegmentDistances(
    buildProjectedOrderedInputs(params),
  );
  const nextStopCount = projected.length;

  let totalKm = 0;
  let hasKm = false;
  for (const stop of projected) {
    if (stop.distanceFromPreviousKm != null && stop.distanceFromPreviousKm > 0) {
      totalKm += stop.distanceFromPreviousKm;
      hasKm = true;
    }
  }

  const lastImmutable = [...params.orderedStops]
    .reverse()
    .find((s) => isTripStopImmutableMidTrip(s));
  const seed =
    lastImmutable?.actualArrival ??
    lastImmutable?.actualDeparture ??
    lastImmutable?.estimatedArrival ??
    null;

  const arrivals = estimateArrivalChain(projected, seed);

  const returnIndex = resolveReturnInsertIndex({
    orderedStops: params.orderedStops,
    timing: params.timing,
    hasPendingDeliveries: params.hasPendingDeliveries,
    projectedLength: projected.length,
  });

  const nextPending = params.pendingDeliveries[0] ?? null;

  const previewStops: PlanReturnRoutePreviewStop[] = projected.map(
    (input, index) => {
      const existing =
        index === returnIndex
          ? null
          : params.orderedStops[index < returnIndex ? index : index - 1];
      const isReturn = index === returnIndex;
      return {
        key: isReturn ? `return-${index}` : (existing?.id ?? `stop-${index}`),
        placeLabel: isReturn
          ? params.returnDestination.locationName
          : existing
            ? formatRouteStopPlaceLabel(existing)
            : (input.locationName ?? input.city ?? `Parada ${index + 1}`),
        isReturn,
        isImmutable: existing ? isTripStopImmutableMidTrip(existing) : false,
        estimatedArrival: arrivals[index] ?? null,
      };
    },
  );

  const deltaKm =
    hasKm && previousKm != null ? totalKm - previousKm : hasKm ? totalKm : null;

  return {
    totalKm: hasKm ? Math.round(totalKm) : null,
    deltaKm: deltaKm != null ? Math.round(deltaKm) : null,
    previousStopCount,
    nextStopCount,
    arrivalAtReturn: arrivals[returnIndex] ?? null,
    nextPendingArrival: nextPending?.stop.estimatedArrival ?? null,
    nextPendingPlaceLabel: nextPending?.placeLabel ?? null,
    previewStops,
  };
}

/** Fallback distancia si faltan segmentos: haversine del tramo retorno. */
export function estimateReturnLegKm(
  from: Pick<TripStop, "latitude" | "longitude"> | null | undefined,
  to: Pick<CreateStopInput, "latitude" | "longitude">,
): number | null {
  return estimateRoadDistanceKm(
    from?.latitude,
    from?.longitude,
    to.latitude,
    to.longitude,
  );
}
