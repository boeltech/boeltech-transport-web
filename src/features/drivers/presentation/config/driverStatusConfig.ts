/**
 * Driver Status Configuration
 * Clean Architecture - Feature Layer (Config)
 *
 * Configuración de UI para los estados de conductores.
 * Usa el sistema centralizado de status config.
 *
 * Ubicación: src/features/drivers/presentation/config/driverStatusConfig.ts
 */

import {
  CheckCircle2,
  Clock,
  XCircle,
  Palmtree,
  CalendarOff,
  Coffee,
} from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/ui/custom-components/status-badge";
import {
  DRIVER_STATUS_LABELS,
  DriverStatus,
  type DriverStatusType,
} from "../../domain";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const DRIVER_STATUS_CONFIG: Record<DriverStatusType, StatusConfig> = {
  [DriverStatus.AVAILABLE]: createStatusConfig("success", {
    label: DRIVER_STATUS_LABELS[DriverStatus.AVAILABLE],
    icon: CheckCircle2,
    description: "Conductor disponible para asignación de viajes",
  }),

  [DriverStatus.ON_LEAVE]: createStatusConfig("info", {
    label: DRIVER_STATUS_LABELS[DriverStatus.ON_LEAVE],
    icon: CalendarOff,
    description: "Conductor actualmente en licencia o permiso",
  }),

  [DriverStatus.ON_TRIP]: createStatusConfig("info", {
    label: DRIVER_STATUS_LABELS[DriverStatus.ON_TRIP],
    icon: Clock,
    description: "Conductor actualmente en un viaje activo",
  }),

  [DriverStatus.ON_VACATION]: createStatusConfig("purple", {
    label: DRIVER_STATUS_LABELS[DriverStatus.ON_VACATION],
    icon: Palmtree,
    description: "Conductor en período de vacaciones",
  }),

  [DriverStatus.RESTING]: createStatusConfig("info", {
    label: DRIVER_STATUS_LABELS[DriverStatus.RESTING],
    icon: Coffee,
    description: "Conductor en período de descanso",
  }),

  //   [DriverStatus.SUSPENDED]: createStatusConfig("warning", {
  //     label: "Suspendido",
  //     icon: AlertTriangle,
  //     description: "Conductor suspendido temporalmente",
  //   }),

  [DriverStatus.TERMINATED]: createStatusConfig("danger", {
    label: DRIVER_STATUS_LABELS[DriverStatus.TERMINATED],
    icon: XCircle,
    description: "Conductor no disponible para operaciones",
  }),
};

// ============================================================================
// TYPED BADGE COMPONENT
// ============================================================================

/**
 * Badge de estado para conductores.
 * Pre-configurado con DRIVER_STATUS_CONFIG.
 *
 * @example
 * <DriverStatusBadge status={driver.status} />
 * <DriverStatusBadge status={driver.status} showIcon />
 * <DriverStatusBadge status={driver.status} size="lg" />
 */
export const DriverStatusBadge =
  createStatusBadgeComponent(DRIVER_STATUS_CONFIG);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene la configuración de un estado específico.
 */
export function getDriverStatusConfig(status: DriverStatusType): StatusConfig {
  return DRIVER_STATUS_CONFIG[status];
}

/**
 * Obtiene solo la etiqueta de un estado.
 */
export function getDriverStatusLabel(status: DriverStatusType): string {
  return DRIVER_STATUS_CONFIG[status]?.label ?? status;
}

/**
 * Calcula días hasta vencimiento de licencia
 */
export function getDaysUntilLicenseExpiration(expirationDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determina el color del badge de licencia según días restantes
 */
export function getLicenseExpirationVariant(
  daysRemaining: number,
): "destructive" | "warning" | "secondary" | "default" {
  if (daysRemaining <= 0) return "destructive";
  if (daysRemaining <= 30) return "warning";
  if (daysRemaining <= 90) return "secondary";
  return "default";
}

/**
 * Formatea el nombre completo del empleado/conductor
 */
export function formatDriverName(employee: {
  firstName: string;
  lastName: string;
}): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}
