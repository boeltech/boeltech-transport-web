import { createContext, useContext } from "react";

/** Mount point for Ops Sheet/Dialog portals (inside `.platform-ops`). */
export const OPS_PORTAL_ROOT_ID = "ops-portal-root";

export const OpsPortalContext = createContext<HTMLElement | null>(null);

export function useOpsPortalContainer(): HTMLElement | undefined {
  const fromCtx = useContext(OpsPortalContext);
  if (fromCtx) return fromCtx;
  if (typeof document === "undefined") return undefined;
  return document.getElementById(OPS_PORTAL_ROOT_ID) ?? undefined;
}

/** Fallback DOM lookup (tests / fuera de host). Prefer `useOpsPortalContainer`. */
export function getOpsPortalContainer(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined;
  return document.getElementById(OPS_PORTAL_ROOT_ID) ?? undefined;
}
