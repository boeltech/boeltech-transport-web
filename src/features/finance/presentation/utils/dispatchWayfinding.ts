import {
  FINANCE_DISPATCH_PATH,
  FINANCE_DISPATCH_PERIOD_PATH,
} from "../../application/financeRoutes";
import { resolveInternalAppHref } from "@shared/utils/resolveInternalAppHref";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

function pathOnly(href: string): string {
  return href.split("?")[0] ?? href;
}

export function isFinanceDispatchWorkbenchHref(href: string): boolean {
  return pathOnly(href) === FINANCE_DISPATCH_PATH;
}

export function isFinanceDispatchPeriodHref(href: string): boolean {
  return pathOnly(href) === FINANCE_DISPATCH_PERIOD_PATH;
}

function isInvoiceAppHref(href: string): boolean {
  const path = pathOnly(href);
  return (
    path.startsWith("/invoices/") ||
    path === "/finance/invoices" ||
    path.startsWith("/finance/invoices/")
  );
}

/**
 * Cola de origen (workbench puntual, Correo del periodo o factura).
 * Sin `from` (bookmark / deep link) → ritual Correo del periodo, no el hub Envíos.
 */
export function resolveDispatchRunBackHref(from: string | undefined): string {
  if (from && isFinanceDispatchWorkbenchHref(from)) {
    return resolveInternalAppHref(from, FINANCE_DISPATCH_PATH);
  }
  if (from && isFinanceDispatchPeriodHref(from)) {
    return resolveInternalAppHref(from, FINANCE_DISPATCH_PERIOD_PATH);
  }
  if (from && isInvoiceAppHref(from)) {
    return resolveInternalAppHref(from, FINANCE_DISPATCH_PATH);
  }
  return FINANCE_DISPATCH_PERIOD_PATH;
}

export function resolveDispatchRunBackLabel(from: string | undefined): string {
  if (from && isFinanceDispatchWorkbenchHref(from)) {
    return dispatchRunsCopy.detail.backToWorkbench;
  }
  if (from && isFinanceDispatchPeriodHref(from)) {
    return dispatchRunsCopy.detail.backToList;
  }
  if (from && isInvoiceAppHref(from)) {
    return dispatchRunsCopy.detail.backToInvoice;
  }
  return dispatchRunsCopy.detail.backToList;
}

/**
 * Volver del listado de lotes al workbench puntual solo si se llegó desde Envíos.
 * Entrada directa por nav «Correo del periodo» → sin back a Envíos (Opción A / P2 VIS).
 */
export function resolvePeriodListBackHref(
  from: string | undefined,
): string | null {
  if (from && isFinanceDispatchWorkbenchHref(from)) {
    return resolveInternalAppHref(from, FINANCE_DISPATCH_PATH);
  }
  return null;
}
