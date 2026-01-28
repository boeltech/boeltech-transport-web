/**
 * Trip UI Helpers
 * Clean Architecture - Presentation Layer
 *
 * Constantes y helpers específicos para la UI del módulo de viajes.
 * Esta capa conoce los detalles de presentación (colores, iconos, formatos).
 */

import {
  Navigation,
  Package,
  MapPin,
  Flag,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  FileText,
  type LucideIcon,
} from "lucide-react";
import {
  type TripStatusType,
  type StopTypeValue,
  type StopStatusValue,
  TripStatus,
  StopType,
  StopStatus,
  TRIP_STATUS_LABELS,
  STOP_TYPE_LABELS,
  STOP_STATUS_LABELS,
} from "../domain";

// ============================================================================
// TYPES
// ============================================================================

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  icon: LucideIcon;
}

interface StopTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
  emoji: string;
}

interface StopStatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

// ============================================================================
// STATUS CONFIG - Configuración visual para estados de viaje
// ============================================================================

export const TRIP_STATUS_CONFIG: Record<TripStatusType, StatusConfig> = {
  [TripStatus.DRAFT]: {
    label: TRIP_STATUS_LABELS[TripStatus.DRAFT],
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-200 dark:border-gray-700",
    dotColor: "bg-gray-500",
    icon: FileText,
  },
  [TripStatus.SCHEDULED]: {
    label: TRIP_STATUS_LABELS[TripStatus.SCHEDULED],
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500",
    icon: Clock,
  },
  [TripStatus.IN_PROGRESS]: {
    label: TRIP_STATUS_LABELS[TripStatus.IN_PROGRESS],
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
    icon: Truck,
  },
  [TripStatus.COMPLETED]: {
    label: TRIP_STATUS_LABELS[TripStatus.COMPLETED],
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
    icon: CheckCircle2,
  },
  [TripStatus.CANCELLED]: {
    label: TRIP_STATUS_LABELS[TripStatus.CANCELLED],
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-200 dark:border-red-800",
    dotColor: "bg-red-500",
    icon: XCircle,
  },
};

/**
 * Colores simplificados para badges (compatibilidad con shadcn Badge)
 */
export const TRIP_STATUS_BADGE_COLORS: Record<TripStatusType, string> = {
  [TripStatus.DRAFT]:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  [TripStatus.SCHEDULED]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [TripStatus.IN_PROGRESS]:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  [TripStatus.COMPLETED]:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  [TripStatus.CANCELLED]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

// ============================================================================
// STOP TYPE CONFIG - Configuración visual para tipos de parada
// ============================================================================

export const STOP_TYPE_CONFIG: Record<StopTypeValue, StopTypeConfig> = {
  [StopType.ORIGIN]: {
    label: STOP_TYPE_LABELS[StopType.ORIGIN],
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: Navigation,
    emoji: "🟢",
  },
  [StopType.PICKUP]: {
    label: STOP_TYPE_LABELS[StopType.PICKUP],
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: Package,
    emoji: "📦",
  },
  [StopType.DELIVERY]: {
    label: STOP_TYPE_LABELS[StopType.DELIVERY],
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: Package,
    emoji: "📤",
  },
  [StopType.WAYPOINT]: {
    label: STOP_TYPE_LABELS[StopType.WAYPOINT],
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    icon: MapPin,
    emoji: "📍",
  },
  [StopType.DESTINATION]: {
    label: STOP_TYPE_LABELS[StopType.DESTINATION],
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: Flag,
    emoji: "🏁",
  },
};

// ============================================================================
// STOP STATUS CONFIG - Configuración visual para estados de parada
// ============================================================================

export const STOP_STATUS_CONFIG: Record<StopStatusValue, StopStatusConfig> = {
  [StopStatus.PENDING]: {
    label: STOP_STATUS_LABELS[StopStatus.PENDING],
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  [StopStatus.IN_PROGRESS]: {
    label: STOP_STATUS_LABELS[StopStatus.IN_PROGRESS],
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  [StopStatus.COMPLETED]: {
    label: STOP_STATUS_LABELS[StopStatus.COMPLETED],
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  [StopStatus.SKIPPED]: {
    label: STOP_STATUS_LABELS[StopStatus.SKIPPED],
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
};

// ============================================================================
// FORMATTERS - Funciones de formato para UI
// ============================================================================

/**
 * Formatea una fecha para mostrar (formato largo)
 */
export function formatDisplayDate(
  date: Date | string | null | undefined,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formatea una fecha en formato corto
 */
export function formatShortDate(
  date: Date | string | null | undefined,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Formatea solo la fecha (sin hora)
 */
export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formatea solo la hora
 */
export function formatTimeOnly(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formatea fecha relativa (hace X tiempo)
 */
export function formatRelativeDate(
  date: Date | string | null | undefined,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return formatShortDate(d);
}

/**
 * Formatea kilometraje
 */
export function formatMileage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("es-MX")} km`;
}

/**
 * Formatea peso
 */
export function formatWeight(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("es-MX")} kg`;
}

/**
 * Formatea volumen
 */
export function formatVolume(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("es-MX")} m³`;
}

/**
 * Formatea moneda (MXN por defecto)
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = "MXN",
): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Formatea duración en horas
 */
export function formatDuration(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
}

/**
 * Formatea número con separadores de miles
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("es-MX");
}

/**
 * Formatea porcentaje
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(0)}%`;
}

// ============================================================================
// CONFIG GETTERS - Funciones para obtener configuración
// ============================================================================

/**
 * Obtiene la configuración de un estado de viaje
 */
export function getStatusConfig(status: TripStatusType): StatusConfig {
  return TRIP_STATUS_CONFIG[status];
}

/**
 * Obtiene la configuración de un tipo de parada
 */
export function getStopTypeConfig(
  stopType: StopTypeValue | string,
): StopTypeConfig {
  const config = STOP_TYPE_CONFIG[stopType as StopTypeValue];

  // Fallback para tipos desconocidos
  if (!config) {
    return {
      label: stopType,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      icon: MapPin,
      emoji: "📍",
    };
  }

  return config;
}

/**
 * Obtiene la configuración de un estado de parada
 */
export function getStopStatusConfig(status: StopStatusValue): StopStatusConfig {
  return STOP_STATUS_CONFIG[status];
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Genera los números de página a mostrar en la paginación
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "...")[] {
  const pages: (number | "...")[] = [];
  const delta = 2; // Páginas a mostrar antes y después de la actual

  if (totalPages <= 1) return [1];

  // Siempre mostrar primera página
  pages.push(1);

  // Calcular rango alrededor de la página actual
  const rangeStart = Math.max(2, currentPage - delta);
  const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

  // Agregar ellipsis si hay gap después de 1
  if (rangeStart > 2) {
    pages.push("...");
  }

  // Agregar páginas del rango
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Agregar ellipsis si hay gap antes del final
  if (rangeEnd < totalPages - 1) {
    pages.push("...");
  }

  // Siempre mostrar última página
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Trunca un texto a un máximo de caracteres
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number,
): string {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Capitaliza la primera letra de un texto
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Une partes de una dirección filtrando valores vacíos
 */
export function formatAddress(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(", ") || "—";
}

/**
 * Formatea una ruta como "Ciudad A → Ciudad B"
 */
export function formatRoute(
  originCity: string | null | undefined,
  destinationCity: string | null | undefined,
): string {
  if (!originCity && !destinationCity) return "—";
  return `${originCity || "?"} → ${destinationCity || "?"}`;
}
