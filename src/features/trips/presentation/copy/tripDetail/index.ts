import { billingCopy } from "./billingCopy";
import { cargoCopy } from "./cargoCopy";
import { costsCopy } from "./costsCopy";
import { fleetSnapshotCopy } from "./fleetSnapshotCopy";
import { historyCopy } from "./historyCopy";
import { operationCopy } from "./operationCopy";
import { progressCopy } from "./progressCopy";
import { routeCopy } from "./routeCopy";
import { shellCopy } from "./shellCopy";
import { trackingCopy } from "./trackingCopy";
import { tripOrderCopy } from "./tripOrderCopy";

/**
 * Agregador del detalle de viaje.
 * Convención lógica: trips.copy.tripDetail.<tab>.*
 */
export const tripDetailCopy = {
  tracking: trackingCopy,
  operation: operationCopy,
  fleetSnapshot: fleetSnapshotCopy,
  tripOrder: tripOrderCopy,
  route: routeCopy,
  progress: progressCopy,
  cargo: cargoCopy,
  costs: costsCopy,
  billing: billingCopy,
  history: historyCopy,
  shell: shellCopy,
} as const;

export {
  billingCopy,
  cargoCopy,
  costsCopy,
  fleetSnapshotCopy,
  historyCopy,
  operationCopy,
  progressCopy,
  routeCopy,
  shellCopy,
  trackingCopy,
  tripOrderCopy,
};
