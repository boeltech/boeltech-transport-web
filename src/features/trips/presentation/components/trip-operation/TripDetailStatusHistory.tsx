import { FileText, History } from "lucide-react";

import {
  TRIP_STATUS_LABELS,
  type TripStatusHistory,
  type TripStatusType,
} from "@features/trips/domain";
import { formatMileage } from "@features/trips";
import { cn } from "@shared/lib/utils/cn";
import { formatDateTime } from "@shared/utils/dateUtils";
import { Card, CardContent } from "@shared/ui/card";
import { DetailTimeline } from "@shared/ui/data-display";

import { getTripStatusConfig } from "../../config/tripStatusConfig";
import { tripDetailCopy } from "../../copy";

const history = tripDetailCopy.history;

export interface TripDetailStatusHistoryProps {
  entries: readonly TripStatusHistory[] | undefined;
}

export function TripDetailStatusHistory({
  entries,
}: TripDetailStatusHistoryProps) {
  const items = entries ?? [];

  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        <History className="h-4 w-4 shrink-0 text-muted-foreground" />
        {history.section.statusHistory}
        <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">
          {history.action.expand}
        </span>
        <span className="ml-auto text-xs font-normal text-muted-foreground hidden group-open:inline">
          {history.action.collapse}
        </span>
      </summary>
      <div className="border-t px-4 py-3">
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {history.state.empty}
          </p>
        ) : (
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <DetailTimeline
                items={items.map((entry) => {
                  const statusConfig = getTripStatusConfig(
                    entry.newStatus as TripStatusType,
                  );
                  const StatusIcon = statusConfig?.icon || FileText;
                  const previousStatusLabel = entry.previousStatus
                    ? TRIP_STATUS_LABELS[
                        entry.previousStatus as TripStatusType
                      ] || entry.previousStatus
                    : null;

                  return {
                    id: entry.id,
                    icon: (
                      <StatusIcon
                        className={cn(
                          "h-4 w-4",
                          statusConfig?.textColor || "text-muted-foreground",
                        )}
                      />
                    ),
                    dotBgClassName:
                      statusConfig?.bgColor || "bg-muted",
                    content: (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {TRIP_STATUS_LABELS[
                              entry.newStatus as TripStatusType
                            ] || entry.newStatus}
                          </span>
                          {previousStatusLabel ? (
                            <span className="text-xs text-muted-foreground">
                              {history.label.fromStatus(previousStatusLabel)}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(entry.changedAt.toISOString())}
                          {entry.changedByName &&
                            ` • ${entry.changedByName}`}
                        </p>
                        {entry.reason ? (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            {entry.reason}
                          </p>
                        ) : null}
                        {entry.mileage != null ? (
                          <p className="text-xs text-muted-foreground">
                            {history.format.mileageLine(
                              formatMileage(entry.mileage),
                            )}
                          </p>
                        ) : null}
                      </div>
                    ),
                  };
                })}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </details>
  );
}
