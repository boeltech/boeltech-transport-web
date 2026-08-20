/**
 * Resuelve tabs del hub Finanzas + vista de Análisis, con redirects de URLs legadas.
 */

import type {
  ProfitabilityDimension,
  ProfitabilityScope,
  ProfitabilityStatus,
} from "@features/finance/domain";

export const FINANCE_TAB_PARAM = "tab";
export const FINANCE_ANALYSIS_VIEW_PARAM = "view";
/** RFC precargado al abrir Cobros desde Resumen (D2). */
export const FINANCE_COBROS_RFC_PARAM = "rfc";

export const FINANCE_TABS = [
  "summary",
  "invoiceable",
  "invoices",
  "cobros",
  "analysis",
  "approvals",
] as const;

export type FinanceHubTab = (typeof FINANCE_TABS)[number];

export const FINANCE_ANALYSIS_VIEWS = ["margin", "expenses"] as const;

export type FinanceAnalysisView = (typeof FINANCE_ANALYSIS_VIEWS)[number];

export const MARGIN_ANALYSIS_DIMENSIONS = [
  "client",
  "vehicle",
  "driver",
  "route",
  "month",
] as const satisfies readonly ProfitabilityDimension[];

export const EXPENSE_ANALYSIS_DIMENSIONS = [
  "vehicle",
  "driver",
  "client",
  "route",
] as const;

export const PROFITABILITY_SCOPES = [
  "operational",
  "with_in_progress",
  "pipeline",
  "cancelled",
  "all",
] as const satisfies readonly ProfitabilityScope[];

export const PROFITABILITY_STATUSES = [
  "high",
  "medium",
  "low",
  "breakeven",
  "loss",
] as const satisfies readonly ProfitabilityStatus[];

export const EXPENSE_GRANULARITIES = ["day", "week", "month"] as const;

export type ExpenseAnalysisDimension = (typeof EXPENSE_ANALYSIS_DIMENSIONS)[number];
export type ExpenseGranularity = (typeof EXPENSE_GRANULARITIES)[number];

export const DEFAULT_MARGIN_DIMENSION: ProfitabilityDimension = "client";
export const DEFAULT_EXPENSE_DIMENSION: ExpenseAnalysisDimension = "vehicle";
export const DEFAULT_PROFITABILITY_SCOPE: ProfitabilityScope = "operational";
export const DEFAULT_EXPENSE_GRANULARITY: ExpenseGranularity = "month";

const LEGACY_TAB_REDIRECT: Record<
  string,
  { tab: FinanceHubTab; view?: FinanceAnalysisView }
> = {
  cobranza: { tab: "cobros" },
  profitability: { tab: "analysis", view: "margin" },
  expenses: { tab: "analysis", view: "expenses" },
  reports: { tab: "analysis", view: "margin" },
};

export const FINANCE_PRESERVED_URL_PARAMS = [
  FINANCE_TAB_PARAM,
  FINANCE_ANALYSIS_VIEW_PARAM,
] as const;

const FINANCE_ANALYSIS_FILTER_PARAMS = [
  "dimension",
  "granularity",
  "from",
  "to",
  "vehicleId",
] as const;

function includesValue<T extends string>(
  list: readonly T[],
  value: string | null | undefined,
): value is T {
  return value != null && (list as readonly string[]).includes(value);
}

export function isFinanceHubTab(value: string | null): value is FinanceHubTab {
  return value != null && (FINANCE_TABS as readonly string[]).includes(value);
}

export function isFinanceAnalysisView(
  value: string | null,
): value is FinanceAnalysisView {
  return (
    value != null &&
    (FINANCE_ANALYSIS_VIEWS as readonly string[]).includes(value)
  );
}

export function parseProfitabilityDimension(
  raw: string | null | undefined,
): ProfitabilityDimension {
  if (includesValue(MARGIN_ANALYSIS_DIMENSIONS, raw)) return raw;
  return DEFAULT_MARGIN_DIMENSION;
}

export function parseExpenseDimension(
  raw: string | null | undefined,
): ExpenseAnalysisDimension {
  if (includesValue(EXPENSE_ANALYSIS_DIMENSIONS, raw)) return raw;
  return DEFAULT_EXPENSE_DIMENSION;
}

export function parseProfitabilityScope(
  raw: string | null | undefined,
): ProfitabilityScope {
  if (includesValue(PROFITABILITY_SCOPES, raw)) return raw;
  return DEFAULT_PROFITABILITY_SCOPE;
}

export function parseProfitabilityStatus(
  raw: string | null | undefined,
): ProfitabilityStatus | undefined {
  if (!raw || raw === "all") return undefined;
  if (includesValue(PROFITABILITY_STATUSES, raw)) return raw;
  return undefined;
}

export function parseExpenseGranularity(
  raw: string | null | undefined,
): ExpenseGranularity {
  if (includesValue(EXPENSE_GRANULARITIES, raw)) return raw;
  return DEFAULT_EXPENSE_GRANULARITY;
}

/** Omite dimension si está vacía o no aplica a la vista de Análisis. */
export function sanitizeAnalysisDimension(
  view: FinanceAnalysisView,
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  if (view === "margin") {
    return includesValue(MARGIN_ANALYSIS_DIMENSIONS, raw) ? raw : undefined;
  }
  return includesValue(EXPENSE_ANALYSIS_DIMENSIONS, raw) ? raw : undefined;
}

export function resolveFinanceLegacyTab(requested: string | null): {
  tab: FinanceHubTab | null;
  view?: FinanceAnalysisView;
  redirected: boolean;
} {
  if (!requested) {
    return { tab: null, redirected: false };
  }
  if (isFinanceHubTab(requested)) {
    return { tab: requested, redirected: false };
  }
  const legacy = LEGACY_TAB_REDIRECT[requested];
  if (legacy) {
    return { ...legacy, redirected: true };
  }
  return { tab: null, redirected: false };
}

export function buildFinanceTabSearchParams(
  tab: string,
  options?: {
    view?: FinanceAnalysisView;
    preserveFrom?: URLSearchParams;
    /** Solo aplica en tab cobros; limpia al cambiar de tab. */
    rfc?: string | null;
  },
): URLSearchParams {
  const params = new URLSearchParams();
  const analysisView: FinanceAnalysisView = options?.view ?? "margin";
  for (const key of FINANCE_ANALYSIS_FILTER_PARAMS) {
    const value = options?.preserveFrom?.get(key);
    if (!value) continue;
    if (key === "dimension" && tab === "analysis") {
      const sanitized = sanitizeAnalysisDimension(analysisView, value);
      if (sanitized) params.set(key, sanitized);
      continue;
    }
    params.set(key, value);
  }
  params.set(FINANCE_TAB_PARAM, tab);
  if (tab === "analysis") {
    params.set(FINANCE_ANALYSIS_VIEW_PARAM, analysisView);
  }
  if (tab === "cobros") {
    const rfc =
      options?.rfc?.trim() ||
      options?.preserveFrom?.get(FINANCE_COBROS_RFC_PARAM)?.trim() ||
      "";
    if (rfc) params.set(FINANCE_COBROS_RFC_PARAM, rfc.toUpperCase());
  }
  return params;
}
