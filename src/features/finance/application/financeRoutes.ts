/**
 * Rutas del módulo Finanzas (paths limpios bajo /finance/*).
 * Redirects legacy ?tab= y helpers de navegación entre secciones.
 */

import {
  FINANCE_ANALYSIS_VIEW_PARAM,
  FINANCE_COBROS_RFC_PARAM,
  type FinanceAnalysisView,
  sanitizeAnalysisDimension,
} from "./financeListingFilters";

const FINANCE_ANALYSIS_FILTER_PARAMS = [
  "dimension",
  "granularity",
  "from",
  "to",
  "vehicleId",
  "status",
  "type",
] as const;

const LEGACY_TAB_ALIASES: Record<
  string,
  { segment: string; view?: FinanceAnalysisView }
> = {
  cobranza: { segment: "cobros" },
  profitability: { segment: "analysis", view: "margin" },
  expenses: { segment: "analysis", view: "expenses" },
  reports: { segment: "analysis", view: "margin" },
};

const TAB_TO_PATH: Record<string, string> = {
  summary: "/finance",
  invoiceable: "/finance/invoiceable",
  cobros: "/finance/cobros",
  approvals: "/finance/approvals",
  "dispatch-runs": "/finance/dispatch-runs",
  invoices: "/finance/invoices",
  analysis: "/finance/analysis",
};

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
  for (const key of FINANCE_ANALYSIS_FILTER_PARAMS) {
    const value = options?.preserveFrom?.get(key);
    if (!value) continue;
    if (key === "dimension") {
      const sanitized = sanitizeAnalysisDimension(view, value);
      if (sanitized) params.set(key, sanitized);
      continue;
    }
    params.set(key, value);
  }
  params.set(FINANCE_ANALYSIS_VIEW_PARAM, view);
  return params;
}
