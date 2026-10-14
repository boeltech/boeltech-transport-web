/**
 * Deep-link del chrome de alertas (D6): `?tab=overview&assignFleet=1`
 * abre el sheet de asignación de flota en el tab Operación.
 */

export const TRIP_ASSIGN_FLEET_PARAM = "assignFleet";
export const TRIP_ASSIGN_FLEET_PARAM_VALUE = "1";

export function wantsOpenAssignFleetSheet(
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  return (
    searchParams.get(TRIP_ASSIGN_FLEET_PARAM) === TRIP_ASSIGN_FLEET_PARAM_VALUE
  );
}

/** Navega a Operación y pide abrir el sheet de flota. */
export function applyOpenAssignFleetSearchParams(
  prev: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(prev);
  next.set("tab", "overview");
  next.set(TRIP_ASSIGN_FLEET_PARAM, TRIP_ASSIGN_FLEET_PARAM_VALUE);
  return next;
}

export function clearAssignFleetSearchParams(
  prev: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(prev);
  next.delete(TRIP_ASSIGN_FLEET_PARAM);
  return next;
}
