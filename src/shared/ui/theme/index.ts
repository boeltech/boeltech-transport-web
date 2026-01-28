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
} from "./ThemeToggle";

// Types
export type {
  ThemeMode,
  ResolvedTheme,
  ThemeContextValue,
  ThemeProviderConfig,
} from "./types";
