/**
 * Trip Status Configuration
 * Clean Architecture - Feature Layer (Config)
 *
 * Configuración de UI para los estados de viajes.
 * F11 / D-F11-1: sentence case + colores firmados (cambio global L5).
 *
 * Ubicación: src/features/trips/presentation/config/tripStatusConfig.ts
 */

import { FileEdit, Calendar, Truck, CheckCircle2, XCircle } from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import { TripStatus, type TripStatusType } from "../../domain";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const TRIP_STATUS_CONFIG: Record<TripStatusType, StatusConfig> = {
  [TripStatus.DRAFT]: createStatusConfig("neutral", {
    label: "Reserva",
    icon: FileEdit,
    description: "Pedido anotado; pendiente de programar",
  }),

  [TripStatus.SCHEDULED]: createStatusConfig("info", {
    label: "Programado",
    icon: Calendar,
    description: "Viaje programado y listo para iniciar",
  }),

  [TripStatus.IN_PROGRESS]: createStatusConfig("info", {
    label: "En ruta",
    icon: Truck,
    description: "Viaje actualmente en ruta",
    tone: "solid",
  }),

  [TripStatus.COMPLETED]: createStatusConfig("success", {
    label: "Completado",
    icon: CheckCircle2,
    description: "Viaje finalizado exitosamente",
  }),

  /** Outline / neutral (D-F11-1): sin relleno soft. */
  [TripStatus.CANCELLED]: {
    ...createStatusConfig("neutral", {
      label: "Cancelado",
      icon: XCircle,
      description: "Viaje cancelado",
    }),
    bgColor: "bg-transparent",
    textColor: "text-muted-foreground",
    borderColor: "border-border",
  },
};

// ============================================================================
// TYPED BADGE COMPONENT
// ============================================================================

/**
 * Badge de estado para viajes.
 * Pre-configurado con TRIP_STATUS_CONFIG.
 *
 * @example
 * <TripStatusBadge status={trip.status} />
 * <TripStatusBadge status={trip.status} showIcon />
 * <TripStatusBadge status={trip.status} size="lg" />
 */
export const TripStatusBadge = createStatusBadgeComponent(TRIP_STATUS_CONFIG);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene la configuración de un estado específico.
 */
export function getTripStatusConfig(status: TripStatusType): StatusConfig {
  return TRIP_STATUS_CONFIG[status];
}

/**
 * Obtiene solo la etiqueta de un estado.
 */
export function getTripStatusLabel(status: TripStatusType): string {
  return TRIP_STATUS_CONFIG[status]?.label ?? status;
}
