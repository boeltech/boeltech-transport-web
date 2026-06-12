export const FINANCE_TAB_PARAM = "tab";

export const FINANCE_PRESERVED_URL_PARAMS = [FINANCE_TAB_PARAM] as const;

export function buildFinanceTabSearchParams(tab: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set(FINANCE_TAB_PARAM, tab);
  return params;
}
