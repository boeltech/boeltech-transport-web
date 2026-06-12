import type { ResolvedTheme, ThemeMode } from "./types";

export const THEME_STORAGE_KEY = "boeltech-theme";
export const THEME_DEFAULT_MODE: ThemeMode = "system";

export function parseStoredThemeMode(raw: string | null): ThemeMode | null {
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }
  return null;
}

export function resolveThemeMode(
  mode: ThemeMode,
  prefersDark: boolean,
): ResolvedTheme {
  if (mode === "system") {
    return prefersDark ? "dark" : "light";
  }
  return mode;
}

export function readStoredThemeMode(
  storageKey: string = THEME_STORAGE_KEY,
): ThemeMode | null {
  if (typeof window === "undefined") return null;

  try {
    return parseStoredThemeMode(localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

export function writeStoredThemeMode(
  mode: ThemeMode,
  storageKey: string = THEME_STORAGE_KEY,
): void {
  try {
    localStorage.setItem(storageKey, mode);
  } catch {
    // localStorage no disponible
  }
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveThemeFromMode(mode: ThemeMode): ResolvedTheme {
  return resolveThemeMode(mode, getSystemPrefersDark());
}

export const THEME_MODE_CYCLE: ThemeMode[] = ["system", "light", "dark"];

export function cycleThemeMode(current: ThemeMode): ThemeMode {
  const index = THEME_MODE_CYCLE.indexOf(current);
  if (index === -1) {
    return THEME_MODE_CYCLE[0];
  }
  return THEME_MODE_CYCLE[(index + 1) % THEME_MODE_CYCLE.length];
}

export function applyResolvedThemeToDocument(
  theme: ResolvedTheme,
  attribute: "class" | "data-theme" = "class",
): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (attribute === "class") {
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  } else {
    root.setAttribute("data-theme", theme);
  }
}
