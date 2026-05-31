import { Circle, CircleCheck, CircleDot, ListOrdered } from "lucide-react";

import type { TripStatusType } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

import { formatStopTimelineLabel } from "../../uiHelpers";
import type { TripStop } from "@features/trips/domain";
import type { TripScheduleTimes } from "../trip-route/tripRouteDetailHelpers";
import {
  buildTrackingItineraryRows,
  getTrackingStopRoleHint,
} from "./trackingOperationalHelpers";
import { trackingCopy } from "./trackingCopy";

type TripTrackingOperationalItineraryProps = {
  stops: readonly TripStop[];
  tripStatus: TripStatusType;
  tripTimes?: TripScheduleTimes;
};

function visitBadgeVariant(
  visitState: "pending" | "at_stop" | "visited",
): "secondary" | "default" | "outline" {
  if (visitState === "visited") return "default";
  if (visitState === "at_stop") return "secondary";
  return "outline";
}

export function TripTrackingOperationalItinerary({
  stops,
  tripStatus,
  tripTimes,
}: TripTrackingOperationalItineraryProps) {
  const rows = buildTrackingItineraryRows(stops, tripTimes);
  const showHints = tripStatus === "in_progress";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-primary" />
          {trackingCopy.section.itinerary}
        </CardTitle>
        <CardDescription>
          {trackingCopy.hint.itinerary}
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[min(28rem,65vh)] space-y-2 overflow-y-auto pr-1">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{trackingCopy.state.noStops} en la ruta.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => {
              const { primary, secondary } = formatStopTimelineLabel(
                row.stop,
                row.displayOrder,
              );
              const roleHint = showHints ? getTrackingStopRoleHint(row.stop) : null;
              const Icon =
                row.visitState === "visited"
                  ? CircleCheck
                  : row.visitState === "at_stop"
                    ? CircleDot
                    : Circle;

              return (
                <li
                  key={row.stop.id}
                  className={cn(
                    "flex gap-3 rounded-md border p-3",
                    row.isActionTarget && showHints
                      ? "border-primary/40 bg-primary/5"
                      : "border-border",
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      row.visitState === "visited"
                        ? "text-primary"
                        : row.visitState === "at_stop"
                          ? "text-warning"
                          : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{primary}</span>
                      <Badge variant={visitBadgeVariant(row.visitState)} className="text-xs">
                        {row.visitLabel}
                      </Badge>
                      {row.isActionTarget && showHints ? (
                        <Badge variant="outline" className="text-xs border-primary/50">
                          Objetivo actual
                        </Badge>
                      ) : null}
                    </div>
                    {secondary ? (
                      <p className="text-xs text-muted-foreground">{secondary}</p>
                    ) : null}
                    {roleHint ? (
                      <p className="text-xs text-muted-foreground">{roleHint}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
