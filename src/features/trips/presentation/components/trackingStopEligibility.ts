import {
  StopType,
  getOrderedStops,
  type StopTypeValue,
  type TripStop,
} from "@features/trips/domain";

function normalizeStopTypes(
  stopType: StopTypeValue | StopTypeValue[],
): StopTypeValue[] {
  return Array.isArray(stopType) ? stopType : [stopType];
}

export function hasStopType(
  stopType: StopTypeValue | StopTypeValue[],
  target: StopTypeValue,
): boolean {
  return normalizeStopTypes(stopType).includes(target);
}

export function isOriginStop(stop: Pick<TripStop, "stopType">): boolean {
  return hasStopType(stop.stopType, StopType.ORIGIN);
}

export function isDestinationStop(stop: Pick<TripStop, "stopType">): boolean {
  return hasStopType(stop.stopType, StopType.DESTINATION);
}

/** Paradas intermedias (Escala): llegada y salida manual. */
export function isTrackingEscalaStop(stop: Pick<TripStop, "stopType">): boolean {
  const types = normalizeStopTypes(stop.stopType);
  if (types.includes(StopType.ORIGIN) || types.includes(StopType.DESTINATION)) {
    return false;
  }
  return types.includes(StopType.WAYPOINT);
}

/** Paradas donde aplica «Registrar llegada» (escalas y destino; no origen). */
export function isManualArrivalStop(stop: Pick<TripStop, "stopType">): boolean {
  if (isOriginStop(stop)) return false;
  return isTrackingEscalaStop(stop) || isDestinationStop(stop);
}

export function findNextStopForArrival(
  stops: TripStop[],
): TripStop | undefined {
  return getOrderedStops(stops).find(
    (stop) => isManualArrivalStop(stop) && !stop.actualArrival,
  );
}

export function findActiveEscalaForDeparture(
  stops: TripStop[],
): TripStop | undefined {
  return getOrderedStops(stops).find(
    (stop) =>
      isTrackingEscalaStop(stop) &&
      !!stop.actualArrival &&
      !stop.actualDeparture,
  );
}

/**
 * Destino con llegada registrada, pendiente de cierre fiscal (`trip_arrived`).
 * No aplica si hay escalas sin salir o paradas sin llegada previas.
 */
export function findDestinationAwaitingTripArrival(
  stops: TripStop[],
): TripStop | undefined {
  if (findNextStopForArrival(stops)) return undefined;
  if (findActiveEscalaForDeparture(stops)) return undefined;

  const ordered = getOrderedStops(stops);
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const stop = ordered[i];
    if (!stop || !isDestinationStop(stop)) continue;
    if (!stop.actualArrival) return undefined;
    if (stop.status === "completed") return undefined;
    return stop;
  }
  return undefined;
}
