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
  type LucideIcon,
} from "lucide-react";
import {
  type StopTypeValue,
  type StopStatusValue,
  type TripInvoicing,
  type TripStop,
  StopType,
  StopStatus,
  STOP_TYPE_LABELS,
  STOP_STATUS_LABELS,
  type TripListItem,
  isUnifiedAddressId,
} from "../domain";
import { composeStopLocalityLine } from "./stopLocalityDisplay";

// ============================================================================
// TYPES
// ============================================================================

// interface StatusConfig {
//   label: string;
//   color: string;
//   bgColor: string;
//   borderColor: string;
//   dotColor: string;
//   icon: LucideIcon;
// }

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

interface InvoicingBadgeConfig {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
}

/**
 * Colores simplificados para badges (compatibilidad con shadcn Badge)
 */
// export const TRIP_STATUS_BADGE_COLORS: Record<TripStatusType, string> = {
//   [TripStatus.DRAFT]:
//     "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
//   [TripStatus.SCHEDULED]:
//     "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//   [TripStatus.IN_PROGRESS]:
//     "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
//   [TripStatus.COMPLETED]:
//     "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
//   [TripStatus.CANCELLED]:
//     "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
// };

// ============================================================================
// STOP TYPE CONFIG - Configuración visual para tipos de parada
// ============================================================================

export const STOP_TYPE_CONFIG: Record<StopTypeValue, StopTypeConfig> = {
  [StopType.ORIGIN]: {
    label: STOP_TYPE_LABELS[StopType.ORIGIN],
    color: "text-success-soft-foreground",
    bgColor: "bg-success-soft",
    icon: Navigation,
    emoji: "🟢",
  },
  [StopType.PICKUP]: {
    label: STOP_TYPE_LABELS[StopType.PICKUP],
    color: "text-info-soft-foreground",
    bgColor: "bg-info-soft",
    icon: Package,
    emoji: "📦",
  },
  [StopType.DELIVERY]: {
    label: STOP_TYPE_LABELS[StopType.DELIVERY],
    color: "text-warning-soft-foreground",
    bgColor: "bg-warning-soft",
    icon: Package,
    emoji: "📤",
  },
  [StopType.WAYPOINT]: {
    label: STOP_TYPE_LABELS[StopType.WAYPOINT],
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: MapPin,
    emoji: "📍",
  },
  [StopType.DESTINATION]: {
    label: STOP_TYPE_LABELS[StopType.DESTINATION],
    color: "text-destructive-soft-foreground",
    bgColor: "bg-destructive-soft",
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
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  [StopStatus.IN_PROGRESS]: {
    label: STOP_STATUS_LABELS[StopStatus.IN_PROGRESS],
    color: "text-info-soft-foreground",
    bgColor: "bg-info-soft",
  },
  [StopStatus.COMPLETED]: {
    label: STOP_STATUS_LABELS[StopStatus.COMPLETED],
    color: "text-success-soft-foreground",
    bgColor: "bg-success-soft",
  },
  [StopStatus.SKIPPED]: {
    label: STOP_STATUS_LABELS[StopStatus.SKIPPED],
    color: "text-warning-soft-foreground",
    bgColor: "bg-warning-soft",
  },
};

// ============================================================================
// FORMATTERS - Funciones de formato para UI
// ============================================================================

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
// export function getStatusConfig(status: TripStatusType): StatusConfig {
//   return TRIP_STATUS_CONFIG[status];
// }

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
      color: "text-muted-foreground",
      bgColor: "bg-muted",
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

/** Clases `bg` + `text` para chips de tipo de parada. */
export function getStopTypeBadgeClasses(
  stopType: StopTypeValue | string,
): string {
  const { bgColor, color } = getStopTypeConfig(stopType);
  return `${bgColor} ${color}`;
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

function isBareSatMunicipalityCode(value: string): boolean {
  return /^\d{1,3}$/.test(value.trim());
}

function formatLegacyTripCityLabel(
  city: string | null | undefined,
  state: string | null | undefined,
): string | null {
  const cityValue = city?.trim();
  if (!cityValue) return null;
  const stateValue = state?.trim();
  if (isBareSatMunicipalityCode(cityValue)) {
    return stateValue
      ? `Municipio ${cityValue}, ${stateValue}`
      : `Municipio ${cityValue}`;
  }
  if (stateValue) return `${cityValue}, ${stateValue}`;
  return cityValue;
}

/** Etiqueta legible de un extremo del viaje (parada canónica + fallback legacy). */
export function formatTripEndpointLabel(
  stop: TripStop | undefined,
  legacy?: { city?: string | null; state?: string | null },
): string | null {
  const locationName = stop?.locationName?.trim();
  if (locationName) return locationName;

  if (stop) {
    const primary = formatStopDisplayPrimaryLine(stop);
    if (primary && primary !== "Sin dirección") return primary;

    const city = stop.city?.trim();
    if (city && !isBareSatMunicipalityCode(city)) {
      return formatLegacyTripCityLabel(city, stop.state) ?? city;
    }

    const locality = formatStopDisplayLocalityLine(stop);
    if (locality) return locality;
  }

  return formatLegacyTripCityLabel(legacy?.city, legacy?.state);
}

/** Subtítulo de detalle/listado: origen → destino desde paradas y resumen legacy. */
export function formatTripRouteSubtitle(
  stops: readonly TripStop[] | undefined,
  legacy: {
    originCity?: string | null;
    originState?: string | null;
    destinationCity?: string | null;
    destinationState?: string | null;
  },
): string {
  const ordered = stops?.length
    ? [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    : undefined;

  const originStop = ordered?.find((stop) => {
    const types = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];
    return types.includes(StopType.ORIGIN);
  });
  const destinationStop = ordered?.find((stop) => {
    const types = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];
    return types.includes(StopType.DESTINATION);
  });

  const origin = formatTripEndpointLabel(originStop, {
    city: legacy.originCity,
    state: legacy.originState,
  });
  const destination = formatTripEndpointLabel(destinationStop, {
    city: legacy.destinationCity,
    state: legacy.destinationState,
  });

  if (!origin && !destination) return "—";
  return `${origin || "Origen"} → ${destination || "Destino"}`;
}

export function getTripInvoicingBadgeConfig(
  tripItem: Pick<TripListItem, "status" | "invoicing">,
): InvoicingBadgeConfig {
  const invoicing = tripItem.invoicing;
  const hasLinkedInvoiceEvidence =
    !!invoicing.invoiceId ||
    !!invoicing.invoiceFolio ||
    invoicing.invoiceStatus !== null ||
    !!invoicing.invoiceCfdiUuid;

  if (hasLinkedInvoiceEvidence || invoicing.hasActiveInvoice) {
    switch (invoicing.invoiceStatus) {
      case "draft":
        return { label: "Borrador", variant: "secondary" };
      case "stamped":
        return { label: "Facturado", variant: "default" };
      case "cancellation_pending":
        return { label: "Pend. cancelación", variant: "destructive" };
      case "cancelled":
        return { label: "Cancelado", variant: "outline" };
      default:
        if (invoicing.hasActiveInvoice) {
          return { label: "Facturado", variant: "default" };
        }
        if (hasLinkedInvoiceEvidence) {
          return { label: "Borrador", variant: "secondary" };
        }
        break;
    }
  }

  if (invoicing.canGenerateInvoice) {
    return { label: "Disponible", variant: "outline" };
  }

  return { label: "No Disponible", variant: "outline" };
}

export function getTripInvoicingBlockReason(invoicing: TripInvoicing): string | null {
  if (invoicing.canGenerateInvoice) return null;
  const suppressBecauseInvoiceLinked =
    invoicing.hasActiveInvoice ||
    !!invoicing.invoiceId ||
    !!invoicing.invoiceFolio ||
    invoicing.invoiceStatus === "draft" ||
    invoicing.invoiceStatus === "stamped" ||
    invoicing.invoiceStatus === "cancellation_pending";
  if (suppressBecauseInvoiceLinked) return null;
  return (
    invoicing.blockReason ??
    "Este viaje ya tiene una factura activa y no se puede facturar nuevamente."
  );
}

// ============================================================================
// STOP DISPLAY (Fase 4 — lectura; `address`/`city` pueden venir del join con `addresses`)
// ============================================================================

/** Línea principal: lugar, calle desglosada o texto legacy. */
export function formatStopDisplayPrimaryLine(stop: TripStop): string {
  const name = stop.locationName?.trim();
  if (name) return name;

  const street = stop.street?.trim();
  if (street) {
    let line = street;
    if (stop.exteriorNumber?.trim()) line += ` #${stop.exteriorNumber.trim()}`;
    if (stop.interiorNumber?.trim()) line += `, Int. ${stop.interiorNumber.trim()}`;
    return line;
  }

  const addr = stop.address?.trim();
  if (addr) return addr;

  if (isUnifiedAddressId(stop.addressId)) {
    return "Domicilio en catálogo";
  }

  return "Sin dirección";
}

function isPlaceholderStopAddress(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "sin domicilio" ||
    normalized === "sin dirección" ||
    normalized === "domicilio en catálogo"
  );
}

/** Calle y número cuando el título de la parada es `locationName` (domicilio en catálogo). */
export function formatStopDisplayStreetLine(stop: TripStop): string | null {
  const locationName = stop.locationName?.trim();
  if (!locationName) return null;

  const street = stop.street?.trim();
  if (street) {
    let line = street;
    if (stop.exteriorNumber?.trim()) {
      line += ` #${stop.exteriorNumber.trim()}`;
    }
    if (stop.interiorNumber?.trim()) {
      line += `, Int. ${stop.interiorNumber.trim()}`;
    }
    if (line !== locationName) return line;
    return null;
  }

  const addr = stop.address?.trim();
  if (
    addr &&
    addr !== locationName &&
    !isPlaceholderStopAddress(addr)
  ) {
    return addr;
  }

  return null;
}

/** Línea secundaria: ciudad, estado, CP (o mensaje cuando solo hay `address_id`). */
export function formatStopDisplayLocalityLine(stop: TripStop): string {
  return composeStopLocalityLine(stop);
}
