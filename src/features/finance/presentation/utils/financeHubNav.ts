import { financeCopy } from "../copy";

export type FinanceCycleStepId =
  | "invoiceable"
  | "dispatch"
  | "cobros"
  | "approvals";

export interface FinanceCycleCan {
  invoiceable: boolean;
  dispatch: boolean;
  cobros: boolean;
  approvals: boolean;
}

export interface FinanceCycleStep {
  id: FinanceCycleStepId;
  verb: string;
  label: string;
  hint: string;
  href: string;
}

const CYCLE_HREFS: Record<FinanceCycleStepId, string> = {
  invoiceable: "/finance/invoiceable",
  dispatch: "/finance/dispatch",
  cobros: "/finance/cobros",
  approvals: "/finance/approvals",
};

/** Pasos del ciclo del dinero. Sin Cartera ni Facturas; se encoge por permiso. */
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
  if (can.approvals) {
    steps.push({
      id: "approvals",
      verb: copy.approvals.verb,
      label: copy.approvals.label,
      hint: copy.approvals.hint,
      href: CYCLE_HREFS.approvals,
    });
  }

  return steps;
}
