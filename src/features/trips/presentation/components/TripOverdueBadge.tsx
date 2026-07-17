import { Clock } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import type { TripListItem } from "../../domain";
import { tripsListCopy } from "../copy/listCopy";
import { getTripOverdueState } from "../utils/tripOverdue";

interface TripOverdueBadgeProps {
  trip: Pick<TripListItem, "status" | "scheduledArrival">;
  className?: string;
}

export function TripOverdueBadge({ trip, className }: TripOverdueBadgeProps) {
  const overdue = getTripOverdueState(trip);
  if (!overdue.isOverdue) {
    return null;
  }

  return (
    <Badge
      variant={overdue.severity === "error" ? "destructive" : "warning"}
      tone="soft"
      className={className}
    >
      <Clock className="mr-1 h-3 w-3" />
      {tripsListCopy.badge.overdue(overdue.hoursOverdue)}
    </Badge>
  );
}
