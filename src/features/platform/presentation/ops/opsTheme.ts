/**
 * Tema Ops aislado del ERP ThemeCycle (LID-D2/D3 · TEC §C).
 * Nunca muta `html.dark` ni importa `@shared/ui/theme`.
 */

export type OpsThemeMode = "system" | "light" | "dark";
export type OpsResolvedTheme = "light" | "dark";

export const OPS_THEME_STORAGE_KEY = "boeltech-ops-theme";
export const OPS_THEME_DEFAULT_MODE: OpsThemeMode = "system";

export function parseOpsThemeMode(raw: string | null): OpsThemeMode | null {
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }
  return null;
}

export function resolveOpsTheme(
  mode: OpsThemeMode,
  prefersDark: boolean,
): OpsResolvedTheme {
  if (mode === "system") {
    return prefersDark ? "dark" : "light";
  }
  return mode;
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readStoredOpsThemeMode(
  storageKey: string = OPS_THEME_STORAGE_KEY,
): OpsThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    return parseOpsThemeMode(localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

export function writeStoredOpsThemeMode(
  mode: OpsThemeMode,
  storageKey: string = OPS_THEME_STORAGE_KEY,
): void {
  try {
    localStorage.setItem(storageKey, mode);
  } catch {
    // localStorage no disponible
  }
}

export function getInitialOpsThemeMode(): OpsThemeMode {
  return readStoredOpsThemeMode() ?? OPS_THEME_DEFAULT_MODE;
}

/** Resolución síncrona para anti-flash en primer paint (login/shell). */
export function getInitialOpsResolvedTheme(): OpsResolvedTheme {
  return resolveOpsTheme(getInitialOpsThemeMode(), getSystemPrefersDark());
}
