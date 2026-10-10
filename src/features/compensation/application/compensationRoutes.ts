/**
 * Rutas UI de esquemas de compensación (ADR-0089 / ADR-0091).
 */

import { BATCH_ASSIGNMENT_MAX_EMPLOYEES } from "../domain/enums";

export const COMPENSATION_HUB_PATH = "/finance/compensation";
export const COMPENSATION_TEMPLATES_PATH = "/finance/compensation/templates";
export const COMPENSATION_CORRIDORS_PATH = "/finance/compensation/corridors";

/** Query flag: abre Sheet de alta de ruta con tarifa fija en el tab de rutas con tarifa fija. */
export const COMPENSATION_CORRIDORS_CREATE_QUERY = "create";
export const COMPENSATION_CORRIDORS_CREATE_VALUE = "1";

/** Legacy agreements → hub plantillas. */
export const LEGACY_AGREEMENTS_PATH = "/finance/agreements";

/** Deep link: tab Rutas con tarifa fija con Sheet de alta abierto. */
export function compensationCorridorsCreatePath(): string {
  return `${COMPENSATION_CORRIDORS_PATH}?${COMPENSATION_CORRIDORS_CREATE_QUERY}=${COMPENSATION_CORRIDORS_CREATE_VALUE}`;
}

export function isCompensationCorridorsCreateQuery(
  value: string | null | undefined,
): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === COMPENSATION_CORRIDORS_CREATE_VALUE || normalized === "true";
}

function buildTemplatesListSearch(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${COMPENSATION_TEMPLATES_PATH}?${query}` : COMPENSATION_TEMPLATES_PATH;
}

/** Deep link: abre Sheet de operadores del esquema. */
export function compensationTemplateOperatorsPath(templateId: string): string {
  return buildTemplatesListSearch({ operators: templateId });
}

/** Parámetros de URL del listado de tarifas: sheet de operadores, lote y enlace (api#63 C13). */
export const TEMPLATE_OPERATORS_PARAMS = {
  /** Plantilla del sheet de operadores abierto. */
  operators: "operators",
  /** Operadores del lote, separados por comas. Abre el lote. */
  assign: "assign",
  /** «Vigente desde» inicial del lote. */
  assignFrom: "assignFrom",
  /** Asignación a resaltar. */
  focus: "focus",
  /** Plantilla a la que vuelve el aviso del sheet destino. */
  returnTo: "returnTo",
  returnAssign: "returnAssign",
  returnFrom: "returnFrom",
  /** Contexto de Por pagar; se conserva al ir y volver. */
  employeeId: "employeeId",
  periodStart: "periodStart",
  periodEnd: "periodEnd",
} as const;

const PARAM = TEMPLATE_OPERATORS_PARAMS;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Deep link: Sheet de operadores con operador(es) preseleccionado(s) para asignar. */
export function compensationTemplateAssignPath(
  templateId: string,
  employeeIds: string | readonly string[],
  options: { effectiveFrom?: string } = {},
): string {
  const ids =
    typeof employeeIds === "string" ? parseAssignEmployeeIds(employeeIds) : employeeIds;
  return buildTemplatesListSearch({
    [PARAM.operators]: templateId,
    [PARAM.assign]: formatAssignEmployeeIds(ids) || undefined,
    [PARAM.assignFrom]: options.effectiveFrom,
  });
}

/** Lista separada por comas → ids sin vacíos ni duplicados, en orden, tope 100. */
export function parseAssignEmployeeIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return formatIds(raw.split(","));
}

export function formatAssignEmployeeIds(ids: readonly string[]): string {
  return formatIds(ids).join(",");
}

function formatIds(ids: readonly string[]): string[] {
  const unique = new Set<string>();
  for (const id of ids) {
    const trimmed = id.trim();
    if (trimmed) unique.add(trimmed);
    if (unique.size === BATCH_ASSIGNMENT_MAX_EMPLOYEES) break;
  }
  return [...unique];
}

/** «Vigente desde» inicial del lote: `assignFrom` > `periodStart` > hoy. */
export function resolveBatchInitialEffectiveFrom(input: {
  assignFrom?: string | null;
  periodStart?: string | null;
  today: string;
}): string {
  const assignFrom = input.assignFrom?.trim();
  if (assignFrom && ISO_DATE.test(assignFrom)) return assignFrom;
  const periodStart = input.periodStart?.trim();
  if (periodStart && ISO_DATE.test(periodStart)) return periodStart;
  return input.today;
}

function deleteParams(params: URLSearchParams, keys: readonly string[]): void {
  for (const key of keys) params.delete(key);
}

function setOrDelete(params: URLSearchParams, key: string, value: string | null | undefined) {
  if (value) params.set(key, value);
  else params.delete(key);
}

const RETURN_PARAMS = [PARAM.returnTo, PARAM.returnAssign, PARAM.returnFrom] as const;
const OPERATORS_SHEET_PARAMS = [
  PARAM.operators,
  PARAM.assign,
  PARAM.assignFrom,
  PARAM.focus,
  ...RETURN_PARAMS,
] as const;

/**
 * Ir a la asignación que bloquea (C2): cambia el sheet por el de su plantilla, la resalta
 * y guarda cómo volver al lote. Conserva el contexto de Por pagar.
 */
export function withBlockingAssignmentFocus(
  prev: URLSearchParams,
  input: {
    targetTemplateId: string;
    assignmentId: string;
    returnTemplateId: string;
    returnEmployeeIds: readonly string[];
    returnEffectiveFrom?: string | null;
  },
): URLSearchParams {
  const next = new URLSearchParams(prev);
  deleteParams(next, [PARAM.assign, PARAM.assignFrom]);
  next.set(PARAM.operators, input.targetTemplateId);
  next.set(PARAM.focus, input.assignmentId);
  next.set(PARAM.returnTo, input.returnTemplateId);
  setOrDelete(next, PARAM.returnAssign, formatAssignEmployeeIds(input.returnEmployeeIds));
  setOrDelete(next, PARAM.returnFrom, input.returnEffectiveFrom);
  return next;
}

/** «Volver a …»: reabre la plantilla de origen con el lote, sus operadores y su fecha. */
export function withReturnToBatch(prev: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(prev);
  const returnTo = prev.get(PARAM.returnTo)?.trim();
  if (returnTo) {
    const returnIds = parseAssignEmployeeIds(prev.get(PARAM.returnAssign));
    next.set(PARAM.operators, returnTo);
    setOrDelete(next, PARAM.assign, formatAssignEmployeeIds(returnIds));
    setOrDelete(next, PARAM.assignFrom, prev.get(PARAM.returnFrom)?.trim());
  }
  deleteParams(next, [PARAM.focus, ...RETURN_PARAMS]);
  return next;
}

/** D5 «Ver su asignación»: misma plantilla, cierra el lote y resalta la fila; sin regreso. */
export function withSameTemplateFocus(
  prev: URLSearchParams,
  assignmentId: string,
): URLSearchParams {
  const next = new URLSearchParams(prev);
  deleteParams(next, [PARAM.assign, PARAM.assignFrom, ...RETURN_PARAMS]);
  next.set(PARAM.focus, assignmentId);
  return next;
}

/** «Listo» en el aviso del sheet destino: quita foco y regreso; el sheet sigue abierto. */
export function withFocusDismissed(prev: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(prev);
  deleteParams(next, [PARAM.focus, ...RETURN_PARAMS]);
  return next;
}

/** Cerrar el sheet de operadores: quita lote, foco y regreso; conserva Por pagar. */
export function withOperatorsClosed(prev: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(prev);
  deleteParams(next, OPERATORS_SHEET_PARAMS);
  return next;
}

/** Lote completo con éxito: además quita el contexto de Por pagar. */
export function withBatchCompleted(prev: URLSearchParams): URLSearchParams {
  const next = withOperatorsClosed(prev);
  deleteParams(next, [PARAM.employeeId, PARAM.periodStart, PARAM.periodEnd]);
  return next;
}

/** Alias: deep link al Sheet de operadores (compatibilidad con callers existentes). */
export function compensationTemplateDetailPath(id: string): string {
  return compensationTemplateOperatorsPath(id);
}

/** Builder de esquema (ADR-0091) — ruta propia full-screen. */
export function compensationTemplateBuildPath(templateId: string): string {
  return `${COMPENSATION_TEMPLATES_PATH}/${templateId}/build`;
}

export function resolveLegacyAgreementsPath(search: string): string {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  if (!normalized) return COMPENSATION_TEMPLATES_PATH;

  const params = new URLSearchParams(normalized);
  const employeeId = params.get("employeeId");
  if (employeeId) {
    return `${COMPENSATION_TEMPLATES_PATH}?employeeId=${encodeURIComponent(employeeId)}`;
  }

  return COMPENSATION_TEMPLATES_PATH;
}

export function isCompensationHubPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "");
  return (
    normalized === COMPENSATION_HUB_PATH ||
    normalized.startsWith(`${COMPENSATION_HUB_PATH}/`)
  );
}

export function resolveCompensationHubTab(pathname: string): "templates" | "corridors" {
  const normalized = pathname.replace(/\/+$/, "");
  if (normalized.startsWith(COMPENSATION_CORRIDORS_PATH)) return "corridors";
  return "templates";
}

/** Ruta legacy `/templates/:id` — redirige al listado con query. */
export function isCompensationTemplateDetailPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "");
  const prefix = `${COMPENSATION_TEMPLATES_PATH}/`;
  if (!normalized.startsWith(prefix)) return false;

  const remainder = normalized.slice(prefix.length);
  return remainder.length > 0 && !remainder.includes("/");
}

/**
 * Destino de redirect desde `/templates/:id` (+ search legacy).
 * - `configure=true` → Builder
 * - `assign` / `assignEmployee` → Sheet operadores con assign
 * - default → Sheet operadores
 */
export function resolveCompensationTemplateDetailRedirect(
  templateId: string,
  search: string,
): string {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  const params = normalized ? new URLSearchParams(normalized) : new URLSearchParams();

  if (params.get("configure") === "true") {
    return compensationTemplateBuildPath(templateId);
  }

  const assignEmployee =
    params.get("assign")?.trim() || params.get("assignEmployee")?.trim();
  if (assignEmployee) {
    return compensationTemplateAssignPath(templateId, assignEmployee);
  }

  return compensationTemplateOperatorsPath(templateId);
}
