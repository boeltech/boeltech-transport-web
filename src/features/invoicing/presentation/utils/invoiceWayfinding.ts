import { resolveInternalAppHref } from "@shared/utils/resolveInternalAppHref";
import { invoicingCopy } from "../copy/invoicingCopy";

/** Paths finance allowlist — literales (invoicing no puede importar finance). */
const FINANCE_INVOICES_PATH = "/finance/invoices";
const FINANCE_INVOICEABLE_PATH = "/finance/invoiceable";
const FINANCE_COBROS_PATH = "/finance/cobros";
const FINANCE_DISPATCH_PATH = "/finance/dispatch";

function pathOnly(href: string): string {
  return href.split("?")[0] ?? href;
}

/** Href de detalle o listado de viaje (con o sin query). */
export function isTripAppHref(href: string): boolean {
  return (
    href === "/trips" ||
    href.startsWith("/trips/") ||
    href.startsWith("/trips?")
  );
}

function isFinanceInvoicesHref(href: string): boolean {
  const path = pathOnly(href);
  return path === FINANCE_INVOICES_PATH || path.startsWith(`${FINANCE_INVOICES_PATH}/`);
}

function isFinanceInvoiceableHref(href: string): boolean {
  const path = pathOnly(href);
  return (
    path === FINANCE_INVOICEABLE_PATH ||
    path.startsWith(`${FINANCE_INVOICEABLE_PATH}/`)
  );
}

function isFinanceCobrosHref(href: string): boolean {
  const path = pathOnly(href);
  return path === FINANCE_COBROS_PATH || path.startsWith(`${FINANCE_COBROS_PATH}/`);
}

function isFinanceDispatchHref(href: string): boolean {
  const path = pathOnly(href);
  return (
    path === FINANCE_DISPATCH_PATH || path.startsWith(`${FINANCE_DISPATCH_PATH}/`)
  );
}

/** Colas razonables para el chevron de vuelta desde detalle de factura (O3-INV-FROM). */
export function isSafeInvoiceReturnHref(href: string): boolean {
  if (isFinanceInvoicesHref(href)) return true;
  if (isFinanceInvoiceableHref(href)) return true;
  if (isFinanceCobrosHref(href)) return true;
  if (isFinanceDispatchHref(href)) return true;
  if (isTripAppHref(href)) return true;
  return false;
}

/**
 * Resuelve `location.state.from` para el detalle de factura.
 * Rechaza URLs externas y rutas internas fuera de la allowlist.
 */
export function resolveInvoiceBackHref(
  from: string | undefined,
  options?: { tripId?: string },
): string {
  const fallback = options?.tripId
    ? `/trips/${options.tripId}`
    : FINANCE_INVOICES_PATH;

  if (from == null || from.trim() === "") return fallback;

  const trimmed = from.trim();
  if (trimmed.startsWith("/invoices/new")) return fallback;

  const candidate = resolveInternalAppHref(trimmed, fallback);
  if (candidate === fallback) return fallback;
  if (!isSafeInvoiceReturnHref(candidate)) return fallback;
  return candidate;
}

/**
 * Label del chevron al salir de factura.
 * Detalle de viaje → Volver al viaje; listado → Volver a viajes.
 */
export function resolveInvoiceWayfindingBackLabel(
  href: string,
  options?: { isClientPortal?: boolean },
): string {
  if (options?.isClientPortal) {
    if (
      href === FINANCE_INVOICES_PATH ||
      href.startsWith(`${FINANCE_INVOICES_PATH}?`)
    ) {
      return invoicingCopy.detail.header.backToClientInvoices;
    }
  }
  if (href.startsWith("/trips/") && !href.startsWith("/trips/new")) {
    return invoicingCopy.blocked.backToTrip;
  }
  if (href === "/trips" || href.startsWith("/trips?")) {
    return invoicingCopy.empty.backToTrips;
  }
  const path = pathOnly(href);
  if (path === FINANCE_INVOICEABLE_PATH) {
    return invoicingCopy.detail.header.backToInvoiceable;
  }
  if (href === FINANCE_COBROS_PATH || href.startsWith(`${FINANCE_COBROS_PATH}?`)) {
    return invoicingCopy.detail.header.backToCobros;
  }
  if (path === FINANCE_DISPATCH_PATH) {
    return invoicingCopy.detail.header.backToDispatch;
  }
  if (path === `${FINANCE_DISPATCH_PATH}/period`) {
    return invoicingCopy.detail.header.backToDispatchPeriod;
  }
  if (path.startsWith(`${FINANCE_DISPATCH_PATH}/`)) {
    return invoicingCopy.detail.header.backToDispatchRun;
  }
  return invoicingCopy.detail.header.backLabel;
}

/** D9: 403 del cliente — no es suya o pide vínculo; back a Mis facturas. */
export function resolveInvoiceAccessDeniedCopy(isClientPortal: boolean) {
  return {
    title: invoicingCopy.detail.forbidden.title,
    description: isClientPortal
      ? invoicingCopy.detail.forbidden.descriptionClient
      : invoicingCopy.detail.forbidden.description,
    backLabel: isClientPortal
      ? invoicingCopy.detail.header.backToClientInvoices
      : invoicingCopy.detail.notFound.backLabel,
    backHref: FINANCE_INVOICES_PATH,
  };
}
