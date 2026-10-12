import { Package } from "lucide-react";

import {
  TripStatus,
  type TripCargo,
  type TripStatusType,
  type TripStop,
  type StopStatusValue,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";

import { formatStopTimelineLabel } from "../../uiHelpers";
import type { TripScheduleTimes } from "../trip-route/tripRouteDetailHelpers";
import { getStopCargoLinks } from "../../utils/stopCargoCorrelation";
import { buildTrackingItineraryRows } from "./trackingOperationalHelpers";
import {
  TrackingStopStatusBadgeRow,
  trackingStopStatusForBadge,
} from "./trackingStopStatusBadgeConfig";
import { trackingCopy } from "./trackingCopy";

export type TripTrackingItineraryRailProps = {
  stops: readonly TripStop[];
  tripStatus: TripStatusType;
  tripTimes?: TripScheduleTimes;
  cargos?: readonly TripCargo[];
  /** Parada resaltada (p. ej. selección del hub o focusRequest). */
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
  className?: string;
};

/** Con pocas paradas reparte ancho; con más, cards fijas + scroll horizontal visible. */
const RAIL_TRACK_MAX = 3;

/**
 * Riel compacto de itinerario (F4/F7): plan/real + «En espera» visibles temprano
 * sin el master-detail denso de cargas.
 */
export function TripTrackingItineraryRail({
  stops,
  tripStatus,
  tripTimes,
  cargos = [],
  selectedStopId = null,
  onSelectStop,
  className,
}: TripTrackingItineraryRailProps) {
  const rows = buildTrackingItineraryRows(stops, tripTimes, cargos);
  const showHints = tripStatus === TripStatus.IN_PROGRESS;
  const trackMode = rows.length > 0 && rows.length <= RAIL_TRACK_MAX;

  if (rows.length === 0) {
    return (
      <section
        className={cn("rounded-lg border bg-muted/20 px-3 py-2", className)}
        aria-label={trackingCopy.section.itinerary}
      >
        <p className="text-sm text-muted-foreground">{trackingCopy.state.noStops}</p>
      </section>
    );
  }

  return (
    <section
      className={cn("space-y-2", className)}
      aria-label={trackingCopy.section.itinerary}
      data-tracking-section="rail"
      data-tracking-rail-mode={trackMode ? "track" : "scroll"}
    >
      <p className="text-xs font-medium text-muted-foreground">
        {trackingCopy.section.itinerary}
      </p>
      <ol
        className={cn(
          "flex gap-2 pb-1.5",
          // Siempre permite overflow; con N≤3 las cards flex-1 no desbordan.
          // Con N≥4: scroll horizontal visible (no ocultar scrollbar).
          "overflow-x-auto overscroll-x-contain",
          "scrollbar-thin [scrollbar-width:thin]",
          trackMode ? "w-full" : null,
        )}
      >
        {rows.map((row) => {
          const { primary, secondary } = formatStopTimelineLabel(
            row.stop,
            row.displayOrder,
          );
          const stopStatus = trackingStopStatusForBadge(
            row.stop.status as StopStatusValue | undefined,
          );
          const cargoCount = getStopCargoLinks(row.stop, cargos, stops).length;
          const selected = selectedStopId === row.stop.id;
          const interactive = onSelectStop != null;

          return (
            <li
              key={row.stop.id}
              className={cn(
                trackMode
                  ? "min-w-0 flex-1 basis-0"
                  : "min-w-[11.5rem] max-w-[14rem] shrink-0",
              )}
            >
              <button
                type="button"
                disabled={!interactive}
                aria-pressed={interactive ? selected : undefined}
                onClick={() => onSelectStop?.(row.stop.id)}
                className={cn(
                  "h-full w-full rounded-md border p-2.5 text-left transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  interactive ? "cursor-pointer" : "cursor-default",
                  selected
                    ? "border-primary bg-background shadow-sm"
                    : "border-border/80 bg-card",
                  row.isActionTarget && showHints && !selected
                    ? "border-primary/40 bg-primary/5"
                    : null,
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium leading-tight">
                      {primary}
                    </span>
                    <TrackingStopStatusBadgeRow
                      status={stopStatus}
                      isActive={row.isActionTarget && showHints}
                    />
                    {row.waitingPhase ? (
                      <Badge
                        variant="warning"
                        tone="soft"
                        className="text-[10px] font-normal"
                      >
                        {trackingCopy.label.waitingPhase}
                      </Badge>
                    ) : null}
                  </div>
                  {secondary ? (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {secondary}
                    </p>
                  ) : null}
                  {row.planRealLines.length > 0 ? (
                    <ul className="space-y-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {row.planRealLines.slice(0, 2).map((line) => (
                        <li key={line.kind} className="truncate">
                          {line.summary}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {cargoCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Package className="h-3 w-3 shrink-0" aria-hidden />
                      {trackingCopy.label.cargoCount(cargoCount)}
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
