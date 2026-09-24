import type { InvoiceListItem } from "@features/invoicing/domain";

export type DispatchPendingNoteKind = "failed" | "auto_cutoff";

/**
 * Nota de la cola Pendientes (D9):
 * - failed → badge destructive soft
 * - auto_cutoff → badge neutral si auto habilitado y aún no falló
 */
export function resolveDispatchPendingNote(
  autoDispatch: InvoiceListItem["autoDispatch"],
): DispatchPendingNoteKind | null {
  if (!autoDispatch) return null;
  if (autoDispatch.lastItemStatus === "failed") return "failed";
  if (autoDispatch.enabledForClient) return "auto_cutoff";
  return null;
}
