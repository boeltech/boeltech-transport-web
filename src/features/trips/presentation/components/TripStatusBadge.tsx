/**
 * TripStatusBadge Component
 * Clean Architecture - Presentation Layer
 */

import { memo } from "react";
import {
  Calendar,
  Truck,
  CheckCircle2,
  XCircle,
  type LucideIcon,
  Eraser,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { getStatusConfig } from "../uiHelpers";
import { TripStatus, type TripStatusType } from "@features/trips/domain";

const STATUS_ICONS: Record<TripStatusType, LucideIcon> = {
  [TripStatus.SCHEDULED]: Calendar,
  [TripStatus.IN_PROGRESS]: Truck,
  [TripStatus.COMPLETED]: CheckCircle2,
  [TripStatus.CANCELLED]: XCircle,
  [TripStatus.DRAFT]: Eraser,
};

interface TripStatusBadgeProps {
  status: TripStatusType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: { badge: "px-2 py-0.5 text-xs", icon: "h-3 w-3" },
  md: { badge: "px-2.5 py-1 text-sm", icon: "h-4 w-4" },
  lg: { badge: "px-3 py-1.5 text-base", icon: "h-5 w-5" },
};

export const TripStatusBadge = memo(function TripStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: TripStatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = STATUS_ICONS[status];
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium border",
        config.bgColor,
        config.label,
        config.borderColor,
        sizeClasses.badge,
        className,
      )}
    >
      {showIcon && <Icon className={sizeClasses.icon} />}
      {config.label}
    </span>
  );
});

export const TripStatusBadgeAnimated = memo(function TripStatusBadgeAnimated({
  status,
  ...props
}: TripStatusBadgeProps) {
  return (
    <div className="relative inline-flex">
      <TripStatusBadge status={status} {...props} />
      {status === TripStatus.IN_PROGRESS && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
        </span>
      )}
    </div>
  );
});
