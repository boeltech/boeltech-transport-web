/**
 * Theme Types
 *
 * Tipos compartidos para el sistema de temas.
 * Ubicación: src/shared/ui/theme/types.ts
 */

import type { ColorPaletteId } from "./paletteRuntime";

/**
 * Modo de tema seleccionado por el usuario
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Tema resuelto (el que realmente se aplica)
 */
export type ResolvedTheme = "light" | "dark";

export type { ColorPaletteId };

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
  /** Ciclar system → light → dark → system */
  cycleMode: () => void;
  /**
   * Paleta de color del DS (independiente de light/dark).
   * Default `v1` (azul-tinta). `v2` = Patio ink+ámbar.
   */
  colorPalette: ColorPaletteId;
  /** Cambiar paleta de color */
  setColorPalette: (palette: ColorPaletteId) => void;
  /** Alternar v1 ↔ v2 */
  cycleColorPalette: () => void;
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
  /** Paleta de color por defecto */
  defaultColorPalette?: ColorPaletteId;
  /** Key localStorage para la paleta */
  colorPaletteStorageKey?: string;
}
