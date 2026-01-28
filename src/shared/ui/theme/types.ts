/**
 * Theme Types
 *
 * Tipos compartidos para el sistema de temas.
 * Ubicación: src/shared/ui/theme/types.ts
 */

/**
 * Modo de tema seleccionado por el usuario
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Tema resuelto (el que realmente se aplica)
 */
export type ResolvedTheme = "light" | "dark";

/**
 * Contexto del tema
 */
export interface ThemeContextValue {
  /** Modo seleccionado (light/dark/system) */
  mode: ThemeMode;
  /** Tema resuelto que se está aplicando */
  resolvedTheme: ResolvedTheme;
  /** Si está en modo oscuro */
  isDark: boolean;
  /** Si está en modo claro */
  isLight: boolean;
  /** Cambiar modo */
  setMode: (mode: ThemeMode) => void;
  /** Alternar entre light/dark */
  toggleTheme: () => void;
}

/**
 * Configuración del ThemeProvider
 */
export interface ThemeProviderConfig {
  /** Tema por defecto */
  defaultMode?: ThemeMode;
  /** Key para localStorage */
  storageKey?: string;
  /** Atributo del elemento root (default: 'class') */
  attribute?: "class" | "data-theme";
}
