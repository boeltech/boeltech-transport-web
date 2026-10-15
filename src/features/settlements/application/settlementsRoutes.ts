import {
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_HUB_PATH,
  COMPENSATION_TEMPLATES_PATH,
  LEGACY_AGREEMENTS_PATH,
  resolveLegacyAgreementsPath,
} from "@features/compensation/application";

/**
 * Rutas UI de liquidaciones bajo /finance/settlements/*.
 * Redirects legacy /settlements/* → rutas canónicas.
 * ADR-0090: workbench en list path; registry y advances en rutas propias.
 */

export const SETTLEMENTS_LIST_PATH = "/finance/settlements";

export const SETTLEMENTS_CREATE_PATH = "/finance/settlements/new";

export const SETTLEMENTS_REGISTRY_PATH = "/finance/settlements/registry";

export const SETTLEMENTS_ADVANCES_PATH = "/finance/settlements/advances";

export const SETTLEMENTS_PENDING_APPROVAL_PATH =
  "/finance/settlements/pending-approval";

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
  if (!params || Object.keys(params).length === 0) {
    return SETTLEMENTS_REGISTRY_PATH;
  }

  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }

  const search = qs.toString();

  return search
    ? `${SETTLEMENTS_REGISTRY_PATH}?${search}`
    : SETTLEMENTS_REGISTRY_PATH;
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
 * - ?tab=agreements → hub compensación
 * - ?view=registry → /finance/settlements/registry
 * - ?tab=advances → /finance/settlements/advances
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

    const qs = params.toString();

    return qs
      ? `${SETTLEMENTS_REGISTRY_PATH}?${qs}`
      : SETTLEMENTS_REGISTRY_PATH;
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

/** Resuelve pathname legacy /settlements/* → ruta canónica (preserva search). */
export function resolveLegacySettlementsPath(
  pathname: string,
  search: string,
): string {
  const agreementsRedirect = resolveSettlementsListRedirect(search);

  if (agreementsRedirect) {
    return agreementsRedirect;
  }

  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (normalized === LEGACY_LIST_PATH) {
    return search ? `${SETTLEMENTS_LIST_PATH}${search}` : SETTLEMENTS_LIST_PATH;
  }

  if (normalized === LEGACY_CREATE_PATH) {
    return search
      ? `${SETTLEMENTS_CREATE_PATH}${search}`
      : SETTLEMENTS_CREATE_PATH;
  }

  if (normalized.startsWith(`${LEGACY_LIST_PATH}/`)) {
    const id = normalized.slice(`${LEGACY_LIST_PATH}/`.length);

    if (id) {
      const target = settlementDetailPath(id);

      return search ? `${target}${search}` : target;
    }
  }

  return search ? `${SETTLEMENTS_LIST_PATH}${search}` : SETTLEMENTS_LIST_PATH;
}

export type OperatorPaymentsHubTab =
  | "por-pagar"
  | "adelantos"
  | "como-te-pago"
  | "tabla-de-rutas";

/** Historial bajo el hub (sin tab propio; resalta Por pagar). */
export function isOperatorPaymentsRegistryPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return (
    normalized === SETTLEMENTS_REGISTRY_PATH ||
    normalized.startsWith(`${SETTLEMENTS_REGISTRY_PATH}/`)
  );
}

export function resolveOperatorPaymentsHubTab(
  pathname: string,
): OperatorPaymentsHubTab {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Ruta legacy del tab eliminado: el redirect del router aterriza en Por pagar.
  if (normalized === SETTLEMENTS_PENDING_APPROVAL_PATH) return "por-pagar";
  if (isOperatorPaymentsRegistryPath(normalized)) return "por-pagar";
  if (
    normalized === SETTLEMENTS_ADVANCES_PATH ||
    normalized.startsWith(`${SETTLEMENTS_ADVANCES_PATH}/`)
  ) {
    return "adelantos";
  }
  if (
    normalized === COMPENSATION_CORRIDORS_PATH ||
    normalized.startsWith(`${COMPENSATION_CORRIDORS_PATH}/`)
  ) {
    return "tabla-de-rutas";
  }
  if (
    normalized === COMPENSATION_HUB_PATH ||
    normalized.startsWith(`${COMPENSATION_HUB_PATH}/`) ||
    normalized === LEGACY_AGREEMENTS_PATH
  ) {
    return "como-te-pago";
  }
  return "por-pagar";
}
