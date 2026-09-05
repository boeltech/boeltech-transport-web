/**
 * Rutas UI de esquemas de compensación (ADR-0089 / ADR-0091).
 */

export const COMPENSATION_HUB_PATH = "/finance/compensation";
export const COMPENSATION_TEMPLATES_PATH = "/finance/compensation/templates";
export const COMPENSATION_CORRIDORS_PATH = "/finance/compensation/corridors";

/** Legacy agreements → hub plantillas. */
export const LEGACY_AGREEMENTS_PATH = "/finance/agreements";

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

/** Deep link: Sheet de operadores con operador preseleccionado para asignar. */
export function compensationTemplateAssignPath(
  templateId: string,
  employeeId: string,
): string {
  return buildTemplatesListSearch({
    operators: templateId,
    assign: employeeId,
  });
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
