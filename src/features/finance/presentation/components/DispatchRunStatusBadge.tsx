import { StatusBadge } from "@shared/components/StatusBadge";
import type { StatusConfig } from "@shared/config/status/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import type {
  DispatchRunOrigin,
  DispatchRunStatus,
} from "../../domain/billingDispatchRun.types";
import { DISPATCH_RUN_STATUS_CONFIG } from "../config/dispatchRunStatusConfig";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  getDispatchRunStatusLabel,
  getDispatchRunStatusTooltip,
  isEmptyScheduledCancelled,
} from "../utils/dispatchRunStatusPresentation";

interface DispatchRunStatusBadgeProps {
  status: DispatchRunStatus | string;
  origin?: DispatchRunOrigin | string | null;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Badge de estado del lote. Con origin=scheduled + cancelled muestra
 * «Sin facturas listas» (+ tooltip), no «Cancelada».
 */
export function DispatchRunStatusBadge({
  status,
  origin,
  className,
  showIcon = false,
  size = "md",
}: DispatchRunStatusBadgeProps) {
  const emptyAuto = isEmptyScheduledCancelled(origin, status);
  const label = getDispatchRunStatusLabel(status, origin);
  const tooltip = getDispatchRunStatusTooltip(status, origin);

  const config: Record<DispatchRunStatus, StatusConfig> = emptyAuto
    ? {
        ...DISPATCH_RUN_STATUS_CONFIG,
        cancelled: {
          ...DISPATCH_RUN_STATUS_CONFIG.cancelled,
          label: dispatchRunsCopy.emptyScheduled.label,
          description: dispatchRunsCopy.emptyScheduled.tooltip,
        },
      }
    : DISPATCH_RUN_STATUS_CONFIG;

  const badge = (
    <StatusBadge
      status={status as DispatchRunStatus}
      config={config}
      className={className}
      showIcon={showIcon}
      size={size}
    />
  );

  if (!tooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" title={label}>
          {badge}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
