import {
  FINANCE_COBROS_PATH,
  FINANCE_DISPATCH_PATH,
  FINANCE_EFECTIVO_POR_COBRAR_PATH,
  FINANCE_INVOICEABLE_PATH,
} from "../../application/financeRoutes";
import { financeCopy } from "../copy";

/** Colas del ciclo (K4): Por facturar · Envíos · Facturas a crédito · Cobros sin factura. */
export type FinanceCycleStepId =
  | "invoiceable"
  | "dispatch"
  | "cobros"
  | "operational";

export interface FinanceCycleCan {
  invoiceable: boolean;
  dispatch: boolean;
  cobros: boolean;
  operational: boolean;
}

export interface FinanceCycleStepCounts {
  invoiceable?: number;
  dispatch?: number;
  cobros?: number;
  cobrosBalance?: number;
  cobrosRepExceptions?: number;
  operational?: number;
  operationalBalance?: number;
}

export interface FinanceCycleStep {
  id: FinanceCycleStepId;
  label: string;
  hint: string;
  countLabel: string;
  href: string;
}

const CYCLE_HREFS: Record<FinanceCycleStepId, string> = {
  invoiceable: FINANCE_INVOICEABLE_PATH,
  dispatch: FINANCE_DISPATCH_PATH,
  cobros: FINANCE_COBROS_PATH,
  operational: FINANCE_EFECTIVO_POR_COBRAR_PATH,
};

function formatBalance(amount: number | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

/** Pasos/colas del ciclo. Se encoge por permiso. */
export function buildFinanceCycleSteps(
  can: FinanceCycleCan,
  counts: FinanceCycleStepCounts = {},
): FinanceCycleStep[] {
  const copy = financeCopy.page.hub.cycle;
  const steps: FinanceCycleStep[] = [];

  if (can.invoiceable) {
    const n = counts.invoiceable ?? 0;
    steps.push({
      id: "invoiceable",
      label: copy.invoiceable.label,
      hint: copy.invoiceable.hint,
      countLabel: copy.invoiceable.countLabel(n),
      href: CYCLE_HREFS.invoiceable,
    });
  }
  if (can.dispatch) {
    const n = counts.dispatch ?? 0;
    steps.push({
      id: "dispatch",
      label: copy.dispatch.label,
      hint: copy.dispatch.hint,
      countLabel: copy.dispatch.countLabel(n),
      href: CYCLE_HREFS.dispatch,
    });
  }
  if (can.cobros) {
    const n = counts.cobros ?? 0;
    steps.push({
      id: "cobros",
      label: copy.cobros.label,
      hint: copy.cobros.hint(
        formatBalance(counts.cobrosBalance),
        counts.cobrosRepExceptions ?? 0,
      ),
      countLabel: copy.cobros.countLabel(n),
      href: CYCLE_HREFS.cobros,
    });
  }
  if (can.operational) {
    const n = counts.operational ?? 0;
    steps.push({
      id: "operational",
      label: copy.operational.label,
      hint: copy.operational.hint(formatBalance(counts.operationalBalance)),
      countLabel: copy.operational.countLabel(n),
      href: CYCLE_HREFS.operational,
    });
  }

  return steps;
}
