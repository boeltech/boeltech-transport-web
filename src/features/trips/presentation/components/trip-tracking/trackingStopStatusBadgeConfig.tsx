/* eslint-disable react-refresh/only-export-components */
import {
  CheckCircle2,
  Circle,
  CircleCheck,
  SkipForward,
} from "lucide-react";

import {
  StopStatus,
  type StopStatusValue,
  STOP_STATUS_LABELS,
} from "@features/trips/domain";
import { createStatusConfig, type StatusConfig } from "@shared/config/status/types";
import {
  createStatusBadgeComponent,
  StatusBadge,
} from "@shared/components/StatusBadge";

export const TRACKING_STOP_STATUS_CONFIG = {
  [StopStatus.PENDING]: createStatusConfig("neutral", {
    label: STOP_STATUS_LABELS[StopStatus.PENDING],
    icon: Circle,
    description: "Parada pendiente de visita",
  }),
  [StopStatus.IN_PROGRESS]: createStatusConfig("info", {
    label: STOP_STATUS_LABELS[StopStatus.IN_PROGRESS],
    icon: CircleCheck,
    description: "Parada en curso",
  }),
  [StopStatus.COMPLETED]: createStatusConfig("success", {
    label: STOP_STATUS_LABELS[StopStatus.COMPLETED],
    icon: CheckCircle2,
    description: "Parada completada",
  }),
  [StopStatus.SKIPPED]: createStatusConfig("warning", {
    label: STOP_STATUS_LABELS[StopStatus.SKIPPED],
    icon: SkipForward,
    description: "Parada omitida",
  }),
} as const;

export const TrackingStopStatusBadge = createStatusBadgeComponent(
  TRACKING_STOP_STATUS_CONFIG,
);

export function trackingStopStatusForBadge(
  status: StopStatusValue | undefined,
): StopStatusValue {
  return status ?? StopStatus.PENDING;
}

export function TrackingStopStatusBadgeRow({
  status,
  isActive,
  className,
  size = "sm",
}: {
  status: StopStatusValue;
  isActive: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const config = Object.fromEntries(
    Object.entries(TRACKING_STOP_STATUS_CONFIG).map(([key, cfg]) => [
      key,
      {
        ...cfg,
        tone: key === status && isActive ? ("solid" as const) : ("soft" as const),
      },
    ]),
  ) as Record<StopStatusValue, StatusConfig>;

  return (
    <StatusBadge
      status={status}
      config={config}
      className={className}
      size={size}
    />
  );
}
