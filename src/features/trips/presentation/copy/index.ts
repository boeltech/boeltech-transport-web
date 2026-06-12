/**
 * Copy ACC por feature (FSD presentation layer).
 *
 * Convención:
 * - Ruta física: `src/features/<feature>/presentation/copy/`
 * - Namespace lógico: `<feature>.copy.<surface>.*`
 * - Detalle de viaje: `trips.copy.tripDetail.<tab>.*` vía `tripDetailCopy`
 * - Wizard alta: `trips.copy.wizard.*` vía `wizardCopy`
 */
export { formatAccLine } from "./formatAccLine";
export type { CopyAcc } from "./types";
export type { CopyAcc as TrackingCopyAcc } from "./types";

export {
  tripDetailCopy,
  trackingCopy,
  operationCopy,
  progressCopy,
  routeCopy,
  cargoCopy,
  costsCopy,
  historyCopy,
  shellCopy,
} from "./tripDetail";

export {
  wizardCopy,
  shellCopy as wizardShellCopy,
  routeCopy as wizardRouteCopy,
  cargoCopy as wizardCargoCopy,
  costsCopy as wizardCostsCopy,
  expenseCopy,
  fiscalCopy,
  summaryCopy,
  LOCATION_CAPTURE_LABELS,
  ROUTE_CAPTURE_LABELS,
  RFC_PUBLICO_GENERAL,
  getDeliveryFiscalCopy,
  getPrimaryFiscalSectionCopy,
  publicGeneralRfcNotice,
  resolveStopFiscalUiContext,
} from "./wizard";
export type { CfdiDocumentIntent, StopFiscalUiContext } from "./wizard";
