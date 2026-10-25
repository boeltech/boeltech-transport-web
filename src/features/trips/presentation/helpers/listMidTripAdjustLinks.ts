/**
 * Deep-links mid-trip en chrome del detalle (F4 / D7).
 * Sin tab nuevo: navega a Ruta / Cargas / Operación+assignFleet.
 */

export type MidTripAdjustLinkId =
  | "pending_stops"
  | "add_cargo"
  | "reassign_fleet";

export type MidTripAdjustLink = {
  readonly id: MidTripAdjustLinkId;
  /** Tab del detalle. */
  readonly tab: "route" | "cargo" | "overview";
  /** Si true, aplica `?assignFleet=1` (sheet flota en Operación). */
  readonly openAssignFleet?: boolean;
};

export type ListMidTripAdjustLinksInput = {
  readonly canReplanPendingStops: boolean;
  readonly canAppendCargo: boolean;
  readonly canReassignFleet: boolean;
};

/**
 * Orden fijo PRD: paradas pendientes → agregar carga → reasignar.
 * Omite links sin permiso/capacidad; `[]` = no montar strip.
 */
export function listMidTripAdjustLinks(
  input: ListMidTripAdjustLinksInput,
): MidTripAdjustLink[] {
  const links: MidTripAdjustLink[] = [];

  if (input.canReplanPendingStops) {
    links.push({ id: "pending_stops", tab: "route" });
  }
  if (input.canAppendCargo) {
    links.push({ id: "add_cargo", tab: "cargo" });
  }
  if (input.canReassignFleet) {
    links.push({
      id: "reassign_fleet",
      tab: "overview",
      openAssignFleet: true,
    });
  }

  return links;
}
