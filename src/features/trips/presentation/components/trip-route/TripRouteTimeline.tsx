import { Link } from "react-router-dom";
import { Lock, Plus } from "lucide-react";

import { StopType, type TripStop } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";
import {
  getStopTypeBadgeClasses,
  getStopTypeConfig,
} from "@features/trips/presentation/uiHelpers";

import { TripStopAddressSingleLine } from "../TripStopAddressLines";
import { tripDetailCopy } from "../../copy";
import { trackingCopy } from "../../copy/tripDetail/trackingCopy";
import {
  getStopOperationalVisitLabel,
  getStopOperationalVisitState,
  getStopTimeDisplayRows,
  hasStopType,
  isDraftWaypointSlotId,
  isStopDomicilioComplete,
  isStopWaypointOperationComplete,
  type RouteMasterRow,
  type RouteStopCategory,
  type StopOperationalVisitState,
  type TripScheduleTimes,
} from "./tripRouteDetailHelpers";

const copy = tripDetailCopy.route;
const stopStatusCopy = trackingCopy.label.stopStatus;

function roleLabel(category: RouteStopCategory): string {
  if (category === "origin") return copy.section.origin;
  if (category === "destination") return copy.section.destination;
  return copy.composer.waypointSlot;
}

function visitBadgeVariant(
  state: StopOperationalVisitState,
): "success" | "info" | "secondary" | "warning" {
  if (state === "visited") return "success";
  if (state === "at_stop") return "info";
  if (state === "skipped") return "warning";
  return "secondary";
}

/** Artboard: Completada / En sitio / Pendiente (alineado a tracking stopStatus). */
function visitBadgeLabel(
  state: StopOperationalVisitState,
  category: RouteStopCategory,
): string {
  if (state === "visited") return stopStatusCopy.completed;
  if (state === "at_stop") return stopStatusCopy.in_progress;
  if (state === "skipped") {
    return getStopOperationalVisitLabel(state, category);
  }
  return stopStatusCopy.pending;
}

function stopTitle(row: RouteMasterRow): string {
  if (row.stop) {
    return (
      row.stop.locationName?.trim() ||
      row.stop.city?.trim() ||
      row.stop.address?.trim() ||
      copy.format.stopFallbackName(row.stop.sequenceOrder)
    );
  }
  return (
    row.draftLabel?.trim() ||
    (row.cityHint ? copy.composer.cityHint(row.cityHint) : copy.composer.emptySlot)
  );
}

function lockReasonLabel(
  visitState: StopOperationalVisitState | null,
): string {
  if (visitState === "at_stop") return copy.label.lockedInOperation;
  return copy.label.lockedOperated;
}

export type TripRouteTimelineProps = {
  rows: readonly RouteMasterRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddWaypoint: () => void;
  tripTimes?: TripScheduleTimes;
  showVisitState?: boolean;
  showMidTripReplan?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  canAddWaypoint?: boolean;
  addWaypointDisabledReason?: string | null;
  editingChip?: boolean;
  footerText: string;
  onEditStop?: (stop: TripStop) => void;
  onCompleteAddress?: (stop: TripStop) => void;
  onChangeDestination?: (stop: TripStop) => void;
  onRemoveWaypoint?: (stop: TripStop) => void;
  onRemoveDraftWaypoint?: (draftId: string) => void;
  onReorderUp?: (stop: TripStop) => void;
  onReorderDown?: (stop: TripStop) => void;
  canReorderStop?: (stop: TripStop) => {
    up: boolean;
    down: boolean;
  };
};

export function TripRouteTimeline({
  rows,
  selectedId,
  onSelect,
  onAddWaypoint,
  tripTimes,
  showVisitState = false,
  showMidTripReplan = false,
  disabled = false,
  readOnly = false,
  canAddWaypoint = true,
  addWaypointDisabledReason = null,
  editingChip = false,
  footerText,
  onEditStop,
  onCompleteAddress,
  onChangeDestination,
  onRemoveWaypoint,
  onRemoveDraftWaypoint,
  onReorderUp,
  onReorderDown,
  canReorderStop,
}: TripRouteTimelineProps) {
  const hint = showMidTripReplan ? copy.hint.stopsMidTrip : copy.hint.stops;
  const addDisabled = disabled || !canAddWaypoint || readOnly;

  return (
    <Card
      className="flex min-h-0 flex-col"
      data-route-composer-mode={showMidTripReplan ? "pending-only" : "full"}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold">
              {copy.section.stops}
              {editingChip ? (
                <Badge variant="info" tone="soft" className="font-normal">
                  {copy.chip.editing}
                </Badge>
              ) : null}
            </h3>
            <p className="text-sm text-muted-foreground">{hint}</p>
          </div>
          {!readOnly ? (
            <span
              className="inline-flex shrink-0"
              title={
                !canAddWaypoint
                  ? (addWaypointDisabledReason ?? copy.composer.needBothEnds)
                  : undefined
              }
            >
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={addDisabled}
                onClick={onAddWaypoint}
              >
                <Plus className="mr-2 h-4 w-4" />
                {copy.action.addWaypoint}
              </Button>
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 space-y-0 overflow-y-auto pb-2">
        {rows.map((row, index) => {
          const isLast = index === rows.length - 1;
          const next = rows[index + 1];
          const legKm =
            next?.stop != null &&
            next.stop.distanceFromPreviousKm != null &&
            next.stop.distanceFromPreviousKm > 0
              ? next.stop.distanceFromPreviousKm
              : null;
          return (
            <TripRouteTimelineStop
              key={row.id}
              row={row}
              displayOrder={index + 1}
              selected={selectedId === row.id}
              isLast={isLast}
              legKm={legKm}
              tripTimes={tripTimes}
              showVisitState={showVisitState}
              disabled={disabled}
              readOnly={readOnly}
              onSelect={onSelect}
              onEditStop={onEditStop}
              onCompleteAddress={onCompleteAddress}
              onChangeDestination={onChangeDestination}
              onRemoveWaypoint={onRemoveWaypoint}
              onRemoveDraftWaypoint={onRemoveDraftWaypoint}
              onReorderUp={onReorderUp}
              onReorderDown={onReorderDown}
              reorder={
                row.stop && canReorderStop ? canReorderStop(row.stop) : null
              }
            />
          );
        })}
      </CardContent>

      <CardFooter className="border-t pt-3 text-xs text-muted-foreground">
        {footerText}
      </CardFooter>
    </Card>
  );
}

type TripRouteTimelineStopProps = {
  row: RouteMasterRow;
  displayOrder: number;
  selected: boolean;
  isLast: boolean;
  legKm: number | null;
  tripTimes?: TripScheduleTimes;
  showVisitState: boolean;
  disabled: boolean;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onEditStop?: (stop: TripStop) => void;
  onCompleteAddress?: (stop: TripStop) => void;
  onChangeDestination?: (stop: TripStop) => void;
  onRemoveWaypoint?: (stop: TripStop) => void;
  onRemoveDraftWaypoint?: (draftId: string) => void;
  onReorderUp?: (stop: TripStop) => void;
  onReorderDown?: (stop: TripStop) => void;
  reorder: { up: boolean; down: boolean } | null;
};

function TripRouteTimelineStop({
  row,
  displayOrder,
  selected,
  isLast,
  legKm,
  tripTimes,
  showVisitState,
  disabled,
  readOnly,
  onSelect,
  onEditStop,
  onCompleteAddress,
  onChangeDestination,
  onRemoveWaypoint,
  onRemoveDraftWaypoint,
  onReorderUp,
  onReorderDown,
  reorder,
}: TripRouteTimelineStopProps) {
  const stop = row.stop;
  const category = row.category;
  const locked = Boolean(row.locked);
  const visitState =
    showVisitState && stop
      ? getStopOperationalVisitState(stop, category, tripTimes)
      : stop
        ? getStopOperationalVisitState(stop, category, tripTimes)
        : null;
  const showVisitBadge = showVisitState && visitState != null;
  const markerTone =
    visitState === "visited" || visitState === "at_stop"
      ? "active"
      : "pending";
  const timeRows = stop
    ? getStopTimeDisplayRows(stop, category, tripTimes)
    : [];
  const needsAddress = stop ? !isStopDomicilioComplete(stop) : false;
  const needsOperation = stop ? !isStopWaypointOperationComplete(stop) : false;
  const isDraft = !stop && isDraftWaypointSlotId(row.id);
  const showPickup = stop
    ? hasStopType(stop.stopType, StopType.PICKUP)
    : false;
  const showDelivery = stop
    ? hasStopType(stop.stopType, StopType.DELIVERY)
    : false;
  const canMutate = !readOnly && !locked;
  const showManageTracking =
    locked && showVisitState && visitState === "at_stop";
  const showChangeDestination =
    canMutate &&
    category === "destination" &&
    stop != null &&
    typeof onChangeDestination === "function";
  const showReorder =
    canMutate &&
    category === "waypoint" &&
    reorder != null &&
    (reorder.up || reorder.down);

  return (
    <div className="relative">
      <div
        className={cn(
          "relative flex gap-3 rounded-lg px-1 py-3 transition-colors",
          selected && "bg-muted/40",
        )}
      >
        <div className="relative flex w-8 shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={() => onSelect(row.id)}
            aria-pressed={selected}
            aria-label={`${roleLabel(category)}. ${stopTitle(row)}${
              locked ? `. ${copy.composer.lockedStop}` : ""
            }`}
            className={cn(
              "z-[1] flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              markerTone === "active"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40 bg-background text-muted-foreground",
            )}
          >
            {displayOrder}
          </button>
          {!isLast ? (
            <span
              className={cn(
                "absolute top-8 bottom-[-12px] w-0.5",
                markerTone === "active" ? "bg-primary/40" : "bg-border",
              )}
              aria-hidden
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 pb-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {roleLabel(category)}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {stopTitle(row)}
            </span>
            {showPickup ? (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-medium",
                  getStopTypeBadgeClasses(StopType.PICKUP),
                )}
              >
                {getStopTypeConfig(StopType.PICKUP).label}
              </span>
            ) : null}
            {showDelivery ? (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-medium",
                  getStopTypeBadgeClasses(StopType.DELIVERY),
                )}
              >
                {getStopTypeConfig(StopType.DELIVERY).label}
              </span>
            ) : null}
            {showVisitBadge && visitState ? (
              <Badge
                variant={visitBadgeVariant(visitState)}
                tone={visitState === "at_stop" ? "solid" : "soft"}
                className="ml-auto font-normal"
              >
                {visitBadgeLabel(visitState, category)}
              </Badge>
            ) : null}
            {!showVisitBadge && needsAddress ? (
              <Badge variant="warning" tone="soft" className="text-xs font-normal">
                {copy.chip.missingAddress}
              </Badge>
            ) : null}
            {!showVisitBadge && needsOperation ? (
              <Badge variant="warning" tone="soft" className="text-xs font-normal">
                {copy.chip.missingOperation}
              </Badge>
            ) : null}
          </div>

          {stop ? (
            <TripStopAddressSingleLine
              stop={stop}
              className="text-sm text-muted-foreground"
              hideWhenEmpty
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {row.cityHint
                ? copy.composer.cityHint(row.cityHint)
                : copy.composer.emptySlot}
            </p>
          )}

          {timeRows.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {timeRows.map((rowTime, i) => (
                <span key={`${rowTime.kind}-${rowTime.label}`}>
                  {i > 0 ? " · " : null}
                  <span className="font-medium text-foreground/80">
                    {rowTime.label}
                  </span>{" "}
                  {rowTime.value}
                </span>
              ))}
              {stop?.contactName ? (
                <>
                  {" · "}
                  {copy.label.contactPrefix} {stop.contactName}
                </>
              ) : null}
            </p>
          ) : null}

          {locked ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3" aria-hidden />
                {lockReasonLabel(visitState)}
              </span>
              {showManageTracking ? (
                <>
                  <span aria-hidden>·</span>
                  <Link
                    to="?tab=tracking"
                    className="font-medium text-primary hover:underline"
                  >
                    {copy.label.manageInTracking}
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}

          {canMutate && stop ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {needsAddress || needsOperation ? (
                onCompleteAddress ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onCompleteAddress(stop)}
                  >
                    {needsAddress
                      ? copy.action.completeAddress
                      : copy.action.editStop}
                  </Button>
                ) : null
              ) : onEditStop ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onEditStop(stop)}
                >
                  {copy.action.editStop}
                </Button>
              ) : null}

              {showChangeDestination ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onChangeDestination?.(stop)}
                >
                  {copy.action.changeDestination}
                </Button>
              ) : null}

              {showReorder ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled || !reorder!.up || !onReorderUp}
                    onClick={() => onReorderUp?.(stop)}
                    aria-label={copy.action.reorderUp}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled || !reorder!.down || !onReorderDown}
                    onClick={() => onReorderDown?.(stop)}
                    aria-label={copy.action.reorderDown}
                  >
                    ↓
                  </Button>
                </>
              ) : null}

              {category === "waypoint" && onRemoveWaypoint ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={disabled}
                  onClick={() => onRemoveWaypoint(stop)}
                >
                  {copy.action.removeWaypoint}
                </Button>
              ) : null}
            </div>
          ) : null}

          {isDraft && onRemoveDraftWaypoint ? (
            <div className="pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={disabled}
                onClick={() => onRemoveDraftWaypoint(row.id)}
              >
                {copy.action.removeDraftWaypoint}
              </Button>
            </div>
          ) : null}

          {!stop && !isDraft && canMutate ? (
            <p className="text-xs text-muted-foreground">
              {copy.hint.selectRow}
            </p>
          ) : null}
        </div>
      </div>

      {!isLast ? (
        <div className="ml-11 flex items-center gap-2 py-1 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">
            {legKm != null
              ? copy.format.distanceKm(
                  legKm.toLocaleString("es-MX", { maximumFractionDigits: 1 }),
                )
              : "—"}
          </span>
          <span aria-hidden>·</span>
          <a
            href="#trip-route-map"
            className="hover:text-foreground hover:underline"
          >
            {copy.label.mapLink}
          </a>
        </div>
      ) : null}
    </div>
  );
}
