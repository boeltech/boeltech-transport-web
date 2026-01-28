/**
 * ThemeProvider
 *
 * Provider que gestiona el tema (dark/light mode) de la aplicación.
 * Persiste la preferencia en localStorage y escucha cambios del sistema.
 *
 * Ubicación: src/app/providers/ThemeProvider.tsx
 *
 * @example
 * <ThemeProvider defaultMode="system">
 *   <App />
 * </ThemeProvider>
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ThemeMode,
  ResolvedTheme,
  ThemeContextValue,
  ThemeProviderConfig,
} from "@/shared/ui/theme/types";

// ============================================
// Context
// ============================================

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

// ============================================
// Constants
// ============================================

const DEFAULT_STORAGE_KEY = "boeltech-theme";
const DEFAULT_MODE: ThemeMode = "system";

// ============================================
// Helpers
// ============================================

/**
 * Obtiene el tema guardado en localStorage
 */
function getStoredTheme(storageKey: string): ThemeMode | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage no disponible
  }

  return null;
}

/**
 * Guarda el tema en localStorage
 */
function setStoredTheme(storageKey: string, mode: ThemeMode): void {
  try {
    localStorage.setItem(storageKey, mode);
  } catch {
    // localStorage no disponible
  }
}

/**
 * Obtiene la preferencia del sistema
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Resuelve el tema según el modo seleccionado
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Aplica el tema al documento
 */
function applyTheme(
  theme: ResolvedTheme,
  attribute: "class" | "data-theme",
): void {
  const root = window.document.documentElement;

  if (attribute === "class") {
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  } else {
    root.setAttribute("data-theme", theme);
  }
}

// ============================================
// Provider
// ============================================

interface ThemeProviderProps extends ThemeProviderConfig {
  children: ReactNode;
}

export function ThemeProvider({
  children,
  defaultMode = DEFAULT_MODE,
  storageKey = DEFAULT_STORAGE_KEY,
  attribute = "class",
}: ThemeProviderProps) {
  // Estado del modo seleccionado
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return getStoredTheme(storageKey) ?? defaultMode;
  });

  // Estado del tema resuelto
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    return resolveTheme(mode);
  });

  // Efecto para aplicar el tema y escuchar cambios del sistema
  useEffect(() => {
    const updateTheme = () => {
      const resolved = resolveTheme(mode);
      setResolvedTheme(resolved);
      applyTheme(resolved, attribute);
    };

    // Aplicar tema inicial
    updateTheme();

    // Escuchar cambios en preferencia del sistema
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = () => {
      if (mode === "system") {
        updateTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [mode, attribute]);

  // Función para cambiar el modo
  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setStoredTheme(storageKey, newMode);
      setModeState(newMode);
    },
    [storageKey],
  );

  // Función para alternar entre light/dark
  const toggleTheme = useCallback(() => {
    const newMode = resolvedTheme === "dark" ? "light" : "dark";
    setMode(newMode);
  }, [resolvedTheme, setMode]);

  // Valor del contexto memoizado
  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedTheme,
      isDark: resolvedTheme === "dark",
      isLight: resolvedTheme === "light",
      setMode,
      toggleTheme,
    }),
    [mode, resolvedTheme, setMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
