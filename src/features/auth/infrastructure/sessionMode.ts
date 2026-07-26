/**
 * Modo de sesión tenant (AUTH-HARDEN Phase 2 Fase 4).
 * Platform permanece Bearer + localStorage propio.
 */

export type AuthSessionMode = "bearer" | "dual" | "cookies";

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
