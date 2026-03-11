/**
 * Vehicle Status Configuration
 * Clean Architecture - Feature Layer (Config)
 *
 * Configuración de UI para los estados de vehículos.
 * Usa el sistema centralizado de status config.
 *
 * Ubicación: src/features/vehicles/presentation/config/vehicleStatusConfig.ts
 */

import { CheckCircle2, Wrench, XCircle, Truck } from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import {
  VEHICLE_STATUS_LABELS,
  VehicleStatus,
  type VehicleStatusType,
} from "../../domain";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const VEHICLE_STATUS_CONFIG: Record<VehicleStatusType, StatusConfig> = {
  [VehicleStatus.AVAILABLE]: createStatusConfig("success", {
    label: VEHICLE_STATUS_LABELS[VehicleStatus.AVAILABLE],
    icon: CheckCircle2,
    description: "Vehículo operativo y disponible para asignación",
  }),

  [VehicleStatus.ON_TRIP]: createStatusConfig("info", {
    label: VEHICLE_STATUS_LABELS[VehicleStatus.ON_TRIP],
    icon: Truck,
    description: "Vehículo actualmente en un viaje",
  }),

  //   [VehicleStatus.PENDING_INSPECTION]: createStatusConfig("orange", {
  //     label: "Pendiente Inspección",
  //     icon: AlertTriangle,
  //     description: "Vehículo requiere inspección antes de operar",
  //   }),

  [VehicleStatus.IN_MAINTENANCE]: createStatusConfig("warning", {
    label: VEHICLE_STATUS_LABELS[VehicleStatus.IN_MAINTENANCE],
    icon: Wrench,
    description: "Vehículo en servicio de mantenimiento",
  }),

  [VehicleStatus.OUT_OF_SERVICE]: createStatusConfig("danger", {
    label: VEHICLE_STATUS_LABELS[VehicleStatus.OUT_OF_SERVICE],
    icon: XCircle,
    description: "Vehículo no disponible para operaciones",
  }),
};

// ============================================================================
// TYPED BADGE COMPONENT
// ============================================================================

/**
 * Badge de estado para vehículos.
 * Pre-configurado con VEHICLE_STATUS_CONFIG.
 *
 * @example
 * <VehicleStatusBadge status={vehicle.status} />
 * <VehicleStatusBadge status={vehicle.status} showIcon />
 * <VehicleStatusBadge status={vehicle.status} size="lg" />
 */
export const VehicleStatusBadge = createStatusBadgeComponent(
  VEHICLE_STATUS_CONFIG,
);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene la configuración de un estado específico.
 */
export function getVehicleStatusConfig(
  status: VehicleStatusType,
): StatusConfig {
  return VEHICLE_STATUS_CONFIG[status];
}

/**
 * Obtiene solo la etiqueta de un estado.
 */
export function getVehicleStatusLabel(status: VehicleStatusType): string {
  return VEHICLE_STATUS_CONFIG[status]?.label ?? status;
}
