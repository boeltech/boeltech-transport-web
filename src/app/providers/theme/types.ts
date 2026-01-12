// src/app/providers/theme/types.ts

/**
 * Temas disponibles
 */
export type Theme = "light" | "dark";

/**
 * Modos de tema (incluye 'system' para seguir preferencia del SO)
 */
export type ThemeMode = Theme | "system";

/**
 * Estado del contexto de tema
 */
export interface ThemeState {
  /** Tema actualmente aplicado (siempre 'light' o 'dark') */
  theme: Theme;

  /** Modo seleccionado por el usuario (puede ser 'system') */
  mode: ThemeMode;

  /** Si el tema actual es oscuro */
  isDark: boolean;

  /** Si el tema actual es claro */
  isLight: boolean;
}

/**
 * Acciones disponibles en el contexto
 */
export interface ThemeActions {
  /** Establece el modo de tema */
  setMode: (mode: ThemeMode) => void;

  /** Alterna entre light y dark (ignora system) */
  toggleTheme: () => void;

  /** Establece tema light */
  setLight: () => void;

  /** Establece tema dark */
  setDark: () => void;

  /** Establece tema según sistema */
  setSystem: () => void;
}

/**
 * Contexto completo
 */
export interface ThemeContextType extends ThemeState, ThemeActions {}
