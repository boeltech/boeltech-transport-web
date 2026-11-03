/**
 * Configuración del workbench de Envíos.
 *
 * Buckets vía `?tab=`:
 *   pending  → cola de pendientes
 *   sent     → enviadas
 * Tipo vía `?document_kind=` (all | invoice | rep).
 * El lote del periodo es crossLink (no tab).
 */

import type { DispatchDocumentKindFilter } from "@features/invoicing/domain";

export type DispatchWorkbenchTabId = "pending" | "sent";

export const DISPATCH_WORKBENCH_TABS: DispatchWorkbenchTabId[] = [
  "pending",
  "sent",
];

export const DEFAULT_DISPATCH_TAB: DispatchWorkbenchTabId = "pending";

export const DISPATCH_TAB_PARAM = "tab";

/** Filtro Tipo del workbench tipado (paridad API document_kind). */
export const DISPATCH_DOCUMENT_KIND_PARAM = "document_kind";

export const DEFAULT_DISPATCH_DOCUMENT_KIND: DispatchDocumentKindFilter = "all";

export const DISPATCH_DOCUMENT_KIND_OPTIONS: DispatchDocumentKindFilter[] = [
  "all",
  "invoice",
  "rep",
];

/** Paginación de la cola Pendientes. */
export const DISPATCH_PENDING_PAGE_SIZE = 25;

/** Paginación de la cola Enviadas. */
export const DISPATCH_SENT_PAGE_SIZE = 25;

export function isDispatchWorkbenchTab(
  value: string | null | undefined,
): value is DispatchWorkbenchTabId {
  return value === "pending" || value === "sent";
}

export function parseDispatchWorkbenchTab(
  value: string | null | undefined,
): DispatchWorkbenchTabId {
  return isDispatchWorkbenchTab(value) ? value : DEFAULT_DISPATCH_TAB;
}

export function isDispatchDocumentKindFilter(
  value: string | null | undefined,
): value is DispatchDocumentKindFilter {
  return value === "all" || value === "invoice" || value === "rep";
}

export function parseDispatchDocumentKindFilter(
  value: string | null | undefined,
): DispatchDocumentKindFilter {
  return isDispatchDocumentKindFilter(value)
    ? value
    : DEFAULT_DISPATCH_DOCUMENT_KIND;
}
