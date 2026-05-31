import { cargoCopy } from "./cargoCopy";
import { costsCopy } from "./costsCopy";
import { historyCopy } from "./historyCopy";
import { operationCopy } from "./operationCopy";
import { routeCopy } from "./routeCopy";
import { shellCopy } from "./shellCopy";
import { trackingCopy } from "./trackingCopy";

/**
 * Agregador del detalle de viaje.
 * Convención lógica: trips.copy.tripDetail.<tab>.*
 */
export const tripDetailCopy = {
  tracking: trackingCopy,
  operation: operationCopy,
  route: routeCopy,
  cargo: cargoCopy,
  costs: costsCopy,
  history: historyCopy,
  shell: shellCopy,
} as const;

export {
  cargoCopy,
  costsCopy,
  historyCopy,
  operationCopy,
  routeCopy,
  shellCopy,
  trackingCopy,
};
