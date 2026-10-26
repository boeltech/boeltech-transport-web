import {
  FINANCE_COBROS_PATH,
  FINANCE_DISPATCH_PATH,
  FINANCE_INVOICEABLE_PATH,
} from "../../application/financeRoutes";
import { financeCopy } from "../copy";

/** Ciclo CxC: Emitir → Enviar → Cobrar. Aprobaciones vive en sidebar, no aquí. */
export type FinanceCycleStepId = "invoiceable" | "dispatch" | "cobros";

export interface FinanceCycleCan {
  invoiceable: boolean;
  dispatch: boolean;
  cobros: boolean;
}

export interface FinanceCycleStep {
  id: FinanceCycleStepId;
  verb: string;
  label: string;
  hint: string;
  href: string;
}

const CYCLE_HREFS: Record<FinanceCycleStepId, string> = {
  invoiceable: FINANCE_INVOICEABLE_PATH,
  dispatch: FINANCE_DISPATCH_PATH,
  cobros: FINANCE_COBROS_PATH,
};

/** Pasos del ciclo del dinero. Sin Cartera, Facturas ni Aprobaciones; se encoge por permiso. */
export function buildFinanceCycleSteps(can: FinanceCycleCan): FinanceCycleStep[] {
  const copy = financeCopy.page.hub.cycle;
  const steps: FinanceCycleStep[] = [];

  if (can.invoiceable) {
    steps.push({
      id: "invoiceable",
      verb: copy.invoiceable.verb,
      label: copy.invoiceable.label,
      hint: copy.invoiceable.hint,
      href: CYCLE_HREFS.invoiceable,
    });
  }
  if (can.dispatch) {
    steps.push({
      id: "dispatch",
      verb: copy.dispatch.verb,
      label: copy.dispatch.label,
      hint: copy.dispatch.hint,
      href: CYCLE_HREFS.dispatch,
    });
  }
  if (can.cobros) {
    steps.push({
      id: "cobros",
      verb: copy.cobros.verb,
      label: copy.cobros.label,
      hint: copy.cobros.hint,
      href: CYCLE_HREFS.cobros,
    });
  }

  return steps;
}
