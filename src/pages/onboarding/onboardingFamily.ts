/**
 * Familia y aterrizaje del asistente de primer acceso (D2, D5–D7).
 * Puro: sin React, sin API.
 */
import type { UserRole } from "@shared/constants/roles";

export type OnboardingFamily = "founder" | "staff" | "portal";

const HOUSE_PATH_BY_ROLE: Record<UserRole, string> = {
  admin: "/settings/billing",
  manager: "/trips",
  dispatcher: "/trips",
  operator: "/trips",
  accountant: "/finance/invoiceable",
  driver: "/trips",
  client: "/trips",
};

const USELESS_FROM_PATHS = new Set(["/onboarding", "/login", "/dashboard"]);

export type ResolveOnboardingFamilyInput = {
  role: string | null | undefined;
  /** Conservado: el funnel solo ramifica copy del paso 3 (plan A/B), no la familia ni el landing. */
  hasFunnelPreference: boolean;
  canReadBilling: boolean;
};

/**
 * F1 = admin + billing.read.
 * El alta real es Platform → correo de activación → login (ADR-0073),
 * no el embudo `/register`. Defensa D5: sin billing.read = staff.
 * Portal (driver/client) nunca es founder.
 */
export function resolveOnboardingFamily({
  role,
  canReadBilling,
}: ResolveOnboardingFamilyInput): OnboardingFamily {
  if (role === "driver" || role === "client") {
    return "portal";
  }

  if (role === "admin" && canReadBilling) {
    return "founder";
  }

  return "staff";
}

export function isUsefulOnboardingFromPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname || !pathname.startsWith("/")) return false;
  return !USELESS_FROM_PATHS.has(pathname);
}

export type ResolveOnboardingLandingInput = {
  role: string | null | undefined;
  fromPathname?: string | null;
  fromSearch?: string | null;
  family?: OnboardingFamily;
};

/**
 * Deep-link útil (gate: `{ from: location }`) gana sobre la casa D6.
 * Path útil ≠ `/onboarding`, `/login`, `/dashboard`. Incluye search si hay.
 * Admin (founder o staff) sin from útil → Datos para facturar.
 */
export function resolveOnboardingLanding({
  role,
  fromPathname,
  fromSearch,
  family,
}: ResolveOnboardingLandingInput): string {
  if (isUsefulOnboardingFromPath(fromPathname)) {
    const search =
      fromSearch && fromSearch !== "?" ? fromSearch : "";
    return `${fromPathname}${search}`;
  }

  if (family === "founder") {
    return "/settings/billing";
  }

  if (role && Object.prototype.hasOwnProperty.call(HOUSE_PATH_BY_ROLE, role)) {
    return HOUSE_PATH_BY_ROLE[role as UserRole];
  }

  return "/trips";
}

/** Extrae `from` del state que manda `ProductOnboardingGate`. */
export function readOnboardingFromState(state: unknown): {
  fromPathname?: string;
  fromSearch?: string;
} {
  if (!state || typeof state !== "object") return {};
  const from = (state as { from?: unknown }).from;
  if (!from || typeof from !== "object") return {};
  const loc = from as { pathname?: unknown; search?: unknown };
  return {
    fromPathname: typeof loc.pathname === "string" ? loc.pathname : undefined,
    fromSearch: typeof loc.search === "string" ? loc.search : undefined,
  };
}
