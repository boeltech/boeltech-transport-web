/**
 * Destino post-login ERP según rol (Ola 9 — portales).
 * Staff conserva `from` vía resolveInternalAppHref; client/driver usan allowlist.
 */
import {
  isClientPortalRole,
  isDriverPortalRole,
  type UserRole,
} from "@shared/constants/roles";
import { resolveInternalAppHref } from "./resolveInternalAppHref";

export const POST_LOGIN_FALLBACK = "/dashboard";

function pathOnly(href: string): string {
  const noHash = href.split("#")[0] ?? href;
  return noHash.split("?")[0] ?? noHash;
}

function matchesPrefixOrExact(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** Allowlist client portal post-login. */
export function isClientPostLoginPathAllowed(path: string): boolean {
  if (path === "/dashboard") return true;
  if (matchesPrefixOrExact(path, "/trips")) return true;
  if (matchesPrefixOrExact(path, "/finance/invoices")) return true;
  // Detalle factura: /invoices/:id (no /invoices/new ni …/edit)
  const invoiceDetail = /^\/invoices\/([^/]+)$/.exec(path);
  if (invoiceDetail && invoiceDetail[1] !== "new") return true;
  if (matchesPrefixOrExact(path, "/account")) return true;
  if (path === "/notifications") return true;
  if (path === "/onboarding") return true;
  if (matchesPrefixOrExact(path, "/ayuda")) return true;
  return false;
}

/** Allowlist driver portal post-login. */
export function isDriverPostLoginPathAllowed(path: string): boolean {
  if (path === "/dashboard") return true;
  if (matchesPrefixOrExact(path, "/trips")) return true;
  if (matchesPrefixOrExact(path, "/account")) return true;
  if (path === "/notifications") return true;
  if (path === "/onboarding") return true;
  if (matchesPrefixOrExact(path, "/ayuda")) return true;
  return false;
}

/**
 * Resuelve `location.state.from` tras login ERP.
 * - client / driver: allowlist; fuera → /dashboard
 * - staff: resolveInternalAppHref(from, /dashboard)
 */
export function resolvePostLoginHref(
  from: string | undefined,
  role: UserRole | null | undefined,
): string {
  const resolved = resolveInternalAppHref(from, POST_LOGIN_FALLBACK);
  const path = pathOnly(resolved);

  if (isClientPortalRole(role)) {
    return isClientPostLoginPathAllowed(path) ? resolved : POST_LOGIN_FALLBACK;
  }
  if (isDriverPortalRole(role)) {
    return isDriverPostLoginPathAllowed(path) ? resolved : POST_LOGIN_FALLBACK;
  }

  return resolved;
}
