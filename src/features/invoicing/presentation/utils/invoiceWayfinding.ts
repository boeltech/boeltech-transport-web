import { invoicingCopy } from "../copy/invoicingCopy";

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

/**
 * Label del chevron al salir de factura.
 * Detalle de viaje → Volver al viaje; listado → Volver a viajes.
 */
export function resolveInvoiceWayfindingBackLabel(
  href: string,
  options?: { isClientPortal?: boolean },
): string {
  if (options?.isClientPortal) {
    if (href === "/finance/invoices" || href.startsWith("/finance/invoices?")) {
      return invoicingCopy.detail.header.backToClientInvoices;
    }
  }
  if (href.startsWith("/trips/") && !href.startsWith("/trips/new")) {
    return invoicingCopy.blocked.backToTrip;
  }
  if (href === "/trips" || href.startsWith("/trips?")) {
    return invoicingCopy.empty.backToTrips;
  }
  if (href === "/finance/cobros" || href.startsWith("/finance/cobros?")) {
    return invoicingCopy.detail.header.backToCobros;
  }
  const dispatchPath = pathOnly(href);
  if (dispatchPath === "/finance/dispatch") {
    return invoicingCopy.detail.header.backToDispatch;
  }
  if (dispatchPath === "/finance/dispatch/period") {
    return invoicingCopy.detail.header.backToDispatchPeriod;
  }
  if (dispatchPath.startsWith("/finance/dispatch/")) {
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
    backHref: "/finance/invoices",
  };
}
