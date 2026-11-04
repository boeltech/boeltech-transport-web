import { resolveTrackingNextAction as domainResolveTrackingNextAction } from "@boeltech/cfdi-domain/reglas/tracking-rules";
import type { TrackingNextActionKind } from "@boeltech/cfdi-domain/reglas/tracking-rules";
import {
  StopType,
  getOrderedStops,
  type StopTypeValue,
  type TripStop,
} from "@features/trips/domain";
import { mapTripStopToGatingLike } from "../utils/trackingCargoGating";

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

/**
 * Hito de la secuencia en curso. Sin cargas: el paquete no convierte la
 * salida en `resolve_cargo`, y estos find siguen localizando la parada.
 */
function findStopForInProgressKind(
  stops: readonly TripStop[],
  kind: TrackingNextActionKind,
): TripStop | undefined {
  const action = domainResolveTrackingNextAction({
    tripStatus: "in_progress",
    stops: stops.map(mapTripStopToGatingLike),
  });
  if (action.kind !== kind || action.stopId == null) return undefined;
  return stops.find((stop) => stop.id === action.stopId);
}

/** Origen con llegada pero sin salida fiscal (trip_departed). */
export function findOriginAwaitingDeparture(
  stops: readonly TripStop[],
): TripStop | undefined {
  return findStopForInProgressKind(stops, "depart_origin");
}

export function findNextStopForArrival(
  stops: readonly TripStop[],
): TripStop | undefined {
  return findStopForInProgressKind(stops, "register_arrival");
}

export function findActiveEscalaForDeparture(
  stops: readonly TripStop[],
): TripStop | undefined {
  return findStopForInProgressKind(stops, "register_departure");
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
  return findStopForInProgressKind(stops, "finalize_destination");
}
