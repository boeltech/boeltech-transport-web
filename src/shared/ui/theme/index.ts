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
export { PaletteSegmented } from "./PaletteSwitch";

// Types
export type {
  ThemeMode,
  ResolvedTheme,
  ThemeContextValue,
  ThemeProviderConfig,
  ColorPaletteId,
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

export {
  COLOR_PALETTE_ATTR,
  COLOR_PALETTE_CYCLE,
  COLOR_PALETTE_DEFAULT,
  COLOR_PALETTE_META,
  COLOR_PALETTE_STORAGE_KEY,
  applyColorPaletteToDocument,
  cycleColorPalette,
  parseStoredColorPalette,
} from "./paletteRuntime";

export { CONTRAST_PAIRS, CONTRAST_PAIRS_V2_EXTRA } from "./contrastPairs";
export type { ContrastPair } from "./contrastPairs";
export {
  auditContrastPairs,
  computeContrastRatio,
  parseCssTokenBlocks,
} from "./contrastCompute";