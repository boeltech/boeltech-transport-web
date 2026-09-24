/**
 * Configuración del workbench de Envío de facturas (F1).
 *
 * Buckets vía `?tab=`:
 *   pending  → cola de pendientes (F2)
 *   sent     → enviadas (F4)
 *   history  → historial de corridas (funcional en F1)
 */

export type DispatchWorkbenchTabId = "pending" | "sent" | "history";

export const DISPATCH_WORKBENCH_TABS: DispatchWorkbenchTabId[] = [
  "pending",
  "sent",
  "history",
];

export const DEFAULT_DISPATCH_TAB: DispatchWorkbenchTabId = "pending";

export const DISPATCH_TAB_PARAM = "tab";

/** Paginación de la cola Pendientes (F2). */
export const DISPATCH_PENDING_PAGE_SIZE = 25;

/** Paginación de la cola Enviadas (F4). */
export const DISPATCH_SENT_PAGE_SIZE = 25;

export function isDispatchWorkbenchTab(
  value: string | null | undefined,
): value is DispatchWorkbenchTabId {
  return (
    value === "pending" || value === "sent" || value === "history"
  );
}

export function parseDispatchWorkbenchTab(
  value: string | null | undefined,
): DispatchWorkbenchTabId {
  return isDispatchWorkbenchTab(value) ? value : DEFAULT_DISPATCH_TAB;
}
