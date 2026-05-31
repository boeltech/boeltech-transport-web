/**
 * Status Configuration - Barrel Export
 * Clean Architecture - Shared Layer (Config)
 *
 * Exporta tipos, utilidades y presets del sistema de status.
 *
 * Ubicación: src/shared/config/status/index.ts
 */

// Types
export type {
  StatusConfig,
  StatusTone,
  CanonicalColorVariant,
  LegacyColorVariant,
  ColorVariant,
} from "./types";

// Color presets + utilities
export {
  STATUS_COLORS_SOFT,
  STATUS_COLORS_SOLID,
  createStatusConfig,
} from "./types";
