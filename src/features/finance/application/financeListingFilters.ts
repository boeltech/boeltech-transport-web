/**
 * Filtros de listado/análisis de Finanzas (query params por ruta).
 */

import type {
  FinanceInvoiceStatus,
  ProfitabilityDimension,
  ProfitabilityScope,
  ProfitabilityStatus,
} from "@features/finance/domain";

export const FINANCE_ANALYSIS_VIEW_PARAM = "view";
/** RFC precargado al abrir Cobros desde Resumen. */
export const FINANCE_COBROS_RFC_PARAM = "rfc";

/** Query param del workbench Envío de facturas (`?tab=`). */
export const FINANCE_DISPATCH_TAB_PARAM = "tab";

/** Query params que no se borran al limpiar filtros de listado. */
export const FINANCE_PRESERVED_URL_PARAMS = [
  FINANCE_ANALYSIS_VIEW_PARAM,
  FINANCE_COBROS_RFC_PARAM,
  FINANCE_DISPATCH_TAB_PARAM,
] as const;

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

/** Estados de factura del listado Facturas (lockstep API invoiceQuerySchema + stamping). */
export const FINANCE_INVOICE_STATUSES = [
  "draft",
  "stamping",
  "stamped",
  "cancellation_pending",
  "cancelled",
] as const satisfies readonly FinanceInvoiceStatus[];

export const EXPENSE_GRANULARITIES = ["day", "week", "month"] as const;

export type ExpenseAnalysisDimension = (typeof EXPENSE_ANALYSIS_DIMENSIONS)[number];
export type ExpenseGranularity = (typeof EXPENSE_GRANULARITIES)[number];

export const DEFAULT_MARGIN_DIMENSION: ProfitabilityDimension = "client";
export const DEFAULT_EXPENSE_DIMENSION: ExpenseAnalysisDimension = "vehicle";
export const DEFAULT_PROFITABILITY_SCOPE: ProfitabilityScope = "operational";
export const DEFAULT_EXPENSE_GRANULARITY: ExpenseGranularity = "month";

function includesValue<T extends string>(
  list: readonly T[],
  value: string | null | undefined,
): value is T {
  return value != null && (list as readonly string[]).includes(value);
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

export function parseFinanceInvoiceStatus(
  raw: string | null | undefined,
): FinanceInvoiceStatus | undefined {
  if (!raw || raw === "all") return undefined;
  if (includesValue(FINANCE_INVOICE_STATUSES, raw)) return raw;
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
