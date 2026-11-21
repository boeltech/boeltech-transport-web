import { isApprovalsInboxHref } from "@features/approvals";
import {
  FINANCE_ANALYSIS_PATH,
  FINANCE_DISPATCH_PATH,
  FINANCE_INVOICEABLE_PATH,
  FINANCE_INVOICES_PATH,
} from "@features/finance/application";
import {
  LEGACY_FINANCE_SETTLEMENTS_PATH,
  OPERATOR_PAYMENTS_BASE_PATH,
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_CREATE_PATH,
  SETTLEMENTS_OPERATORS_PATH,
} from "@features/settlements/application";
import { resolveInternalAppHref } from "@shared/utils/resolveInternalAppHref";
import { shellCopy } from "../copy/tripDetail/shellCopy";

const TRIPS_LIST_FALLBACK = "/trips";
/** Subrutas canónicas que no son «Volver al pago» (lista / new / detalle). */
const OPERATOR_PAYMENTS_NON_PAYMENT_EXACT = new Set([
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_OPERATORS_PATH,
  `${OPERATOR_PAYMENTS_BASE_PATH}/cuts/new`,
]);
const LEGACY_SETTLEMENTS_NON_PAYMENT_EXACT = new Set([
  `${LEGACY_FINANCE_SETTLEMENTS_PATH}/pending-approval`,
  `${LEGACY_FINANCE_SETTLEMENTS_PATH}/registry`,
  `${LEGACY_FINANCE_SETTLEMENTS_PATH}/advances`,
]);

function pathOnly(href: string): string {
  return href.split("?")[0] ?? href;
}

/** Rechaza `..` / `.` en segmentos (p. ej. `/finance/operator-payments/../../x`). */
function hasUnsafePathSegments(path: string): boolean {
  return path.split("/").some((segment) => segment === ".." || segment === ".");
}

function isUnderPathPrefix(path: string, prefix: string): boolean {
  if (hasUnsafePathSegments(path)) return false;
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * `location.state` al abrir una factura desde el detalle de viaje (migas + chevron).
 * Preferir sobre `{ from }` solo para no duplicar «Viajes › Viajes › …».
 */
export function tripInvoiceNavState(
  tripId: string,
  tripCode: string,
  from?: string,
): { from: string; fromLabel: string } {
  return {
    from: from ?? `/trips/${tripId}`,
    fromLabel: tripCode,
  };
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

function isFinanceAnalysisHref(href: string): boolean {
  const path = pathOnly(href);
  if (hasUnsafePathSegments(path)) return false;
  return (
    path === FINANCE_ANALYSIS_PATH ||
    path.startsWith(`${FINANCE_ANALYSIS_PATH}/`)
  );
}

function isSettlementsHref(href: string): boolean {
  const path = pathOnly(href);
  return (
    isUnderPathPrefix(path, OPERATOR_PAYMENTS_BASE_PATH) ||
    isUnderPathPrefix(path, LEGACY_FINANCE_SETTLEMENTS_PATH)
  );
}

/**
 * Lista / new / detalle de pago (canónico o legado) → label «Volver al pago».
 * Excluye Anticipos, Operadores, cortes y colas del hub legado.
 */
function isSettlementPaymentReturnHref(href: string): boolean {
  const path = pathOnly(href);
  if (hasUnsafePathSegments(path)) return false;

  if (
    path === OPERATOR_PAYMENTS_BASE_PATH ||
    path === SETTLEMENTS_CREATE_PATH
  ) {
    return true;
  }
  if (isUnderPathPrefix(path, OPERATOR_PAYMENTS_BASE_PATH)) {
    if (OPERATOR_PAYMENTS_NON_PAYMENT_EXACT.has(path)) return false;
    if (path.startsWith(`${OPERATOR_PAYMENTS_BASE_PATH}/cuts/`)) return false;
    const rest = path.slice(`${OPERATOR_PAYMENTS_BASE_PATH}/`.length);
    return Boolean(rest) && !rest.includes("/");
  }

  if (path === `${LEGACY_FINANCE_SETTLEMENTS_PATH}/new`) return true;
  if (isUnderPathPrefix(path, LEGACY_FINANCE_SETTLEMENTS_PATH)) {
    if (LEGACY_SETTLEMENTS_NON_PAYMENT_EXACT.has(path)) return false;
    const rest = path.slice(`${LEGACY_FINANCE_SETTLEMENTS_PATH}/`.length);
    return Boolean(rest) && !rest.includes("/");
  }
  return false;
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
  if (isFinanceAnalysisHref(href)) return true;
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
  if (isFinanceAnalysisHref(href)) {
    return shellCopy.state.backToAnalysis;
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
  if (isSettlementPaymentReturnHref(href)) {
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
