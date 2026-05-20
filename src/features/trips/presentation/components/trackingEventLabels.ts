import {
  StopType,
  STOP_TYPE_LABELS,
  type StopTypeValue,
  type TrackingEventType,
  type TripStop,
} from "@features/trips/domain";

function normalizeStopTypes(
  stopType: StopTypeValue | StopTypeValue[],
): StopTypeValue[] {
  return Array.isArray(stopType) ? stopType : [stopType];
}

function primaryStopRoleLabel(stop: TripStop): string | null {
  const types = normalizeStopTypes(stop.stopType);
  if (types.includes(StopType.ORIGIN)) return STOP_TYPE_LABELS[StopType.ORIGIN];
  if (types.includes(StopType.DESTINATION)) {
    return STOP_TYPE_LABELS[StopType.DESTINATION];
  }
  if (types.includes(StopType.WAYPOINT)) {
    return STOP_TYPE_LABELS[StopType.WAYPOINT];
  }
  if (types.includes(StopType.PICKUP)) return STOP_TYPE_LABELS[StopType.PICKUP];
  if (types.includes(StopType.DELIVERY)) {
    return STOP_TYPE_LABELS[StopType.DELIVERY];
  }
  return null;
}

export function formatTrackingEventLabel(
  eventType: TrackingEventType,
  stop?: TripStop | null,
): string {
  const role = stop ? primaryStopRoleLabel(stop) : null;

  switch (eventType) {
    case "trip_departed":
      return "Viaje iniciado";
    case "stop_arrived":
      return role ? `Llegada — ${role}` : "Llegada a parada";
    case "stop_departed":
      return role ? `Salida — ${role}` : "Salida de parada";
    case "trip_arrived":
      return "Viaje finalizado";
    case "incident":
      return "Incidente reportado";
    case "note":
      return "Nota operativa";
    default:
      return eventType;
  }
}
