/**
 * Status Configuration Types
 * Clean Architecture - Shared Layer (Types)
 *
 * Tipos base para configuración de estados en todos los módulos.
 * Garantiza consistencia visual y estructural en toda la aplicación.
 *
 * Ubicación: src/shared/config/status/types.ts
 */

import type { LucideIcon } from "lucide-react";

// ============================================================================
// BASE STATUS CONFIG TYPE
// ============================================================================

/**
 * Configuración base para cualquier estado en el sistema.
 * Todos los módulos deben seguir esta estructura.
 */
export interface StatusConfig {
  /** Etiqueta legible para mostrar al usuario */
  label: string;

  /** Ícono de Lucide para representar el estado */
  icon: LucideIcon;

  /** Color de fondo del badge (Tailwind classes) */
  bgColor: string;

  /** Color del texto del badge (Tailwind classes) */
  textColor: string;

  /** Color del borde del badge (Tailwind classes) */
  borderColor: string;

  /** Descripción detallada del estado (para tooltips o ayuda) */
  description: string;
}

// ============================================================================
// COLOR VARIANTS
// ============================================================================

/**
 * Variantes de color predefinidas para mantener consistencia.
 * Cada variante incluye soporte para dark mode.
 */
export type ColorVariant =
  | "success" // Verde - Estados positivos/completados
  | "warning" // Ámbar - Estados de advertencia/pendientes
  | "danger" // Rojo - Estados críticos/cancelados
  | "info" // Azul - Estados informativos/en progreso
  | "neutral" // Gris - Estados neutros/borradores
  | "purple" // Morado - Estados especiales
  | "orange"; // Naranja - Estados de alerta moderada

/**
 * Colores predefinidos por variante.
 * Usar estos para mantener consistencia en todo el sistema.
 */
export const STATUS_COLORS: Record<
  ColorVariant,
  Pick<StatusConfig, "bgColor" | "textColor" | "borderColor">
> = {
  success: {
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
  },
  warning: {
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-700 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  danger: {
    bgColor: "bg-red-50 dark:bg-red-950/30",
    textColor: "text-red-700 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
  },
  info: {
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  neutral: {
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    textColor: "text-gray-700 dark:text-gray-400",
    borderColor: "border-gray-200 dark:border-gray-800",
  },
  purple: {
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-700 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  orange: {
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    textColor: "text-orange-700 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Crea una configuración de estado usando una variante de color predefinida.
 * Simplifica la creación de configs manteniendo consistencia.
 *
 * @example
 * const config = createStatusConfig("success", {
 *   label: "Completado",
 *   icon: CheckCircle2,
 *   description: "El viaje ha sido completado exitosamente",
 * });
 */
export function createStatusConfig(
  variant: ColorVariant,
  config: Pick<StatusConfig, "label" | "icon" | "description">,
): StatusConfig {
  return {
    ...config,
    ...STATUS_COLORS[variant],
  };
}
