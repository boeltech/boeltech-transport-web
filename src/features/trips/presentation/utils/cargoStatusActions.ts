/**
 * Acciones manuales de estado de carga — gobernadas por @boeltech/cfdi-domain.
 */

import {
  canTransitionCargoStatus,
  getAvailableCargoTransitions,
  type CargoStatus as CargoStatusRule,
} from "@boeltech/cfdi-domain";
import { CargoStatus, type CargoStatusType } from "@features/trips/domain";

export type CargoManualAction = "pickup" | "deliver" | "return" | "cancel";

const ACTION_TO_STATUS: Record<CargoManualAction, CargoStatusRule> = {
  pickup: "in_transit",
  deliver: "delivered",
  return: "returned",
  cancel: "cancelled",
};

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

export function isCargoTerminal(status: CargoStatusType): boolean {
  return (
    status === CargoStatus.DELIVERED ||
    status === CargoStatus.RETURNED ||
    status === CargoStatus.CANCELLED
  );
}
