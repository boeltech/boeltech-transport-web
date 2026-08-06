import type { AuthSessionMode } from "./sessionModeTypes";

/** Throws in production builds when session mode is not cookies. */
export function assertProductionAuthSessionMode(
  mode: AuthSessionMode,
  isProd: boolean,
): void {
  if (!isProd) return;
  if (mode !== "cookies") {
    throw new Error(
      `VITE_AUTH_SESSION_MODE="${mode}" is not allowed in production. Use VITE_AUTH_SESSION_MODE=cookies.`,
    );
  }
}
