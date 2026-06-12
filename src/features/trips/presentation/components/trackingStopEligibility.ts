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

/** Paradas donde aplica «Registrar llegada» (origen, escalas y destino). */
export function isManualArrivalStop(stop: Pick<TripStop, "stopType">): boolean {
  return (
    isOriginStop(stop) ||
    isTrackingEscalaStop(stop) ||
    isDestinationStop(stop)
  );
}

export function findOriginStop(stops: readonly TripStop[]): TripStop | undefined {
  return getOrderedStops(stops).find((stop) => isOriginStop(stop));
}

/** Origen sin llegada registrada (primer paso tras dispatch). */
export function findOriginAwaitingArrival(
  stops: readonly TripStop[],
): TripStop | undefined {
  const origin = findOriginStop(stops);
  if (!origin || origin.actualArrival) return undefined;
  return origin;
}

/** Origen con llegada pero sin salida fiscal (trip_departed). */
export function findOriginAwaitingDeparture(
  stops: readonly TripStop[],
): TripStop | undefined {
  const origin = findOriginStop(stops);
  if (!origin || !origin.actualArrival || origin.actualDeparture) {
    return undefined;
  }
  return origin;
}

export function findNextStopForArrival(
  stops: readonly TripStop[],
): TripStop | undefined {
  return getOrderedStops(stops).find((stop) => {
    if (!isManualArrivalStop(stop) || stop.actualArrival) return false;
    // Origen cerrado con trip_departed no requiere stop_arrived previo.
    if (
      isOriginStop(stop) &&
      (stop.status === "completed" || stop.actualDeparture != null)
    ) {
      return false;
    }
    return true;
  });
}

export function findActiveEscalaForDeparture(
  stops: readonly TripStop[],
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
 *
 * Si el destino ya quedó `completed` a nivel parada (p. ej. `stop_departed`)
 * pero el viaje sigue `in_progress`, aún debe ofrecerse el cierre fiscal.
 */
export function findDestinationAwaitingTripArrival(
  stops: readonly TripStop[],
): TripStop | undefined {
  if (findOriginAwaitingDeparture(stops)) return undefined;
  if (findNextStopForArrival(stops)) return undefined;
  if (findActiveEscalaForDeparture(stops)) return undefined;

  const ordered = getOrderedStops(stops);
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const stop = ordered[i];
    if (!stop || !isDestinationStop(stop)) continue;
    if (!stop.actualArrival) return undefined;
    return stop;
  }

  const allStopsCompleted =
    ordered.length > 0 &&
    ordered.every((stop) => stop.status === "completed" && stop.actualArrival);

  if (allStopsCompleted) {
    return ordered[ordered.length - 1];
  }

  return undefined;
}
