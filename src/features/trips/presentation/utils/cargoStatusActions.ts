/**
 * Acciones manuales de estado de carga — gobernadas por @boeltech/cfdi-domain.
 */

import {
  canReturnCargoInStopContext,
  canTransitionCargoStatus,
  getAvailableCargoTransitions,
  resolveCargoReturnStopRole,
  type CargoStatus as CargoStatusRule,
} from "@boeltech/cfdi-domain";
import {
  CargoStatus,
  type CargoStatusType,
  type TripStop,
} from "@features/trips/domain";

export type CargoManualAction = "pickup" | "deliver" | "return" | "cancel";

const ACTION_TO_STATUS: Record<CargoManualAction, CargoStatusRule> = {
  pickup: "in_transit",
  deliver: "delivered",
  return: "returned",
  cancel: "cancelled",
};

function normalizeStopTypes(
  stopType: TripStop["stopType"],
): Array<"pickup" | "delivery" | "origin" | "destination" | "waypoint"> {
  return (Array.isArray(stopType) ? stopType : [stopType]) as Array<
    "pickup" | "delivery" | "origin" | "destination" | "waypoint"
  >;
}

export function cargoActionToStatus(action: CargoManualAction): CargoStatusType {
  return ACTION_TO_STATUS[action] as CargoStatusType;
}

export function canPerformCargoAction(
  currentStatus: CargoStatusType,
  action: CargoManualAction,
): boolean {
  return canTransitionCargoStatus(
    currentStatus as CargoStatusRule,
    ACTION_TO_STATUS[action],
  );
}

export function getCargoManualActions(
  currentStatus: CargoStatusType,
  tripInProgress: boolean,
): CargoManualAction[] {
  if (!tripInProgress) return [];

  const transitions = getAvailableCargoTransitions(
    currentStatus as CargoStatusRule,
  );
  const actions: CargoManualAction[] = [];

  if (transitions.includes("in_transit")) actions.push("pickup");
  if (transitions.includes("delivered")) actions.push("deliver");
  if (transitions.includes("returned")) actions.push("return");
  if (transitions.includes("cancelled")) actions.push("cancel");

  return actions;
}

/**
 * Acciones de carga filtradas por contexto de parada (CA-01 / D5).
 * Oculta Devolver en load_only + pending vía `canReturnCargoInStopContext`.
 */
export function getCargoManualActionsForStop(
  currentStatus: CargoStatusType,
  tripInProgress: boolean,
  stop: Pick<TripStop, "stopType">,
): CargoManualAction[] {
  const actions = getCargoManualActions(currentStatus, tripInProgress);
  if (!actions.includes("return")) return actions;

  const stopRole = resolveCargoReturnStopRole({
    stopType: normalizeStopTypes(stop.stopType),
  });
  const allowed = canReturnCargoInStopContext({
    from: currentStatus as CargoStatusRule,
    stopRole,
  });
  if (!allowed.ok) {
    return actions.filter((action) => action !== "return");
  }
  return actions;
}

export function isCargoTerminal(status: CargoStatusType): boolean {
  return (
    status === CargoStatus.DELIVERED ||
    status === CargoStatus.RETURNED ||
    status === CargoStatus.CANCELLED
  );
}

/**
 * L-D1′ layout de CTAs por carga en nested/workbench.
 * 1 CTA primaria sola → artboard side-by-side; Devolver/Cancelar o >1 → stack.
 */
export function resolveCargoCtaLayout(
  actions: readonly CargoManualAction[],
): "side-by-side" | "stack" {
  if (
    actions.length === 1 &&
    (actions[0] === "deliver" || actions[0] === "pickup")
  ) {
    return "side-by-side";
  }
  return "stack";
}

/** Microcopy Cancelar≠Devolver (handoff-prd). */
export function resolveCargoActionTransitionHint(
  action: CargoManualAction,
  stop: Pick<TripStop, "stopType">,
): string | null {
  const stopRole = resolveCargoReturnStopRole({
    stopType: normalizeStopTypes(stop.stopType),
  });
  if (action === "cancel") {
    if (stopRole === "load_only") {
      return "No se cargó. Luego declara viaje en falso o cancela el viaje.";
    }
    if (stopRole === "unload" || stopRole === "both") {
      return "La carga no se entrega ni regresa en este viaje.";
    }
  }
  if (action === "return") {
    return "Queda a bordo. Después planea el retorno al origen.";
  }
  return null;
}
