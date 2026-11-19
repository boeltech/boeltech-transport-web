import { useState } from "react";

import {
  TRIP_STATUS_LABELS,
  type TripStatusHistory,
  type TripStatusType,
} from "@features/trips/domain";
import { formatDateTime } from "@shared/utils/dateUtils";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";

const history = tripDetailCopy.history;
const PREVIEW_COUNT = 4;

export interface TripResumenActivityRailProps {
  entries: readonly TripStatusHistory[] | undefined;
}

function activityTitle(entry: TripStatusHistory): string {
  const label =
    TRIP_STATUS_LABELS[entry.newStatus as TripStatusType] || entry.newStatus;
  if (!entry.previousStatus) {
    return history.format.createdAs(label);
  }
  return history.format.passedTo(label);
}

export function TripResumenActivityRail({
  entries,
}: TripResumenActivityRailProps) {
  const [expanded, setExpanded] = useState(false);
  const items = entries ?? [];
  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);
  const canExpand = items.length > PREVIEW_COUNT;

  return (
    <Card data-testid="trip-resumen-activity-rail">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{history.section.activity}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{history.state.empty}</p>
        ) : (
          <ol className="space-y-3">
            {visible.map((entry, index) => (
              <li key={entry.id} className="relative pl-4">
                <span
                  className={cn(
                    "absolute left-0 top-1.5 h-2 w-2 rounded-full",
                    index === 0 ? "bg-primary" : "bg-muted-foreground/40",
                  )}
                  aria-hidden
                />
                <p className="text-sm font-medium leading-snug">
                  {activityTitle(entry)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(entry.changedAt.toISOString())}
                  {entry.changedByName ? ` · ${entry.changedByName}` : null}
                </p>
                {entry.reason ? (
                  <p className="mt-0.5 text-xs italic text-muted-foreground">
                    {entry.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
        {canExpand && !expanded ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 text-xs"
            onClick={() => setExpanded(true)}
          >
            {history.action.viewAll}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
