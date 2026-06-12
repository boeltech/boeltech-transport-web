import { basicInfoCopy } from "./basicInfoCopy";
import { cargoCopy } from "./cargoCopy";
import { costsCopy } from "./costsCopy";
import { expenseCopy } from "./expenseCopy";
import { fiscalCopy, getDeliveryFiscalCopy, getPrimaryFiscalSectionCopy, publicGeneralRfcNotice, resolveStopFiscalUiContext, RFC_PUBLICO_GENERAL } from "./fiscalCopy";
import type { CfdiDocumentIntent, StopFiscalUiContext } from "./fiscalCopy";
import { routeCopy, LOCATION_CAPTURE_LABELS, ROUTE_CAPTURE_LABELS } from "./routeCopy";
import { shellCopy } from "./shellCopy";
import { summaryCopy } from "./summaryCopy";

export const wizardCopy = {
  shell: shellCopy,
  basicInfo: basicInfoCopy,
  route: routeCopy,
  cargo: cargoCopy,
  costs: costsCopy,
  expense: expenseCopy,
  fiscal: fiscalCopy,
  summary: summaryCopy,
} as const;

export {
  shellCopy,
  basicInfoCopy,
  routeCopy,
  cargoCopy,
  costsCopy,
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
};
export type { CfdiDocumentIntent, StopFiscalUiContext };
