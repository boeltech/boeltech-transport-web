/**
 * Acciones de carga operables desde Operate (F3 / D6).
 * Solo pickup/deliver pendientes en visita activa — no relaja el gate de dominio.
 * F4c: CTAs por link en parada R7 «Retorno».
 */

import {
  CargoStatus,
  TripStatus,
  type TripCargo,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";

import {
  getCargoManualActionsForStop,
  isCargoTerminal,
  type CargoManualAction,
} from "../../utils/cargoStatusActions";
import {
  getStopCargoLinks,
  type StopCargoLink,
} from "../../utils/stopCargoCorrelation";
import { canOperateCargoAtStop } from "../../utils/trackingCargoGating";
import { resolveReturnStopVisitMap } from "./planReturnHelpers";
import { trackingCopy } from "./trackingCopy";

export type OperatePendingCargoAction = {
  cargoId: string;
  description: string;
  action: Extract<CargoManualAction, "pickup" | "deliver">;
};

/** Mapa visita R7 para gate F4c (`pending` | `in_progress`). */
export type ReturnStopVisitMap = ReturnType<typeof resolveReturnStopVisitMap>;
/** Alias de barrel: mismo shape que visit map (CTAs no usan label ampliado). */
export type ReturnStopLabelMap = ReturnStopVisitMap;

/**
 * CTAs Entregar/Devolver/Cancelar/Recoger por link carga↔parada.
 *
 * F4c / DOM ACEPTO: en parada inferida R7, la carga `returned` que «recibe de
 * vuelta» → cero CTAs. Otras `in_transit` en la misma R7 → descarga normal.
 * Unload no-R7 intacto. No inventa «Recibir» ni `returned→delivered`.
 * Gate R7 = visit map (`pending` | `in_progress`), no label ampliado.
 */
export function getCargoActionsForStopLink(
  link: StopCargoLink,
  tripInProgress: boolean,
  stop: TripStop,
  options?: {
    returnVisitMap?: ReturnStopVisitMap;
  },
): CargoManualAction[] {
  if (!tripInProgress) return [];

  const returnMeta = options?.returnVisitMap?.get(stop.id);
  if (
    returnMeta != null &&
    returnMeta.cargo.id === link.cargo.id &&
    link.cargo.status === CargoStatus.RETURNED
  ) {
    return [];
  }

  if (isCargoTerminal(link.cargo.status)) return [];

  const allActions = getCargoManualActionsForStop(
    link.cargo.status,
    tripInProgress,
    stop,
  );
  const actions: CargoManualAction[] = [];

  if (link.movementType === "pickup" && allActions.includes("pickup")) {
    actions.push("pickup");
  }
  if (link.movementType === "delivery" && allActions.includes("deliver")) {
    actions.push("deliver");
  }
  if (allActions.includes("return")) actions.push("return");
  if (allActions.includes("cancel")) actions.push("cancel");

  return actions;
}

/**
 * Cargas con acción primaria pendiente en la parada (visita activa + viaje en ruta).
 * Respeta F4c: no ofrece Entregar sobre carga returned en su R7.
 */
export function listOperatePendingCargoActions(
  stop: TripStop,
  cargos: readonly TripCargo[],
  orderedStops: readonly TripStop[],
  tripStatus: TripStatusType,
): OperatePendingCargoAction[] {
  if (tripStatus !== TripStatus.IN_PROGRESS) return [];
  if (!canOperateCargoAtStop(stop, tripStatus)) return [];

  const returnVisitMap = resolveReturnStopVisitMap(cargos, orderedStops);
  const links = getStopCargoLinks(stop, cargos, orderedStops);
  const items: OperatePendingCargoAction[] = [];

  for (const link of links) {
    if (link.movement.completedAt != null) continue;
    const available = getCargoActionsForStopLink(link, true, stop, {
      returnVisitMap,
    });
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
