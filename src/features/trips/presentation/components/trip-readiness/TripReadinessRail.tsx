import { Check, Circle } from "lucide-react";

import { TripStatus, type TripStatusType } from "@features/trips/domain";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";
import type {
  TripReadinessCheckId,
  TripReadinessItem,
} from "../../hooks/useTripReadiness";

const copy = tripDetailCopy.shell;

const READINESS_LABELS: Record<TripReadinessCheckId, string> = {
  order: copy.readiness.order,
  fleet: copy.readiness.fleet,
  departure: copy.readiness.departure,
  arrival: copy.readiness.arrival,
  rate: copy.readiness.rate,
  mileage: copy.readiness.mileage,
  route: copy.readiness.route,
  cargo: copy.readiness.cargo,
};

const RAIL_IDS: readonly TripReadinessCheckId[] = [
  "fleet",
  "departure",
  "arrival",
  "rate",
  "mileage",
  "route",
  "cargo",
];

export interface TripReadinessRailProps {
  status: TripStatusType;
  items: readonly TripReadinessItem[];
  clientName?: string | null;
  originCity?: string | null;
  destinationCity?: string | null;
  onItemClick?: (item: TripReadinessItem) => void;
  onGoToTracking?: () => void;
}

function chipLabel(item: TripReadinessItem): string {
  if (item.id === "cargo" && !item.done && item.tab === "route") {
    return copy.readiness.cargoNeedsPickup;
  }
  return READINESS_LABELS[item.id];
}

function ReadinessChip({
  item,
  onItemClick,
}: {
  item: TripReadinessItem;
  onItemClick?: (item: TripReadinessItem) => void;
}) {
  const label = chipLabel(item);
  const stateLabel = item.done
    ? copy.readiness.done
    : copy.readiness.pending;
  const clickable = Boolean(item.tab && onItemClick);
  const className = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
    item.done
      ? "border-success/30 bg-success-soft text-success-soft-foreground"
      : "border-border bg-muted/60 text-muted-foreground",
    clickable && "cursor-pointer hover:border-primary/40",
  );

  const content = (
    <>
      {item.done ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Circle className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </>
  );

  if (clickable) {
    return (
      <li>
        <button
          type="button"
          className={className}
          onClick={() => onItemClick?.(item)}
          aria-label={`${label}: ${stateLabel}`}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li>
      <span className={className} aria-label={`${label}: ${stateLabel}`}>
        {content}
      </span>
    </li>
  );
}

export function TripReadinessRail({
  status,
  items,
  clientName,
  originCity,
  destinationCity,
  onItemClick,
  onGoToTracking,
}: TripReadinessRailProps) {
  const isDraft = status === TripStatus.DRAFT;
  const isScheduled = status === TripStatus.SCHEDULED;
  if (!isDraft && !isScheduled) {
    return null;
  }

  const visible = items.filter((item) => RAIL_IDS.includes(item.id));
  const scheduleItems = visible.filter((item) => item.group === "schedule");
  const operateItems = visible.filter((item) => item.group === "operate");
  const missing = scheduleItems
    .filter((item) => !item.done)
    .map((item) => READINESS_LABELS[item.id]);
  const routeReady = items.some((item) => item.id === "route" && item.done);
  const client = clientName?.trim() || copy.readiness.fallbackClient;
  const origin = originCity?.trim();
  const destination = destinationCity?.trim();
  const route =
    origin && destination
      ? `${origin} → ${destination}`
      : copy.readiness.fallbackRoute;
  const summary = isScheduled
    ? routeReady
      ? copy.readiness.readyToStart(client, route)
      : copy.readiness.missingToStart(client, route)
    : missing.length === 0
      ? copy.readiness.readyToConfirm(client, route)
      : copy.readiness.missingToSchedule(client, route, missing.join(", "));
  const title = isScheduled
    ? copy.readiness.titleScheduled
    : copy.readiness.title;

  return (
    <div
      className="rounded-xl border bg-card px-4 py-3 shadow-sm"
      data-testid="trip-readiness-rail"
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-foreground">{summary}</p>
      {isScheduled && onGoToTracking ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-1 h-auto px-0"
          onClick={onGoToTracking}
        >
          {copy.readiness.goToTracking}
        </Button>
      ) : null}

      {isDraft ? (
        <section className="mt-3">
          <h3 className="text-xs font-semibold text-foreground">
            {copy.readiness.scheduleGroup}
          </h3>
          <ol
            className="mt-2 flex flex-wrap gap-2"
            aria-label={copy.readiness.scheduleGroup}
          >
            {scheduleItems.map((item) => (
              <ReadinessChip key={item.id} item={item} onItemClick={onItemClick} />
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-3">
        <h3 className="text-xs font-semibold text-foreground">
          {copy.readiness.operateGroup}
        </h3>
        <ol
          className="mt-2 flex flex-wrap gap-2"
          aria-label={copy.readiness.operateGroup}
        >
          {operateItems.map((item) => (
            <ReadinessChip key={item.id} item={item} onItemClick={onItemClick} />
          ))}
        </ol>
      </section>
    </div>
  );
}
