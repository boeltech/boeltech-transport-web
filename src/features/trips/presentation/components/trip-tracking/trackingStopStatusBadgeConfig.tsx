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
} from "@features/trips/domain";
import { createStatusConfig, type StatusConfig } from "@shared/config/status/types";
import {
  createStatusBadgeComponent,
  StatusBadge,
} from "@shared/components/StatusBadge";
import { trackingCopy } from "../../copy";

/** Labels PRD del riel (Pendiente / En sitio / Completada / Omitida). */
export const TRACKING_STOP_STATUS_CONFIG = {
  [StopStatus.PENDING]: createStatusConfig("neutral", {
    label: trackingCopy.label.stopStatus.pending,
    icon: Circle,
    description: "Parada pendiente de visita",
  }),
  [StopStatus.IN_PROGRESS]: createStatusConfig("info", {
    label: trackingCopy.label.stopStatus.in_progress,
    icon: CircleCheck,
    description: "Parada en sitio",
  }),
  [StopStatus.COMPLETED]: createStatusConfig("success", {
    label: trackingCopy.label.stopStatus.completed,
    icon: CheckCircle2,
    description: "Parada completada",
  }),
  [StopStatus.SKIPPED]: createStatusConfig("warning", {
    label: trackingCopy.label.stopStatus.skipped,
    icon: SkipForward,
    description: "Parada omitida — no se visitó",
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
