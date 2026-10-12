import type { TrackingTrafficLight } from "@boeltech/cfdi-domain";
import type { TrackingTimelineProgress, TripStatusType } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";

import { TripStatusBadge } from "../../config/tripStatusConfig";
import { trackingCopy } from "../../copy";
import { buildTrackingHeaderContextPhrase } from "./trackingHeaderContext";
import {
  trackingTrafficLightBadgeVariant,
  trackingTrafficLightLabel,
} from "./trackingTrafficLight";

export type TripTrackingProgressStripProps = {
  progress: TrackingTimelineProgress;
  tripStatus: TripStatusType;
  /** Semáforo derivado (`deriveTrackingTrafficLight`); `n/a` no muestra chip. */
  trafficLight: TrackingTrafficLight;
  /**
   * Frase única de contexto (situacional F7 / tránsito F5). Si se omite, se arma
   * en tránsito con ETA del progreso (sin «Parada N de M» — eso vive en el riel).
   */
  contextPhrase?: string;
  /** Etiqueta de parada para armar la frase cuando no hay `contextPhrase`. */
  nextStopLabel?: string | null;
  /** Viaje terminal: tono más discreto. */
  readOnly?: boolean;
  className?: string;
};

/**
 * Cabecera Z1 (F5): 1 status viaje + 1 semáforo (jerarquía distinta) + 1 frase.
 * Sin km planeados/recorridos. Sin chip binario «Va tarde».
 */
export function TripTrackingProgressStrip({
  progress,
  tripStatus,
  trafficLight,
  contextPhrase,
  nextStopLabel = null,
  readOnly = false,
  className,
}: TripTrackingProgressStripProps) {
  const phrase =
    contextPhrase ??
    buildTrackingHeaderContextPhrase({
      situation: "in_transit",
      stopLabel: nextStopLabel,
      estimatedArrival: progress.estimatedArrival,
    });

  const showTrafficLight = trafficLight !== "n/a";
  const trafficLabel = showTrafficLight
    ? trackingTrafficLightLabel(trafficLight)
    : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1.5",
        readOnly ? "opacity-80" : null,
        className,
      )}
      role="group"
      aria-label={trackingCopy.section.metrics}
    >
      <TripStatusBadge status={tripStatus} size="md" />
      {showTrafficLight && trafficLabel ? (
        <Badge
          variant={trackingTrafficLightBadgeVariant(trafficLight)}
          tone="soft"
          className="text-[10px] font-normal uppercase tracking-wide"
          title={trackingCopy.label.trafficLightAria}
          aria-label={`${trackingCopy.label.trafficLightAria}: ${trafficLabel}`}
        >
          {trafficLabel}
        </Badge>
      ) : null}
      <span className="text-xs text-muted-foreground tabular-nums">{phrase}</span>
      {readOnly ? (
        <Badge variant="outline" className="text-[10px] font-normal">
          {trackingCopy.state.readOnly}
        </Badge>
      ) : null}
    </div>
  );
}
