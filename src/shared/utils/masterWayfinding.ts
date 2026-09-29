import type { NavigateFunction } from "react-router-dom";
import { resolveInternalAppHref } from "./resolveInternalAppHref";
import { useIncomingFrom, useListQueueFromState } from "./listQueueFrom";

export const MASTER_WAYFINDING_COPY = {
  backToDashboard: "Volver al inicio",
  backToTrip: "Volver al viaje",
  backToBranch: "Volver a la sucursal",
} as const;

function hrefPath(href: string): string {
  return href.split("?")[0] ?? href;
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
    listPath !== "/branches" &&
    (path === "/branches" || path.startsWith("/branches/"))
  ) {
    return MASTER_WAYFINDING_COPY.backToBranch;
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
