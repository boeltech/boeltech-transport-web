import { Check } from "lucide-react";

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

/** NS4 — Reserva: Para programar. */
const DRAFT_SCHEDULE_IDS: readonly TripReadinessCheckId[] = [
  "order",
  "fleet",
  "departure",
  "arrival",
  "rate",
  "mileage",
];

/** NS4 — Reserva: Para completar. */
const DRAFT_OPERATE_IDS: readonly TripReadinessCheckId[] = ["route", "cargo"];

/** NS4 — Programado: Para iniciar. */
const SCHEDULED_START_IDS: readonly TripReadinessCheckId[] = [
  "route",
  "fleet",
  "mileage",
];

/** NS4 — Programado: Para completar. */
const SCHEDULED_OPERATE_IDS: readonly TripReadinessCheckId[] = ["cargo"];

export interface TripReadinessRailProps {
  status: TripStatusType;
  items: readonly TripReadinessItem[];
  clientName?: string | null;
  originCity?: string | null;
  destinationCity?: string | null;
  onItemClick?: (item: TripReadinessItem) => void;
  /**
   * CTA de navegación a Seguimiento en el rail.
   * Con next-step block (F2) el caller omite este prop para no competir.
   */
  onGoToTracking?: () => void;
  /**
   * `secondary` (default F2): checklist de apoyo, sin sombra ni peso de card primaria.
   */
  emphasis?: "primary" | "secondary";
  /**
   * F8 / D15: `card` = standalone «Reserva guardada» / «Viaje programado».
   * `checklist` = solo grupos Para programar / Para iniciar / Para completar.
   */
  presentation?: "card" | "checklist";
}

function chipLabel(item: TripReadinessItem): string {
  if (item.id === "cargo" && !item.done && item.tab === "route") {
    return copy.readiness.cargoNeedsPickup;
  }
  return READINESS_LABELS[item.id];
}

function pickItems(
  items: readonly TripReadinessItem[],
  ids: readonly TripReadinessCheckId[],
): TripReadinessItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids
    .map((id) => byId.get(id))
    .filter((item): item is TripReadinessItem => item != null);
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
  // NS5: solo pendientes clicables; listos no navegan.
  const clickable = Boolean(!item.done && item.tab && onItemClick);
  const className = cn(
    "inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 py-0 pl-2 text-xs font-medium",
    item.done
      ? "border-border bg-card text-muted-foreground"
      : "border-warning bg-warning-soft text-warning-soft-foreground",
    clickable && "cursor-pointer hover:opacity-90",
  );

  const content = (
    <>
      {item.done ? (
        <Check className="h-3 w-3 text-success" aria-hidden />
      ) : (
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px] border-current"
          aria-hidden
        />
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
          data-testid={`trip-readiness-chip-${item.id}`}
          data-ready="false"
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li>
      <span
        className={className}
        aria-label={`${label}: ${stateLabel}`}
        data-testid={`trip-readiness-chip-${item.id}`}
        data-ready={item.done ? "true" : "false"}
      >
        {content}
      </span>
    </li>
  );
}

function GroupHeading({
  label,
  hint,
}: {
  label: string;
  hint?: string;
}) {
  return (
    <h3 className="text-xs font-semibold text-foreground">
      {label}
      {hint ? (
        <span className="font-normal text-muted-foreground">{` · ${hint}`}</span>
      ) : null}
    </h3>
  );
}

function ReadinessChipGroups({
  isDraft,
  primaryItems,
  operateItems,
  onItemClick,
}: {
  isDraft: boolean;
  primaryItems: readonly TripReadinessItem[];
  operateItems: readonly TripReadinessItem[];
  onItemClick?: (item: TripReadinessItem) => void;
}) {
  const primaryLabel = isDraft
    ? copy.readiness.scheduleGroup
    : copy.readiness.startGroup;
  const operateHint = isDraft
    ? copy.readiness.operateHint
    : copy.readiness.operateHintScheduled;

  return (
    <div className="flex flex-wrap gap-6">
      {primaryItems.length > 0 ? (
        <section className="flex min-w-0 flex-col gap-1.5">
          <GroupHeading label={primaryLabel} />
          <ol
            className="flex flex-wrap gap-2"
            aria-label={primaryLabel}
          >
            {primaryItems.map((item) => (
              <ReadinessChip
                key={item.id}
                item={item}
                onItemClick={onItemClick}
              />
            ))}
          </ol>
        </section>
      ) : null}

      {operateItems.length > 0 ? (
        <section className="flex min-w-0 flex-col gap-1.5">
          <GroupHeading
            label={copy.readiness.operateGroup}
            hint={operateHint}
          />
          <ol
            className="flex flex-wrap gap-2"
            aria-label={`${copy.readiness.operateGroup} · ${operateHint}`}
          >
            {operateItems.map((item) => (
              <ReadinessChip
                key={item.id}
                item={item}
                onItemClick={onItemClick}
              />
            ))}
          </ol>
        </section>
      ) : null}
    </div>
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
  emphasis = "secondary",
  presentation = "card",
}: TripReadinessRailProps) {
  const isDraft = status === TripStatus.DRAFT;
  const isScheduled = status === TripStatus.SCHEDULED;
  if (!isDraft && !isScheduled) {
    return null;
  }

  const primaryItems = pickItems(
    items,
    isDraft ? DRAFT_SCHEDULE_IDS : SCHEDULED_START_IDS,
  );
  const operateItems = pickItems(
    items,
    isDraft ? DRAFT_OPERATE_IDS : SCHEDULED_OPERATE_IDS,
  );

  if (presentation === "checklist") {
    return (
      <div data-testid="trip-readiness-checklist">
        <ReadinessChipGroups
          isDraft={isDraft}
          primaryItems={primaryItems}
          operateItems={operateItems}
          onItemClick={onItemClick}
        />
      </div>
    );
  }

  const scheduleItems = pickItems(items, DRAFT_SCHEDULE_IDS);
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
  const isSecondary = emphasis === "secondary";

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        isSecondary
          ? "border-border/70 bg-muted/30 shadow-none"
          : "border-border bg-card shadow-sm",
      )}
      data-testid="trip-readiness-rail"
      data-emphasis={emphasis}
    >
      <p
        className={cn(
          isSecondary
            ? "text-xs font-medium text-muted-foreground"
            : "text-sm font-semibold text-foreground",
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "mt-1 text-sm",
          isSecondary ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {summary}
      </p>
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

      <div className="mt-3">
        <ReadinessChipGroups
          isDraft={isDraft}
          primaryItems={primaryItems}
          operateItems={operateItems}
          onItemClick={onItemClick}
        />
      </div>
    </div>
  );
}
