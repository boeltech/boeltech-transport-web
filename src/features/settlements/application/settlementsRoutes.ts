import {

  COMPENSATION_CORRIDORS_PATH,

  COMPENSATION_HUB_PATH,

  COMPENSATION_TEMPLATES_PATH,

  resolveLegacyAgreementsPath,

} from "@features/compensation/application/compensationRoutes";



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

/** Legacy path — redirige a hub compensación ADR-0089. */

export const SETTLEMENTS_AGREEMENTS_PATH = "/finance/agreements";



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

}): string {

  if (!params?.employeeId) {

    return COMPENSATION_TEMPLATES_PATH;

  }

  const qs = new URLSearchParams({ employeeId: params.employeeId });

  return `${COMPENSATION_TEMPLATES_PATH}?${qs.toString()}`;

}



/** @deprecated Usar settlementsAgreementsPath — conservado para enlaces existentes. */

export function settlementsAgreementsTabPath(params?: {

  employeeId?: string;

}): string {

  return settlementsAgreementsPath(params);

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



/** @deprecated Preferir settlementsAdvancesPath — alias de compatibilidad. */

export function settlementsAdvancesTabPath(): string {

  return SETTLEMENTS_ADVANCES_PATH;

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

    return search ? `${SETTLEMENTS_CREATE_PATH}${search}` : SETTLEMENTS_CREATE_PATH;

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
  | "por-autorizar"
  | "adelantos"
  | "como-te-pago"
  | "tabla-de-rutas";

export function resolveOperatorPaymentsHubTab(
  pathname: string,
): OperatorPaymentsHubTab {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (normalized === SETTLEMENTS_PENDING_APPROVAL_PATH) return "por-autorizar";
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
    normalized.startsWith(`${COMPENSATION_HUB_PATH}/`)
  ) {
    return "como-te-pago";
  }
  return "por-pagar";
}


