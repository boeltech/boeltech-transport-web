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
import { FINANCE_EFECTIVO_CLIENT_ID_PARAM } from "../domain/operationalCashPending";

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
  /** Legacy ES tab → workbench Cobros (path canónico EN). */
  cobranza: { segment: "payments" },
  profitability: { segment: "analysis", view: "margin" },
  expenses: { segment: "analysis", view: "expenses" },
  reports: { segment: "analysis", view: "margin" },
};

/** Hub Finanzas (Cartera / resumen). */
export const FINANCE_HUB_PATH = "/finance";

/** Cola Por facturar. */
export const FINANCE_INVOICEABLE_PATH = "/finance/invoiceable";

/** Registro / listado de facturas. */
export const FINANCE_INVOICES_PATH = "/finance/invoices";

/**
 * Workbench Cobros (facturas a crédito).
 * Canónico EN; legacy `/finance/cobros` redirige aquí.
 */
export const FINANCE_COBROS_PATH = "/finance/payments";

/** Path ES legacy del workbench Cobros (redirect → {@link FINANCE_COBROS_PATH}). */
export const FINANCE_COBROS_LEGACY_PATH = "/finance/cobros";

/**
 * Bandeja Efectivo por cobrar (canal operativo sin CFDI).
 * Canónico EN; query deep-link: `?clientId=` (F3 card cliente).
 * Legacy `/finance/efectivo-por-cobrar` redirige aquí.
 */
export const FINANCE_EFECTIVO_POR_COBRAR_PATH =
  "/finance/operational-cash-pending";

/** Path ES legacy de la bandeja operativa (redirect → {@link FINANCE_EFECTIVO_POR_COBRAR_PATH}). */
export const FINANCE_EFECTIVO_POR_COBRAR_LEGACY_PATH =
  "/finance/efectivo-por-cobrar";

/**
 * Formulario único «Registrar cobro» (con / sin factura).
 * Canónico EN; query tipada en UI camelCase.
 */
export const FINANCE_COLLECTIONS_NEW_PATH = "/finance/collections/new";

export type CollectionChannel = "with_invoice" | "without_invoice";

export const COLLECTION_CHANNEL_PARAM = "channel";
export const COLLECTION_CLIENT_ID_PARAM = "clientId";
export const COLLECTION_INVOICE_ID_PARAM = "invoiceId";
export const COLLECTION_INVOICE_IDS_PARAM = "invoiceIds";
export const COLLECTION_TRIP_ID_PARAM = "tripId";
export const COLLECTION_TRIP_IDS_PARAM = "tripIds";
export const COLLECTION_RECEIVER_RFC_PARAM = "receiverRfc";
export const COLLECTION_FROM_PARAM = "from";

export interface BuildRegisterCollectionPathParams {
  channel: CollectionChannel;
  clientId?: string | null;
  invoiceId?: string | null;
  invoiceIds?: readonly string[] | null;
  tripId?: string | null;
  tripIds?: readonly string[] | null;
  receiverRfc?: string | null;
  from?: string | null;
}

/** Path + query del formulario único de cobro. */
export function buildRegisterCollectionPath(
  params: BuildRegisterCollectionPathParams,
): string {
  const search = new URLSearchParams();
  search.set(COLLECTION_CHANNEL_PARAM, params.channel);
  const clientId = params.clientId?.trim();
  if (clientId) search.set(COLLECTION_CLIENT_ID_PARAM, clientId);
  const invoiceId = params.invoiceId?.trim();
  if (invoiceId) search.set(COLLECTION_INVOICE_ID_PARAM, invoiceId);
  const invoiceIds = (params.invoiceIds ?? [])
    .map((id) => id.trim())
    .filter(Boolean);
  if (invoiceIds.length > 0) {
    search.set(COLLECTION_INVOICE_IDS_PARAM, invoiceIds.join(","));
  }
  const tripId = params.tripId?.trim();
  if (tripId) search.set(COLLECTION_TRIP_ID_PARAM, tripId);
  const tripIds = (params.tripIds ?? [])
    .map((id) => id.trim())
    .filter(Boolean);
  if (tripIds.length > 0) {
    search.set(COLLECTION_TRIP_IDS_PARAM, tripIds.join(","));
  }
  const receiverRfc = params.receiverRfc?.trim().toUpperCase();
  if (receiverRfc) search.set(COLLECTION_RECEIVER_RFC_PARAM, receiverRfc);
  const from = params.from?.trim();
  if (from) search.set(COLLECTION_FROM_PARAM, from);
  return `${FINANCE_COLLECTIONS_NEW_PATH}?${search.toString()}`;
}

/**
 * Path legacy «Registrar cobro por lote» (B2).
 * Preferir {@link buildRegisterCollectionPath}; este path redirige al form único (P3).
 */
export function buildOperationalReceiptBatchCreatePath(clientId: string): string {
  return buildRegisterCollectionPath({
    channel: "without_invoice",
    clientId,
  });
}

/**
 * Query params deep-link a hoja «Cobro» en ficha cliente (Datos).
 * Patrón ERP: igual que `?download=` en facturas.
 */
export const OPERATIONAL_RECEIPT_BATCH_PARAM = "batch";
export const COLLECTION_PAYMENT_PARAM = "payment";
export const COLLECTION_RECEIPT_PARAM = "receipt";

/** Ficha cliente + abre Sheet del cobro (`?batch=`). Tab Datos = default (sin `tab=`). */
export function buildClientOperationalReceiptBatchHref(
  clientId: string,
  batchId: string,
): string {
  const params = new URLSearchParams();
  params.set(OPERATIONAL_RECEIPT_BATCH_PARAM, batchId);
  return `/clients/${clientId}?${params.toString()}`;
}

/** Ficha cliente + abre hoja Cobro con factura (`?payment=`). */
export function buildClientCollectionPaymentHref(
  clientId: string,
  paymentId: string,
): string {
  const params = new URLSearchParams();
  params.set(COLLECTION_PAYMENT_PARAM, paymentId);
  return `/clients/${clientId}?${params.toString()}`;
}

/** Ficha cliente + abre hoja Cobro legacy receipt (`?receipt=`). */
export function buildClientCollectionReceiptHref(
  clientId: string,
  receiptId: string,
): string {
  const params = new URLSearchParams();
  params.set(COLLECTION_RECEIPT_PARAM, receiptId);
  return `/clients/${clientId}?${params.toString()}`;
}

/** Bandeja de aprobaciones (finanzas). */
export const FINANCE_APPROVALS_PATH = "/finance/approvals";

/** Workbench unificado de envío de facturas. */
export const FINANCE_DISPATCH_PATH = "/finance/dispatch";

/** Lotes del periodo + frecuencias de envío. */
export const FINANCE_DISPATCH_PERIOD_PATH = "/finance/dispatch/period";

export const FINANCE_DISPATCH_PENDING_HREF = `${FINANCE_DISPATCH_PATH}?tab=pending`;

/** Compat: historial de corridas → Correo del periodo. */
export const FINANCE_DISPATCH_HISTORY_HREF = FINANCE_DISPATCH_PERIOD_PATH;

const TAB_TO_PATH: Record<string, string> = {
  summary: FINANCE_HUB_PATH,
  invoiceable: FINANCE_INVOICEABLE_PATH,
  cobros: FINANCE_COBROS_PATH,
  payments: FINANCE_COBROS_PATH,
  approvals: FINANCE_APPROVALS_PATH,
  "dispatch-runs": FINANCE_DISPATCH_PERIOD_PATH,
  dispatch: FINANCE_DISPATCH_PATH,
  invoices: FINANCE_INVOICES_PATH,
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
    return FINANCE_HUB_PATH;
  }

  const alias = LEGACY_TAB_ALIASES[requestedTab];
  const segment = alias?.segment ?? requestedTab;
  const path = TAB_TO_PATH[segment] ?? FINANCE_INVOICES_PATH;

  params.delete("tab");

  if (alias?.view && !params.has(FINANCE_ANALYSIS_VIEW_PARAM)) {
    params.set(FINANCE_ANALYSIS_VIEW_PARAM, alias.view);
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function buildFinanceCobrosPath(rfc?: string | null): string {
  const normalized = rfc?.trim().toUpperCase();
  if (!normalized) return FINANCE_COBROS_PATH;
  return `${FINANCE_COBROS_PATH}?${FINANCE_COBROS_RFC_PARAM}=${encodeURIComponent(normalized)}`;
}

/** Deep-link bandeja operativa; opcional filtro por cliente (F3). */
export function buildFinanceEfectivoPorCobrarPath(
  clientId?: string | null,
): string {
  const id = clientId?.trim();
  if (!id) return FINANCE_EFECTIVO_POR_COBRAR_PATH;
  return `${FINANCE_EFECTIVO_POR_COBRAR_PATH}?${FINANCE_EFECTIVO_CLIENT_ID_PARAM}=${encodeURIComponent(id)}`;
}

/** CTA fila → detalle viaje en tab Costos (única escritura de abonos). */
export function buildTripCostsHref(tripId: string): string {
  return `/trips/${tripId}?tab=costs`;
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

/** Path + query de una vista de Análisis (nav Hub / deep-links). */
export function buildFinanceAnalysisHref(
  view: FinanceAnalysisView,
  options?: { preserveFrom?: URLSearchParams },
): string {
  const params = buildFinanceAnalysisSearchParams(view, options);
  return `/finance/analysis?${params.toString()}`;
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
