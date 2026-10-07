/**
 * Rutas del módulo Finanzas (paths limpios bajo /finance/*).
 * Redirects legacy ?tab= y helpers de navegación entre secciones.
 */

import { monthPeriodDateRange } from "./analysisPeriod";
import {
  FINANCE_ANALYSIS_VIEW_PARAM,
  FINANCE_COBROS_RFC_PARAM,
  type FinanceAnalysisView,
  parseProfitabilityLossFilter,
  sanitizeAnalysisDimension,
} from "./financeListingFilters";

/** Parámetros que cada vista aplica; el resto se quita de la URL al cambiar de vista. */
const FINANCE_ANALYSIS_VIEW_PARAMS: Record<FinanceAnalysisView, readonly string[]> = {
  performance: [],
  margin: ["from", "to", "scope", "dimension", "status"],
  expenses: ["from", "to", "vehicleId", "dimension", "granularity"],
};

const LEGACY_TAB_ALIASES: Record<
  string,
  { segment: string; view?: FinanceAnalysisView }
> = {
  cobranza: { segment: "cobros" },
  profitability: { segment: "analysis", view: "margin" },
  expenses: { segment: "analysis", view: "expenses" },
  reports: { segment: "analysis", view: "margin" },
};

/** Workbench unificado de envío de facturas. */
export const FINANCE_DISPATCH_PATH = "/finance/dispatch";

/** Lotes del periodo + frecuencias de envío. */
export const FINANCE_DISPATCH_PERIOD_PATH = "/finance/dispatch/period";

export const FINANCE_DISPATCH_PENDING_HREF = `${FINANCE_DISPATCH_PATH}?tab=pending`;

/** Compat: historial de corridas → envíos del periodo. */
export const FINANCE_DISPATCH_HISTORY_HREF = FINANCE_DISPATCH_PERIOD_PATH;

const TAB_TO_PATH: Record<string, string> = {
  summary: "/finance",
  invoiceable: "/finance/invoiceable",
  cobros: "/finance/cobros",
  approvals: "/finance/approvals",
  "dispatch-runs": FINANCE_DISPATCH_PERIOD_PATH,
  dispatch: FINANCE_DISPATCH_PATH,
  invoices: "/finance/invoices",
  analysis: "/finance/analysis",
};

export function FINANCE_DISPATCH_DETAIL_PATH(id: string): string {
  return `${FINANCE_DISPATCH_PATH}/${id}`;
}

/** Resuelve /finance?tab=xxx (+ query útil) → /finance/xxx?… */
export function resolveLegacyFinanceLocation(search: string): string {
  const params = new URLSearchParams(search);
  const requestedTab = params.get("tab");
  if (!requestedTab) {
    return "/finance";
  }

  const alias = LEGACY_TAB_ALIASES[requestedTab];
  const segment = alias?.segment ?? requestedTab;
  const path = TAB_TO_PATH[segment] ?? "/finance/invoices";

  params.delete("tab");

  if (alias?.view && !params.has(FINANCE_ANALYSIS_VIEW_PARAM)) {
    params.set(FINANCE_ANALYSIS_VIEW_PARAM, alias.view);
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function buildFinanceCobrosPath(rfc?: string | null): string {
  const normalized = rfc?.trim().toUpperCase();
  if (!normalized) return "/finance/cobros";
  return `/finance/cobros?${FINANCE_COBROS_RFC_PARAM}=${encodeURIComponent(normalized)}`;
}

export function buildFinanceAnalysisSearchParams(
  view: FinanceAnalysisView,
  options?: { preserveFrom?: URLSearchParams },
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FINANCE_ANALYSIS_VIEW_PARAMS[view]) {
    const value = options?.preserveFrom?.get(key);
    if (!value) continue;
    if (key === "dimension") {
      const sanitized = sanitizeAnalysisDimension(view, value);
      if (sanitized) params.set(key, sanitized);
      continue;
    }
    if (key === "status" && !parseProfitabilityLossFilter(value)) continue;
    params.set(key, value);
  }
  params.set(FINANCE_ANALYSIS_VIEW_PARAM, view);
  return params;
}

/** Rentabilidad de un mes de negocio (`YYYY-MM`), p. ej. desde «Cifras por mes». */
export function buildFinanceMarginMonthHref(monthKey: string): string {
  const { from, to } = monthPeriodDateRange(monthKey);
  const params = new URLSearchParams({
    [FINANCE_ANALYSIS_VIEW_PARAM]: "margin",
    from,
    to,
  });
  return `/finance/analysis?${params.toString()}`;
}
