/**
 * VehicleStatusBadge Component
 *
 * Badge visual que muestra el estado de un vehículo con colores.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleStatusBadge.tsx
 */

import { Badge } from "@shared/ui/badge";
import type { VehicleStatusType } from "@features/vehicles/domain";
import {
  VEHICLE_STATUS_LABELS,
  VEHICLE_STATUS_COLORS,
} from "@features/vehicles/domain";

// ============================================================================
// TYPES
// ============================================================================

interface VehicleStatusBadgeProps {
  status: VehicleStatusType;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleStatusBadge({ status }: VehicleStatusBadgeProps) {
  return (
    <Badge className={VEHICLE_STATUS_COLORS[status]} variant="secondary">
      {VEHICLE_STATUS_LABELS[status]}
    </Badge>
  );
}
