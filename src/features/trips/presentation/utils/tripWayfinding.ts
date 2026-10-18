import { isApprovalsInboxHref } from "@features/approvals";
import {
  FINANCE_DISPATCH_PATH,
  FINANCE_INVOICEABLE_PATH,
  FINANCE_INVOICES_PATH,
} from "@features/finance/application";
import { resolveInternalAppHref } from "@shared/utils/resolveInternalAppHref";
import { shellCopy } from "../copy/tripDetail/shellCopy";

const TRIPS_LIST_FALLBACK = "/trips";
const SETTLEMENTS_PATH_PREFIX = "/finance/settlements";

function pathOnly(href: string): string {
  return href.split("?")[0] ?? href;
}

/** Detalle de factura (`/invoices/:id`), no alta ni edit. */
export function isInvoiceDetailHref(href: string): boolean {
  const path = pathOnly(href);
  if (path === "/invoices/new") return false;
  return /^\/invoices\/[^/]+$/.test(path);
}

function isTripAppHref(href: string): boolean {
  return (
    href === "/trips" ||
    href.startsWith("/trips/") ||
    href.startsWith("/trips?")
  );
}

function isFinanceInvoicesHref(href: string): boolean {
  const path = pathOnly(href);
  return (
    path === FINANCE_INVOICES_PATH ||
    path.startsWith(`${FINANCE_INVOICES_PATH}/`)
  );
}

function isFinanceInvoiceableHref(href: string): boolean {
  const path = pathOnly(href);
  return (
    path === FINANCE_INVOICEABLE_PATH ||
    path.startsWith(`${FINANCE_INVOICEABLE_PATH}/`)
  );
}

function isFinanceDispatchHref(href: string): boolean {
  const path = pathOnly(href);
  return (
    path === FINANCE_DISPATCH_PATH ||
    path.startsWith(`${FINANCE_DISPATCH_PATH}/`)
  );
}

function isSettlementsHref(href: string): boolean {
  const path = pathOnly(href);
  return (
    path === SETTLEMENTS_PATH_PREFIX ||
    path.startsWith(`${SETTLEMENTS_PATH_PREFIX}/`)
  );
}

/**
 * Colas razonables para el chevron de vuelta desde detalle de viaje (Ola 6).
 * Paridad conceptual con `isSafeInvoiceReturnHref`.
 */
export function isSafeTripReturnHref(href: string): boolean {
  if (isTripAppHref(href)) return true;
  if (isFinanceInvoiceableHref(href)) return true;
  if (isFinanceDispatchHref(href)) return true;
  if (isApprovalsInboxHref(href)) return true;
  if (isSettlementsHref(href)) return true;
  if (isInvoiceDetailHref(href)) return true;
  if (isFinanceInvoicesHref(href)) return true;
  return false;
}

/**
 * Resuelve `location.state.from` para el detalle de viaje.
 * Rechaza URLs externas y rutas internas fuera de la allowlist.
 */
export function resolveTripBackHref(from: string | undefined): string {
  if (from == null || from.trim() === "") return TRIPS_LIST_FALLBACK;

  const candidate = resolveInternalAppHref(from, TRIPS_LIST_FALLBACK);
  if (candidate === TRIPS_LIST_FALLBACK) return TRIPS_LIST_FALLBACK;
  if (!isSafeTripReturnHref(candidate)) return TRIPS_LIST_FALLBACK;
  return candidate;
}

/**
 * Opción S (PRD wayfinding): `state.from` al navegar del alta de factura
 * (`/invoices/new`) al detalle de viaje. Reutiliza el origen seguro del create
 * si ya está en la allowlist de trips; si no (o es `/invoices/new`), cae a
 * Por facturar. Nunca pasa `from: /invoices/new` ni lo añade a la allowlist.
 */
export function resolveTripReturnHrefFromInvoiceCreate(
  from: string | undefined,
): string {
  if (from == null || from.trim() === "") return FINANCE_INVOICEABLE_PATH;

  const trimmed = from.trim();
  if (trimmed.startsWith("/invoices/new")) return FINANCE_INVOICEABLE_PATH;

  const candidate = resolveInternalAppHref(trimmed, FINANCE_INVOICEABLE_PATH);
  if (!isSafeTripReturnHref(candidate)) return FINANCE_INVOICEABLE_PATH;
  return candidate;
}

/**
 * Label del chevron al salir del detalle de viaje.
 * Factura → Volver a la factura; listado facturas → Volver a facturas;
 * Bandeja de aprobaciones → Volver a aprobaciones;
 * Por facturar → Volver a Por facturar;
 * envío de facturas → Volver al envío / a envíos;
 * pago a operador → Volver al pago;
 * resto → Volver a Viajes.
 */
export function resolveTripWayfindingBackLabel(href: string): string {
  if (isInvoiceDetailHref(href)) {
    return shellCopy.state.backToInvoice;
  }
  if (isFinanceInvoicesHref(href)) {
    return shellCopy.state.backToInvoices;
  }
  if (isApprovalsInboxHref(href)) {
    return shellCopy.state.backToApprovals;
  }
  const path = pathOnly(href);
  if (path === FINANCE_INVOICEABLE_PATH) {
    return shellCopy.state.backToInvoiceable;
  }
  if (path === FINANCE_DISPATCH_PATH) {
    return shellCopy.state.backToDispatch;
  }
  if (path === `${FINANCE_DISPATCH_PATH}/period`) {
    return shellCopy.state.backToDispatchPeriod;
  }
  if (path.startsWith(`${FINANCE_DISPATCH_PATH}/`)) {
    return shellCopy.state.backToDispatchRun;
  }
  if (path === "/finance/settlements/new") {
    return shellCopy.state.backToSettlementPayment;
  }
  if (
    path.startsWith("/finance/settlements/") &&
    path !== "/finance/settlements/pending-approval" &&
    path !== "/finance/settlements/registry" &&
    path !== "/finance/settlements/advances"
  ) {
    return shellCopy.state.backToSettlementPayment;
  }
  return shellCopy.state.backToList;
}

/** D9: 403 del conductor/cliente — no es suyo o pide vínculo. */
export function resolveTripAccessDeniedCopy(
  isDriverPortal: boolean,
  isClientPortal = false,
) {
  if (isClientPortal) {
    return {
      title: shellCopy.state.accessDeniedTitle,
      description: shellCopy.state.accessDeniedDescriptionClient,
      backLabel: shellCopy.state.backToListClient,
    };
  }
  return {
    title: shellCopy.state.accessDeniedTitle,
    description: isDriverPortal
      ? shellCopy.state.accessDeniedDescriptionDriver
      : shellCopy.state.accessDeniedDescription,
    backLabel: isDriverPortal
      ? shellCopy.state.backToListDriver
      : shellCopy.state.backToList,
  };
}
