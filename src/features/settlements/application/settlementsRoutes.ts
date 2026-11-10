import {
  COMPENSATION_HUB_PATH,
  COMPENSATION_TEMPLATES_PATH,
  LEGACY_AGREEMENTS_PATH,
  resolveLegacyAgreementsPath,
} from "@features/compensation/application";

/**
 * Rutas UI canónicas bajo /finance/operator-payments/* (TEC C.2 / PRD F2).
 * Redirects legacy: /finance/settlements/*, /settlements/*.
 */

export const OPERATOR_PAYMENTS_BASE_PATH = "/finance/operator-payments";

/** Pagos (Workbench). */
export const SETTLEMENTS_LIST_PATH = OPERATOR_PAYMENTS_BASE_PATH;

export const SETTLEMENTS_CREATE_PATH = `${OPERATOR_PAYMENTS_BASE_PATH}/new`;

/** Anticipos (Workbench). */
export const SETTLEMENTS_ADVANCES_PATH = `${OPERATOR_PAYMENTS_BASE_PATH}/advances`;

/** Operadores (List). */
export const SETTLEMENTS_OPERATORS_PATH = `${OPERATOR_PAYMENTS_BASE_PATH}/operators`;

/** Armar corte en lote (F6) — path reservado. */
export const SETTLEMENTS_CUTS_NEW_PATH = `${OPERATOR_PAYMENTS_BASE_PATH}/cuts/new`;

/**
 * Historial / Pagados: canónico = bucket del workbench.
 * TEC C.2 usa `paid`; el workbench actual identifica Pagados como `closed`.
 * Aceptamos ambos en el listado (`paid` → `closed`).
 */
export const SETTLEMENTS_REGISTRY_BUCKET = "closed";

/** @deprecated Prefer settlementsRegistryPath(); kept for callers that need a path string. */
export const SETTLEMENTS_REGISTRY_PATH = SETTLEMENTS_LIST_PATH;

/** Legacy path constants (redirect sources). */
export const LEGACY_FINANCE_SETTLEMENTS_PATH = "/finance/settlements";
export const LEGACY_FINANCE_SETTLEMENTS_CREATE_PATH =
  "/finance/settlements/new";
export const LEGACY_FINANCE_SETTLEMENTS_REGISTRY_PATH =
  "/finance/settlements/registry";
export const LEGACY_FINANCE_SETTLEMENTS_ADVANCES_PATH =
  "/finance/settlements/advances";
export const LEGACY_FINANCE_SETTLEMENTS_PENDING_APPROVAL_PATH =
  "/finance/settlements/pending-approval";

/** @deprecated Alias of legacy pending-approval path (redirect source). */
export const SETTLEMENTS_PENDING_APPROVAL_PATH =
  LEGACY_FINANCE_SETTLEMENTS_PENDING_APPROVAL_PATH;

const LEGACY_LIST_PATH = "/settlements";
const LEGACY_CREATE_PATH = "/settlements/new";

export function settlementDetailPath(id: string): string {
  return `${SETTLEMENTS_LIST_PATH}/${id}`;
}

export function settlementCreatePath(params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) {
    return SETTLEMENTS_CREATE_PATH;
  }

  const qs = new URLSearchParams(params).toString();

  return `${SETTLEMENTS_CREATE_PATH}?${qs}`;
}

export function settlementsAgreementsPath(params?: {
  employeeId?: string;
  periodStart?: string;
  periodEnd?: string;
}): string {
  if (!params?.employeeId && !params?.periodStart && !params?.periodEnd) {
    return COMPENSATION_TEMPLATES_PATH;
  }

  const qs = new URLSearchParams();
  if (params.employeeId) qs.set("employeeId", params.employeeId);
  if (params.periodStart) qs.set("periodStart", params.periodStart);
  if (params.periodEnd) qs.set("periodEnd", params.periodEnd);
  const query = qs.toString();
  return query
    ? `${COMPENSATION_TEMPLATES_PATH}?${query}`
    : COMPENSATION_TEMPLATES_PATH;
}

export function settlementsAdvancesPath(
  params?: Record<string, string>,
): string {
  if (!params || Object.keys(params).length === 0) {
    return SETTLEMENTS_ADVANCES_PATH;
  }

  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }

  const search = qs.toString();

  return search
    ? `${SETTLEMENTS_ADVANCES_PATH}?${search}`
    : SETTLEMENTS_ADVANCES_PATH;
}

export function settlementsRegistryPath(
  params?: Record<string, string>,
): string {
  return settlementsWorkbenchBucketPath(
    SETTLEMENTS_REGISTRY_BUCKET,
    params,
  );
}

/**
 * Cortes en autorización → bucket del workbench.
 * `driverId` se mapea a `employeeId` (compat deep-links del tab eliminado).
 */
export function settlementsPendingApprovalPath(
  params?: { driverId?: string; employeeId?: string },
): string {
  const employeeId = params?.employeeId ?? params?.driverId;
  return settlementsWorkbenchBucketPath(
    "approval",
    employeeId ? { employeeId } : undefined,
  );
}

export function settlementsWorkbenchBucketPath(
  bucket: string,
  params?: Record<string, string>,
): string {
  const qs = new URLSearchParams({ bucket });

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) qs.set(key, value);
    }
  }

  return `${SETTLEMENTS_LIST_PATH}?${qs.toString()}`;
}

/**
 * Redirects legacy query shapes on the list path:
 * - ?tab=agreements → Tarifas
 * - ?view=registry → Pagos ?bucket=closed
 * - ?tab=advances → Anticipos
 */
export function resolveSettlementsListRedirect(search: string): string | null {
  const normalized = search.startsWith("?") ? search.slice(1) : search;

  if (!normalized) return null;

  const params = new URLSearchParams(normalized);

  if (params.get("tab") === "agreements") {
    const employeeId = params.get("employeeId") ?? undefined;

    return resolveLegacyAgreementsPath(
      employeeId ? `?employeeId=${employeeId}` : "",
    );
  }

  if (params.get("view") === "registry") {
    params.delete("view");
    params.delete("tab");
    params.delete("bucket");

    const rest: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      if (value) rest[key] = value;
    }

    return settlementsRegistryPath(
      Object.keys(rest).length > 0 ? rest : undefined,
    );
  }

  if (params.get("tab") === "advances") {
    params.delete("tab");
    params.delete("view");
    params.delete("bucket");

    const qs = params.toString();

    return qs
      ? `${SETTLEMENTS_ADVANCES_PATH}?${qs}`
      : SETTLEMENTS_ADVANCES_PATH;
  }

  return null;
}

function appendSearch(path: string, search: string): string {
  if (!search) return path;
  return search.startsWith("?") ? `${path}${search}` : `${path}?${search}`;
}

/**
 * Resuelve pathname legacy `/settlements/*` o `/finance/settlements/*` → canónico.
 */
export function resolveLegacySettlementsPath(
  pathname: string,
  search: string,
): string {
  const agreementsRedirect = resolveSettlementsListRedirect(search);

  if (agreementsRedirect) {
    return agreementsRedirect;
  }

  const normalized = pathname.replace(/\/+$/, "") || "/";
  const searchSuffix = search.startsWith("?") ? search : search ? `?${search}` : "";

  if (
    normalized === LEGACY_LIST_PATH ||
    normalized === LEGACY_FINANCE_SETTLEMENTS_PATH
  ) {
    return searchSuffix
      ? `${SETTLEMENTS_LIST_PATH}${searchSuffix}`
      : SETTLEMENTS_LIST_PATH;
  }

  if (
    normalized === LEGACY_CREATE_PATH ||
    normalized === LEGACY_FINANCE_SETTLEMENTS_CREATE_PATH
  ) {
    return appendSearch(SETTLEMENTS_CREATE_PATH, searchSuffix);
  }

  if (normalized === LEGACY_FINANCE_SETTLEMENTS_ADVANCES_PATH) {
    return appendSearch(SETTLEMENTS_ADVANCES_PATH, searchSuffix);
  }

  if (normalized === LEGACY_FINANCE_SETTLEMENTS_REGISTRY_PATH) {
    return settlementsRegistryPath();
  }

  if (normalized === LEGACY_FINANCE_SETTLEMENTS_PENDING_APPROVAL_PATH) {
    const params = new URLSearchParams(
      searchSuffix.startsWith("?") ? searchSuffix.slice(1) : searchSuffix,
    );
    const employeeId =
      params.get("employeeId") ?? params.get("driverId") ?? undefined;
    return settlementsPendingApprovalPath(
      employeeId ? { employeeId } : undefined,
    );
  }

  const financePrefix = `${LEGACY_FINANCE_SETTLEMENTS_PATH}/`;
  if (normalized.startsWith(financePrefix)) {
    const id = normalized.slice(financePrefix.length);
    if (id && !id.includes("/")) {
      const target = settlementDetailPath(id);
      return appendSearch(target, searchSuffix);
    }
  }

  if (normalized.startsWith(`${LEGACY_LIST_PATH}/`)) {
    const id = normalized.slice(`${LEGACY_LIST_PATH}/`.length);

    if (id) {
      const target = settlementDetailPath(id);

      return appendSearch(target, searchSuffix);
    }
  }

  return appendSearch(SETTLEMENTS_LIST_PATH, searchSuffix);
}

export type OperatorPaymentsHubTab =
  | "por-pagar"
  | "adelantos"
  | "como-te-pago"
  | "tabla-de-rutas";

/** @deprecated Hub retirado (F2); Historial = bucket Pagados. */
export function isOperatorPaymentsRegistryPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return (
    normalized === LEGACY_FINANCE_SETTLEMENTS_REGISTRY_PATH ||
    normalized.startsWith(`${LEGACY_FINANCE_SETTLEMENTS_REGISTRY_PATH}/`)
  );
}

/** @deprecated Hub con tabs retirado en F2 — solo para tests/compat. */
export function resolveOperatorPaymentsHubTab(
  pathname: string,
): OperatorPaymentsHubTab {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (normalized === LEGACY_FINANCE_SETTLEMENTS_PENDING_APPROVAL_PATH) {
    return "por-pagar";
  }
  if (isOperatorPaymentsRegistryPath(normalized)) return "por-pagar";
  if (
    normalized === SETTLEMENTS_ADVANCES_PATH ||
    normalized.startsWith(`${SETTLEMENTS_ADVANCES_PATH}/`) ||
    normalized === LEGACY_FINANCE_SETTLEMENTS_ADVANCES_PATH
  ) {
    return "adelantos";
  }
  if (
    pathname.includes("tab=routes") ||
    normalized.includes("/tariffs/routes")
  ) {
    return "tabla-de-rutas";
  }
  if (
    normalized === COMPENSATION_TEMPLATES_PATH ||
    normalized.startsWith(`${COMPENSATION_TEMPLATES_PATH}/`) ||
    normalized === COMPENSATION_HUB_PATH ||
    normalized.startsWith(`${COMPENSATION_HUB_PATH}/`) ||
    normalized === LEGACY_AGREEMENTS_PATH
  ) {
    return "como-te-pago";
  }
  return "por-pagar";
}
