import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  Theme,
  ThemeContextType,
  ThemeMode,
} from "@app/providers/theme/types";

// ============================================
// Constantes
// ============================================
const STORAGE_KEY = "erp-theme-mode";
const DEFAULT_MODE: ThemeMode = "system";

// ============================================
// Contexto
// ============================================
const ThemeContext = createContext<ThemeContextType | null>(null);

// ============================================
// Utilidades
// ============================================

/**
 * Obtiene la preferencia del sistema operativo
 */
const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/**
 * Obtiene el modo guardado en localStorage
 */
const getStoredMode = (): ThemeMode => {
  if (typeof window === "undefined") return DEFAULT_MODE;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return DEFAULT_MODE;
};

/**
 * Resuelve el tema final basado en el modo
 */
const resolveTheme = (mode: ThemeMode): Theme => {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
};

/**
 * Aplica el tema al documento HTML
 */
const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;

  // Remover ambas clases primero
  root.classList.remove("light", "dark");

  // Agregar la clase del tema actual
  root.classList.add(theme);

  // También actualizar el meta tag de color-scheme para UI nativa
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  if (metaColorScheme) {
    metaColorScheme.setAttribute("content", theme);
  }
};

// ============================================
// Provider
// ============================================
interface ThemeProviderProps {
  children: ReactNode;
  /** Modo por defecto si no hay preferencia guardada */
  defaultMode?: ThemeMode;
  /** Key para localStorage */
  storageKey?: string;
}

export const ThemeProvider = ({
  children,
  defaultMode = DEFAULT_MODE,
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) => {
  // Estado del modo (lo que el usuario eligió)
  const [mode, setModeState] = useState<ThemeMode>(() => {
    // En SSR, usar default
    if (typeof window === "undefined") return defaultMode;
    return getStoredMode();
  });

  // Estado del tema resuelto (siempre light o dark)
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(mode));

  // ============================================
  // Aplicar tema cuando cambia
  // ============================================
  useEffect(() => {
    const resolved = resolveTheme(mode);
    setTheme(resolved);
    applyTheme(resolved);
  }, [mode]);

  // ============================================
  // Escuchar cambios en preferencia del sistema
  // ============================================
  useEffect(() => {
    // Solo escuchar si el modo es 'system'
    if (mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      setTheme(newTheme);
      applyTheme(newTheme);
    };

    // Agregar listener
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [mode]);

  // ============================================
  // Acciones
  // ============================================

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      localStorage.setItem(storageKey, newMode);
    },
    [storageKey]
  );

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setMode(newTheme);
  }, [theme, setMode]);

  const setLight = useCallback(() => setMode("light"), [setMode]);
  const setDark = useCallback(() => setMode("dark"), [setMode]);
  const setSystem = useCallback(() => setMode("system"), [setMode]);

  // ============================================
  // Valor del contexto
  // ============================================
  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      mode,
      isDark: theme === "dark",
      isLight: theme === "light",
      setMode,
      toggleTheme,
      setLight,
      setDark,
      setSystem,
    }),
    [theme, mode, setMode, toggleTheme, setLight, setDark, setSystem]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// ============================================
// Hook para consumir el contexto
// ============================================
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
