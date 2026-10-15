import { useIncomingFrom } from "./listQueueFrom";
import { resolveInternalAppHref } from "./resolveInternalAppHref";

export const REPORTS_HUB_PATH = "/reports";

/** Inicio (dashboard). Path canónico compartido con catálogo Reportes. */
export const DASHBOARD_PATH = "/dashboard";

export const REPORTS_WAYFINDING_COPY = {
  backToReports: "Volver a reportes",
} as const;

export function isReportsHubHref(href: string): boolean {
  const path = href.split("?")[0] ?? href;
  return path === REPORTS_HUB_PATH;
}

/**
 * Allowlist: solo hrefs internos que apuntan al hub Reportes.
 * Pasa por `resolveInternalAppHref` antes de aceptar.
 */
export function resolveReportsReturnHref(
  from: string | undefined,
): string | undefined {
  const resolved = resolveInternalAppHref(from, "");
  if (!resolved || !isReportsHubHref(resolved)) return undefined;
  return resolved;
}

export function useReportsReturnHref(): string | undefined {
  return resolveReportsReturnHref(useIncomingFrom());
}

/**
 * `state.from` al salir del dashboard: reenvía /reports si se llegó desde el
 * catálogo; en caso contrario usa Inicio (`DASHBOARD_PATH`).
 */
export function resolveDashboardOutgoingFrom(
  incomingFrom?: string,
): string {
  return resolveReportsReturnHref(incomingFrom) ?? DASHBOARD_PATH;
}
