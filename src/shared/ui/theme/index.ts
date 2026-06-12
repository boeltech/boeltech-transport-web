/**
 * Theme UI Module
 *
 * Exporta componentes UI relacionados con el tema.
 * Ubicación: src/shared/ui/theme/index.ts
 */

// Components
export {
  ThemeToggle,
  ThemeDropdown,
  ThemeSwitch,
  ThemeSegmented,
  ThemeCycleButton,
} from "./ThemeToggle";

// Types
export type {
  ThemeMode,
  ResolvedTheme,
  ThemeContextValue,
  ThemeProviderConfig,
} from "./types";

// Runtime (storage key, theme resolution)
export {
  THEME_DEFAULT_MODE,
  THEME_MODE_CYCLE,
  THEME_STORAGE_KEY,
  applyResolvedThemeToDocument,
  cycleThemeMode,
  parseStoredThemeMode,
  resolveThemeMode,
} from "./themeRuntime";

export { CONTRAST_PAIRS } from "./contrastPairs";
export type { ContrastPair } from "./contrastPairs";
export {
  auditContrastPairs,
  computeContrastRatio,
  parseCssTokenBlocks,
} from "./contrastCompute";
