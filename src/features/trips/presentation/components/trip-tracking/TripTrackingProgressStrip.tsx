import type { TrackingTimelineProgress } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";
import { formatDateTime } from "@shared/utils/dateUtils";

import { trackingCopy } from "../../copy";

export type TripTrackingProgressStripProps = {
  progress: TrackingTimelineProgress;
  /** Salida real del viaje (si ya despachó). */
  actualDeparture?: Date | null;
  /** Chip de atención cuando la llegada estimada ya pasó. */
  overdue?: boolean;
  /** Viaje terminal: tono más discreto. */
  readOnly?: boolean;
  className?: string;
};

function formatShortTime(value: Date): string {
  return formatDateTime(value.toISOString());
}

/**
 * Línea de contexto del hub (D4): posición en itinerario, salida real,
 * llegada estimada y chip «Va tarde». Sin km planeados/recorridos.
 */
export function TripTrackingProgressStrip({
  progress,
  actualDeparture = null,
  overdue = false,
  readOnly = false,
  className,
}: TripTrackingProgressStripProps) {
  const { stopsCompleted, stopsTotal, estimatedArrival } = progress;

  const stopsLabel =
    stopsTotal > 0 && stopsCompleted >= stopsTotal
      ? trackingCopy.label.stopsProgressDone(stopsTotal)
      : trackingCopy.label.stopsProgress(stopsCompleted, Math.max(stopsTotal, 1));

  const parts: string[] = [stopsLabel];

  if (actualDeparture != null) {
    parts.push(trackingCopy.label.departedAt(formatShortTime(actualDeparture)));
  }

  if (estimatedArrival != null) {
    parts.push(trackingCopy.label.arrivesAt(formatShortTime(estimatedArrival)));
  } else {
    parts.push(trackingCopy.state.noEta);
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground",
        readOnly ? "opacity-80" : null,
        className,
      )}
      role="group"
      aria-label={trackingCopy.section.metrics}
    >
      <span className="tabular-nums">{parts.join(" · ")}</span>
      {overdue ? (
        <Badge variant="warning" tone="soft" className="text-[10px] font-normal">
          {trackingCopy.label.overdue}
        </Badge>
      ) : null}
      {readOnly ? (
        <Badge variant="outline" className="text-[10px] font-normal">
          {trackingCopy.state.readOnly}
        </Badge>
      ) : null}
    </div>
  );
}
