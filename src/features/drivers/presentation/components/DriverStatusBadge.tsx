/**
 * DriverStatusBadge Component
 * Clean Architecture - Presentation Layer
 *
 * Badge que muestra el estado actual de un conductor.
 */

import { Badge } from "@shared/ui/badge";
import {
  CircleCheck,
  Truck,
  Moon,
  CircleX,
  type LucideIcon,
} from "lucide-react";
import { type DriverStatusType, DriverStatus } from "../../domain";
import { getDriverStatusConfig } from "../config";

// ============================================================================
// TYPES
// ============================================================================

interface DriverStatusBadgeProps {
  status: DriverStatusType;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

// ============================================================================
// ICON MAP
// ============================================================================

const STATUS_ICONS: Record<DriverStatusType, LucideIcon> = {
  [DriverStatus.AVAILABLE]: CircleCheck,
  [DriverStatus.ON_TRIP]: Truck,
  [DriverStatus.RESTING]: Moon,
  [DriverStatus.INACTIVE]: CircleX,
};

// ============================================================================
// SIZE CONFIG
// ============================================================================

const SIZE_CLASSES = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-base px-3 py-1",
};

const ICON_SIZE_CLASSES = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverStatusBadge({
  status,
  showIcon = true,
  size = "md",
}: DriverStatusBadgeProps) {
  const config = getDriverStatusConfig(status);
  const Icon = STATUS_ICONS[status];

  return (
    <Badge variant={config.variant} className={SIZE_CLASSES[size]}>
      {showIcon && Icon && (
        <Icon className={`${ICON_SIZE_CLASSES[size]} mr-1`} />
      )}
      {config.label}
    </Badge>
  );
}
