/**
 * Resuelve tabs del hub Finanzas + vista de Análisis, con redirects de URLs legadas.
 */

export const FINANCE_TAB_PARAM = "tab";
export const FINANCE_ANALYSIS_VIEW_PARAM = "view";

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
  },
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FINANCE_ANALYSIS_FILTER_PARAMS) {
    const value = options?.preserveFrom?.get(key);
    if (value) params.set(key, value);
  }
  params.set(FINANCE_TAB_PARAM, tab);
  if (tab === "analysis") {
    params.set(
      FINANCE_ANALYSIS_VIEW_PARAM,
      options?.view ?? "margin",
    );
  }
  return params;
}
