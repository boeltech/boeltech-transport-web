import {
  buildClientOperationalReceiptBatchHref,
  FINANCE_EFECTIVO_POR_COBRAR_LEGACY_PATH,
  FINANCE_EFECTIVO_POR_COBRAR_PATH,
} from "../../application/financeRoutes";
import { resolveInternalAppHref } from "@shared/utils/resolveInternalAppHref";

function pathOnly(href: string): string {
  return href.split("?")[0] ?? href;
}

/** Bandeja Cobros sin factura (canónico o legacy ES). */
export function isOperationalCashPendingHref(href: string): boolean {
  const path = pathOnly(href);
  return (
    path === FINANCE_EFECTIVO_POR_COBRAR_PATH ||
    path === FINANCE_EFECTIVO_POR_COBRAR_LEGACY_PATH
  );
}

/**
 * Cancel / Volver del alta de lote:
 * - desde bandeja → misma bandeja (conserva query)
 * - ficha / sin origen / otro from → ficha del cliente
 */
export function resolveOperationalReceiptBatchCreateBackHref(
  from: string | undefined,
  clientId: string,
): string {
  const fallback = `/clients/${clientId}`;
  if (from && isOperationalCashPendingHref(from)) {
    return resolveInternalAppHref(from, fallback);
  }
  return fallback;
}

/**
 * Destino post-éxito del alta de lote (mismo origen que cancel/back):
 * - desde bandeja → misma bandeja (query intacta; sin Sheet)
 * - ficha / sin origen → ficha con `?batch=` (host abre Sheet)
 */
export function resolveOperationalReceiptBatchCreateSuccessHref(
  from: string | undefined,
  clientId: string,
  batchId: string,
): string {
  const backHref = resolveOperationalReceiptBatchCreateBackHref(from, clientId);
  if (isOperationalCashPendingHref(backHref)) {
    return backHref;
  }
  return buildClientOperationalReceiptBatchHref(clientId, batchId);
}
