/**
 * Driver Status Configuration
 * Clean Architecture - Presentation Layer
 *
 * Configuración de colores, iconos y labels para estados de conductores.
 */

import {
  DriverStatus,
  type DriverStatusType,
  DRIVER_STATUS_LABELS,
} from "../../domain";

// ============================================================================
// STATUS CONFIG
// ============================================================================

export interface DriverStatusConfig {
  label: string;
  variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
  icon: string;
  color: string;
  bgColor: string;
}

export const DRIVER_STATUS_CONFIG: Record<
  DriverStatusType,
  DriverStatusConfig
> = {
  [DriverStatus.AVAILABLE]: {
    label: DRIVER_STATUS_LABELS[DriverStatus.AVAILABLE],
    variant: "success",
    icon: "circle-check",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  [DriverStatus.ON_TRIP]: {
    label: DRIVER_STATUS_LABELS[DriverStatus.ON_TRIP],
    variant: "warning",
    icon: "truck",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  [DriverStatus.RESTING]: {
    label: DRIVER_STATUS_LABELS[DriverStatus.RESTING],
    variant: "secondary",
    icon: "moon",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  [DriverStatus.INACTIVE]: {
    label: DRIVER_STATUS_LABELS[DriverStatus.INACTIVE],
    variant: "destructive",
    icon: "circle-x",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene la configuración de estado
 */
export function getDriverStatusConfig(
  status: DriverStatusType,
): DriverStatusConfig {
  return (
    DRIVER_STATUS_CONFIG[status] ?? DRIVER_STATUS_CONFIG[DriverStatus.INACTIVE]
  );
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
