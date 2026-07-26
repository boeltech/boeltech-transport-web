import type { TrackingTimelineProgress } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { cn } from "@shared/lib/utils/cn";
import { formatDateTime } from "@shared/utils/dateUtils";

import { progressCopy, trackingCopy } from "../../copy";

export type TripTrackingProgressStripProps = {
  progress: TrackingTimelineProgress;
  /** Viaje terminal: strip más discreto (sin competir con hub/timeline). */
  readOnly?: boolean;
  className?: string;
};

function formatKm(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("es-MX")} km`;
}

function formatEta(value: Date | null): string {
  if (value == null) return trackingCopy.state.noEta;
  return formatDateTime(value.toISOString());
}

type MetricCellProps = {
  label: string;
  value: string;
  hint?: string;
};

function MetricCell({ label, value, hint }: MetricCellProps) {
  const cell = (
    <div
      className={cn("min-w-0 px-3 py-2", hint ? "cursor-help" : null)}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );

  if (hint == null || hint === "") return cell;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{cell}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * KPIs de seguimiento en una sola fila (menos scroll entre guide y hub).
 */
export function TripTrackingProgressStrip({
  progress,
  readOnly = false,
  className,
}: TripTrackingProgressStripProps) {
  const stopsHint = progressCopy.hint.completedStops(
    progress.stopsCompleted,
    progress.stopsTotal,
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "rounded-lg border",
          readOnly ? "border-border/80 bg-muted/20" : "bg-card",
          className,
        )}
        role="group"
        aria-label={trackingCopy.section.metrics}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {trackingCopy.section.metrics}
          </p>
          {readOnly ? (
            <Badge variant="outline" className="text-[10px] font-normal">
              {trackingCopy.state.readOnly}
            </Badge>
          ) : null}
        </div>
        <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
          <MetricCell
            label={progressCopy.label.percent}
            value={`${progress.percentComplete}%`}
            hint={`${progressCopy.hint.percent} ${stopsHint}.`}
          />
          <MetricCell
            label={trackingCopy.label.distancePlanned}
            value={formatKm(progress.distancePlannedKm)}
            hint={trackingCopy.hint.distancePlanned}
          />
          <MetricCell
            label={trackingCopy.label.distanceActual}
            value={formatKm(progress.distanceActualKm)}
            hint={trackingCopy.hint.distanceActual}
          />
          <MetricCell
            label={trackingCopy.label.eta}
            value={formatEta(progress.estimatedArrival)}
            hint={trackingCopy.hint.eta}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
