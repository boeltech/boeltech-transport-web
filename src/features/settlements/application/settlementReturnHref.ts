import {
  COMPENSATION_HUB_PATH,
  COMPENSATION_TEMPLATES_PATH,
} from "@features/compensation/application";
import { FINANCE_APPROVALS_PATH } from "@features/finance/application";
import {
  LEGACY_FINANCE_SETTLEMENTS_CREATE_PATH,
  LEGACY_FINANCE_SETTLEMENTS_PATH,
  SETTLEMENTS_CREATE_PATH,
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_PENDING_APPROVAL_PATH,
  settlementsPendingApprovalPath,
} from "./settlementsRoutes";

function hrefPath(href: string): string {
  return href.split("?")[0] ?? href;
}

function hrefSearch(href: string): string {
  const q = href.indexOf("?");
  return q >= 0 ? href.slice(q + 1) : "";
}

/**
 * Solo colas internas de pagos / aprobaciones / tarifas (Pagos a operadores).
 * Usado al volver desde detalle, alta y Reglas de autorización.
 * Acepta paths legacy `/finance/settlements/*` y `/finance/compensation/*` durante transición F2.
 */
export function isSafeSettlementReturnHref(href: string): boolean {
  const path = hrefPath(href);
  if (
    path === SETTLEMENTS_CREATE_PATH ||
    path === LEGACY_FINANCE_SETTLEMENTS_CREATE_PATH
  ) {
    return false;
  }
  if (
    path === FINANCE_APPROVALS_PATH ||
    path.startsWith(`${FINANCE_APPROVALS_PATH}/`)
  ) {
    return true;
  }
  if (
    path === COMPENSATION_HUB_PATH ||
    path.startsWith(`${COMPENSATION_HUB_PATH}/`)
  ) {
    return true;
  }
  if (
    path === COMPENSATION_TEMPLATES_PATH ||
    path.startsWith(`${COMPENSATION_TEMPLATES_PATH}/`)
  ) {
    return true;
  }
  if (path === SETTLEMENTS_LIST_PATH || path.startsWith(`${SETTLEMENTS_LIST_PATH}/`)) {
    return true;
  }
  if (
    path === LEGACY_FINANCE_SETTLEMENTS_PATH ||
    path.startsWith(`${LEGACY_FINANCE_SETTLEMENTS_PATH}/`)
  ) {
    return true;
  }
  return false;
}

/**
 * Normaliza deep-links legacy de vuelta (p. ej. tab Por autorizar → bucket approval;
 * `driverId` → `employeeId` en el bucket).
 */
export function canonicalizeSettlementReturnHref(href: string): string {
  const path = hrefPath(href);
  const params = new URLSearchParams(hrefSearch(href));

  if (path === SETTLEMENTS_PENDING_APPROVAL_PATH) {
    const employeeId =
      params.get("employeeId") ?? params.get("driverId") ?? undefined;
    return settlementsPendingApprovalPath(
      employeeId ? { employeeId } : undefined,
    );
  }

  if (path === SETTLEMENTS_LIST_PATH && params.get("bucket") === "approval") {
    const employeeId =
      params.get("employeeId") ?? params.get("driverId") ?? undefined;
    return settlementsPendingApprovalPath(
      employeeId ? { employeeId } : undefined,
    );
  }

  return href;
}
