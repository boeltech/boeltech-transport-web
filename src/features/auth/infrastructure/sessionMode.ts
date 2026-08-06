/**
 * Modo de sesión tenant (AUTH-HARDEN Phase 2 Fase 4).
 * Platform permanece Bearer + localStorage propio.
 *
 * Production builds hard-fail unless VITE_AUTH_SESSION_MODE=cookies
 * (or unset, which defaults to cookies).
 */

import { assertProductionAuthSessionMode } from "./assertProductionAuthSessionMode";
import type { AuthSessionMode } from "./sessionModeTypes";

export type { AuthSessionMode } from "./sessionModeTypes";
export { assertProductionAuthSessionMode } from "./assertProductionAuthSessionMode";

function parseAuthSessionMode(raw: string | undefined): AuthSessionMode {
  const value = (raw ?? "cookies").trim().toLowerCase();
  if (value === "bearer" || value === "dual" || value === "cookies") {
    return value;
  }
  return "cookies";
}

export const authSessionMode: AuthSessionMode = parseAuthSessionMode(
  import.meta.env.VITE_AUTH_SESSION_MODE as string | undefined,
);

assertProductionAuthSessionMode(
  authSessionMode,
  Boolean(import.meta.env.PROD),
);

/** Enviar cookies en peticiones tenant (dual | cookies). */
export function usesAuthCookies(): boolean {
  return authSessionMode === "dual" || authSessionMode === "cookies";
}

/** Persistir access/refresh tenant en localStorage (bearer | dual). */
export function persistsAuthTokens(): boolean {
  return authSessionMode === "bearer" || authSessionMode === "dual";
}

/** Adjuntar Authorization Bearer desde storage (bearer | dual). */
export function sendsBearerFromStorage(): boolean {
  return authSessionMode === "bearer" || authSessionMode === "dual";
}
