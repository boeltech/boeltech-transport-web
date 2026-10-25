/**
 * Acciones de carga operables desde Operate (F3 / D6).
 * Solo pickup/deliver pendientes en visita activa — no relaja el gate de dominio.
 */

import { TripStatus, type TripCargo, type TripStatusType, type TripStop } from "@features/trips/domain";

import {
  getCargoManualActions,
  type CargoManualAction,
} from "../../utils/cargoStatusActions";
import { getStopCargoLinks } from "../../utils/stopCargoCorrelation";
import { canOperateCargoAtStop } from "../../utils/trackingCargoGating";
import { trackingCopy } from "./trackingCopy";

export type OperatePendingCargoAction = {
  cargoId: string;
  description: string;
  action: Extract<CargoManualAction, "pickup" | "deliver">;
};

/**
 * Cargas con acción primaria pendiente en la parada (visita activa + viaje en ruta).
 */
export function listOperatePendingCargoActions(
  stop: TripStop,
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
  tripStatus: TripStatusType,
): OperatePendingCargoAction[] {
  if (tripStatus !== TripStatus.IN_PROGRESS) return [];
  if (!canOperateCargoAtStop(stop, tripStatus)) return [];

  const links = getStopCargoLinks(stop, cargos, orderedStops);
  const items: OperatePendingCargoAction[] = [];

  for (const link of links) {
    if (link.movement.completedAt != null) continue;
    const available = getCargoManualActions(link.cargo.status, true);
    if (link.movementType === "pickup" && available.includes("pickup")) {
      items.push({
        cargoId: link.cargo.id,
        description: link.cargo.description,
        action: "pickup",
      });
    }
    if (link.movementType === "delivery" && available.includes("deliver")) {
      items.push({
        cargoId: link.cargo.id,
        description: link.cargo.description,
        action: "deliver",
      });
    }
  }

  return items;
}

/** Copy CTA Operate: 1 carga = verbo directo; N = registrar en parada. */
export function resolveOperateCargoCtaLabel(
  items: readonly OperatePendingCargoAction[],
  stopLabel: string,
): string {
  if (items.length === 1) {
    return items[0]!.action === "pickup"
      ? trackingCopy.action.markPickup
      : trackingCopy.action.markDeliver;
  }
  return trackingCopy.action.registerCargosAtStop(stopLabel);
}
