import type { NavigateFunction } from "react-router-dom";
import type { Crumb } from "@shared/ui/breadcrumbs";
import { resolveInternalAppHref } from "./resolveInternalAppHref";
import { useIncomingFrom, useListQueueFromState } from "./listQueueFrom";

export const BRANCHES_LIST_PATH = "/branches";
export const EMPLOYEES_LIST_PATH = "/employees";

export const MASTER_WAYFINDING_COPY = {
  backToDashboard: "Volver al inicio",
  backToTrip: "Volver al viaje",
  backToBranch: "Volver a la sucursal",
  backToEmployee: "Volver al empleado",
} as const;

/**
 * Mapa listPath → label para migas (Q1 / NL3).
 * Mantener en sync con `widgets/sidebar/copy/navigationCopy.ts` (item.*).
 * Prohibido importar `@widgets/sidebar` desde aquí (FSD).
 */
export const MODULE_LIST_PATH_LABELS: Readonly<Record<string, string>> = {
  "/dashboard": "Inicio",
  "/trips": "Viajes",
  "/monitoring/fleet": "Mapa de flota",
  "/monitoring/alerts": "Alertas",
  "/monitoring/settings": "Configuración",
  "/vehicles": "Vehículos",
  "/trailers": "Remolques",
  "/drivers": "Conductores",
  "/fleet/documents": "Documentos",
  "/clients": "Clientes",
  "/finance/invoiceable": "Por facturar",
  "/finance/invoices": "Facturas",
  "/finance/dispatch": "Envíos",
  "/finance/dispatch/period": "Correo del periodo",
  "/finance/payments": "Facturas a crédito",
  "/finance/operational-cash-pending": "Cobros sin factura",
  "/finance/operator-payments": "Pagos",
  "/finance/operator-payments/advances": "Anticipos",
  "/finance/operator-payments/operators": "Operadores",
  "/finance/operator-payments/tariffs": "Tarifas",
  "/finance": "Cartera",
  "/finance/approvals": "Aprobaciones",
  "/finance/analysis": "Análisis",
  "/reports": "Reportes",
  "/branches": "Sucursales",
  "/employees": "Empleados",
  "/users": "Usuarios",
  "/users/activity": "Historial de usuarios",
  "/settings": "Configuración",
  "/ayuda": "Ayuda",
  "/ayuda/tickets": "Tickets",
};

/**
 * Prefijos de detalle cuyo listado canónico vive en otra path (sidebar).
 * Ej.: detalle `/invoices/:id` → listado `/finance/invoices`.
 */
export const MODULE_DETAIL_PATH_ALIASES: Readonly<Record<string, string>> = {
  "/invoices": "/finance/invoices",
  "/settlements": "/finance/operator-payments",
};

function hrefPath(href: string): string {
  return href.split("?")[0] ?? href;
}

type ModuleNavMatch = {
  listPath: string;
  label: string;
  kind: "list" | "detail";
};

const SORTED_LIST_PATHS = Object.keys(MODULE_LIST_PATH_LABELS).sort(
  (a, b) => b.length - a.length,
);

/** Etiqueta de módulo para `fromLabel` / «Volver a …» a partir de un href interno. */
export function resolveModuleNavLabel(href: string): string | undefined {
  return matchModuleNav(hrefPath(href))?.label;
}

function matchModuleNav(pathname: string): ModuleNavMatch | null {
  for (const [aliasRoot, listPath] of Object.entries(
    MODULE_DETAIL_PATH_ALIASES,
  )) {
    if (pathname === aliasRoot || pathname.startsWith(`${aliasRoot}/`)) {
      const label = MODULE_LIST_PATH_LABELS[listPath];
      if (!label) continue;
      return { listPath, label, kind: "detail" };
    }
  }

  for (const listPath of SORTED_LIST_PATHS) {
    const label = MODULE_LIST_PATH_LABELS[listPath];
    if (!label) continue;
    if (pathname === listPath) {
      return { listPath, label, kind: "list" };
    }
    if (pathname.startsWith(`${listPath}/`)) {
      return { listPath, label, kind: "detail" };
    }
  }

  return null;
}

export type ResolveDetailCrumbsInput = {
  from?: string;
  fromLabel?: string;
  module: { listPath: string; label: string };
  current: { label: string; mono?: boolean };
};

/**
 * Resuelve migas contextuales (máx. 3) a partir de `location.state.from` (+ `fromLabel`).
 * Sin `from` válido cae a la jerarquía del módulo.
 */
export function resolveDetailCrumbs(
  input: ResolveDetailCrumbsInput,
): Crumb[] {
  const current: Crumb = {
    label: input.current.label,
    ...(input.current.mono ? { mono: true } : {}),
  };

  const hierarchy = (): Crumb[] => [
    { label: input.module.label, to: input.module.listPath },
    current,
  ];

  const raw = input.from?.trim();
  if (!raw) return hierarchy();

  const resolved = resolveInternalAppHref(raw, "");
  if (!resolved) return hierarchy();

  const pathname = hrefPath(resolved);
  const match = matchModuleNav(pathname);
  if (!match) return hierarchy();

  if (match.kind === "list") {
    return [{ label: match.label, to: resolved }, current];
  }

  const midLabel = input.fromLabel?.trim();
  // Detail without a useful mid label → 2 crumbs (avoid «Viajes › Viajes › …»).
  if (!midLabel) {
    return [{ label: match.label, to: resolved }, current];
  }

  return [
    { label: match.label, to: match.listPath },
    { label: midLabel, to: resolved },
    current,
  ];
}

export function resolveMasterBackHref(
  from: string | undefined,
  listPath: string,
): string {
  return resolveInternalAppHref(from, listPath);
}

export function resolveMasterBackLabel(
  href: string,
  listPath: string,
  listLabel: string,
): string {
  const path = hrefPath(href);
  if (path === "/dashboard") return MASTER_WAYFINDING_COPY.backToDashboard;
  if (path === "/trips" || path.startsWith("/trips/")) {
    return MASTER_WAYFINDING_COPY.backToTrip;
  }
  if (
    listPath !== BRANCHES_LIST_PATH &&
    (path === BRANCHES_LIST_PATH || path.startsWith(`${BRANCHES_LIST_PATH}/`))
  ) {
    return MASTER_WAYFINDING_COPY.backToBranch;
  }
  if (
    listPath !== EMPLOYEES_LIST_PATH &&
    (path === EMPLOYEES_LIST_PATH ||
      path.startsWith(`${EMPLOYEES_LIST_PATH}/`))
  ) {
    return MASTER_WAYFINDING_COPY.backToEmployee;
  }
  return listLabel;
}

export function useMasterDetailWayfinding(
  listPath: string,
  listLabel: string,
): { backHref: string; backLabel: string; fromState: { from: string } } {
  const incoming = useIncomingFrom();
  const backHref = resolveMasterBackHref(incoming, listPath);
  const backLabel = resolveMasterBackLabel(backHref, listPath, listLabel);
  return { backHref, backLabel, fromState: { from: backHref } };
}

export function navigatePreservingFrom(
  navigate: NavigateFunction,
  href: string,
  from: string | undefined,
): void {
  navigate(href, from ? { state: { from } } : undefined);
}

/**
 * Cola para View/Edit desde listado o detalle.
 * En el listado usa la query actual; en el detalle reenvía `state.from`.
 */
export function useMasterActionFrom(
  listPath: string,
): { from: string } | undefined {
  const listFrom = useListQueueFromState();
  const incoming = useIncomingFrom();
  if (incoming) return { from: incoming };
  const path = listFrom.from.split("?")[0] ?? listFrom.from;
  if (path === listPath) return listFrom;
  return undefined;
}
