/**
 * Status Configuration Types
 * Clean Architecture - Shared Layer (Types)
 *
 * Tipos base para configuración de estados en todos los módulos.
 * Garantiza consistencia visual y estructural en toda la aplicación.
 *
 * Design System — Fase 2:
 *   - STATUS_COLORS usa tokens semánticos del DS (no colores Tailwind crudos).
 *   - Soporta dos tonos por variante: "soft" (default, recomendado) y "solid"
 *     (alta saturación, para estados que requieren atención inmediata).
 *   - Aliases legacy ("danger", "purple", "orange") mantienen backward
 *     compatibility — internamente se normalizan a las variantes canónicas.
 *
 * Ubicación: src/shared/config/status/types.ts
 */

import type { LucideIcon } from "lucide-react";

// ============================================================================
// BASE STATUS CONFIG TYPE
// ============================================================================

/**
 * Tono visual del badge.
 *
 * - `soft` (default): fondo tenue + texto saturado. Ideal para listas densas,
 *   tablas, chips repetidos. Es el visual histórico del ERP.
 * - `solid`: fondo saturado + texto claro/contrastante. Úsalo para estados
 *   que requieren llamar la atención (ej: viaje EN_RUTA, errores críticos).
 */
export type StatusTone = "soft" | "solid";

/**
 * Configuración base para cualquier estado en el sistema.
 * Todos los módulos deben seguir esta estructura.
 */
export interface StatusConfig {
  /** Etiqueta legible para mostrar al usuario */
  label: string;

  /** Ícono de Lucide para representar el estado */
  icon: LucideIcon;

  /** Color de fondo del badge (clases Tailwind sobre tokens del DS) */
  bgColor: string;

  /** Color del texto del badge */
  textColor: string;

  /** Color del borde del badge */
  borderColor: string;

  /** Descripción detallada del estado (para tooltips o ayuda) */
  description: string;

  /** Tono visual: soft (default) o solid */
  tone?: StatusTone;
}

// ============================================================================
// CANONICAL COLOR VARIANTS — Fase 2
// ============================================================================

/**
 * Variantes canónicas alineadas al DS.
 * Cada una mapea a un token semántico de `index.css`.
 */
export type CanonicalColorVariant =
  | "success" // Verde — Operación completada, viaje finalizado
  | "warning" // Ámbar — Por vencer, pendiente, atención moderada
  | "info" // Azul — Notas, en progreso, neutral activo
  | "destructive" // Rojo — Eliminar, cancelar, error crítico
  | "neutral"; // Gris — Borrador, inactivo, archivado

/**
 * Aliases legacy (DEPRECATED) — se mantienen para no romper módulos que
 * todavía usan estos nombres. Internamente se normalizan.
 *
 * Migración recomendada:
 *   - "danger" → "destructive"
 *   - "purple" → "info" + tone: "solid"  (para estados activos llamativos)
 *   - "orange" → "warning"
 */
export type LegacyColorVariant = "danger" | "purple" | "orange";

/**
 * Cualquier variante aceptada (canónica o legacy).
 * Existe solo para que callsites antiguos compilen.
 */
export type ColorVariant = CanonicalColorVariant | LegacyColorVariant;

const LEGACY_VARIANT_MAP: Record<LegacyColorVariant, CanonicalColorVariant> = {
  danger: "destructive",
  purple: "info",
  orange: "warning",
};

const LEGACY_VARIANT_TONE: Partial<Record<LegacyColorVariant, StatusTone>> = {
  // "purple" históricamente se usaba para estados activos / llamativos
  // (ej: trip IN_PROGRESS). Mapeamos a info solid para preservar la intención.
  purple: "solid",
};

function normalizeVariant(variant: ColorVariant): {
  canonical: CanonicalColorVariant;
  inheritedTone?: StatusTone;
} {
  if (variant in LEGACY_VARIANT_MAP) {
    const legacy = variant as LegacyColorVariant;
    return {
      canonical: LEGACY_VARIANT_MAP[legacy],
      inheritedTone: LEGACY_VARIANT_TONE[legacy],
    };
  }
  return { canonical: variant as CanonicalColorVariant };
}

// ============================================================================
// COLOR PRESETS — tokens del DS (no colores Tailwind crudos)
// ============================================================================

type ColorPreset = Pick<StatusConfig, "bgColor" | "textColor" | "borderColor">;

/**
 * Tono SOFT (default).
 *
 * Lee tokens `*-soft` definidos en index.css. Cambios futuros a la calibración
 * de tokens se reflejan automáticamente — sin tocar este archivo.
 */
export const STATUS_COLORS_SOFT: Record<CanonicalColorVariant, ColorPreset> = {
  success: {
    bgColor: "bg-success-soft",
    textColor: "text-success-soft-foreground",
    borderColor: "border-success/30",
  },
  warning: {
    bgColor: "bg-warning-soft",
    textColor: "text-warning-soft-foreground",
    borderColor: "border-warning/30",
  },
  info: {
    bgColor: "bg-info-soft",
    textColor: "text-info-soft-foreground",
    borderColor: "border-info/30",
  },
  destructive: {
    bgColor: "bg-destructive-soft",
    textColor: "text-destructive-soft-foreground",
    borderColor: "border-destructive/30",
  },
  neutral: {
    bgColor: "bg-neutral-soft",
    textColor: "text-neutral-soft-foreground",
    borderColor: "border-neutral/30",
  },
};

/**
 * Tono SOLID.
 *
 * Fondo saturado + foreground contrastante. Úsalo cuando el estado debe
 * destacar visualmente (ej: viaje EN_RUTA en un dashboard denso).
 */
export const STATUS_COLORS_SOLID: Record<CanonicalColorVariant, ColorPreset> = {
  success: {
    bgColor: "bg-success",
    textColor: "text-success-foreground",
    borderColor: "border-success",
  },
  warning: {
    bgColor: "bg-warning",
    textColor: "text-warning-foreground",
    borderColor: "border-warning",
  },
  info: {
    bgColor: "bg-info",
    textColor: "text-info-foreground",
    borderColor: "border-info",
  },
  destructive: {
    bgColor: "bg-destructive",
    textColor: "text-destructive-foreground",
    borderColor: "border-destructive",
  },
  neutral: {
    bgColor: "bg-neutral",
    textColor: "text-neutral-foreground",
    borderColor: "border-neutral",
  },
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Crea una configuración de estado usando una variante de color predefinida.
 *
 * @example
 * // Soft (default, recomendado para listas)
 * createStatusConfig("success", {
 *   label: "Completado",
 *   icon: CheckCircle2,
 *   description: "El viaje ha sido completado exitosamente",
 * });
 *
 * @example
 * // Solid (para estados que requieren atención)
 * createStatusConfig("info", {
 *   label: "En Ruta",
 *   icon: Truck,
 *   description: "Viaje actualmente en progreso",
 *   tone: "solid",
 * });
 *
 * @example
 * // Backward compatible (usa alias legacy)
 * createStatusConfig("danger", { label: "Cancelado", ... });
 * // → equivalente a createStatusConfig("destructive", { ... })
 *
 * createStatusConfig("purple", { label: "En Ruta", ... });
 * // → equivalente a createStatusConfig("info", { ..., tone: "solid" })
 */
export function createStatusConfig(
  variant: ColorVariant,
  config: Pick<StatusConfig, "label" | "icon" | "description"> & {
    tone?: StatusTone;
  },
): StatusConfig {
  const { canonical, inheritedTone } = normalizeVariant(variant);
  const tone: StatusTone = config.tone ?? inheritedTone ?? "soft";
  const palette =
    tone === "solid"
      ? STATUS_COLORS_SOLID[canonical]
      : STATUS_COLORS_SOFT[canonical];

  return {
    label: config.label,
    icon: config.icon,
    description: config.description,
    tone,
    ...palette,
  };
}
