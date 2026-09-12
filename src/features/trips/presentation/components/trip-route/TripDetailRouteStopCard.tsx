import { Flag, MapPin, Navigation } from "lucide-react";

import { StopType, type TripStop } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import {
  getStopTypeBadgeClasses,
  getStopTypeConfig,
} from "@features/trips/presentation/uiHelpers";

import { TripDetailRouteStopAddress } from "../TripStopAddressLines";
import { tripDetailCopy } from "../../copy";
import {
  getRouteStopCategory,
  hasStopType,
  isStopDomicilioComplete,
  isStopWaypointOperationComplete,
  routeStopCardBorderClass,
  type RouteStopCategory,
} from "./tripRouteDetailHelpers";

const copy = tripDetailCopy.route;

export interface TripDetailRouteStopCardProps {
  stop: TripStop;
  onCompleteAddress?: () => void;
  onEditStop?: () => void;
  /** Solo escalas: dispara el flujo de confirmación/bloqueo en el padre. */
  onRemoveWaypoint?: () => void;
  onReorderUp?: () => void;
  onReorderDown?: () => void;
  reorderUpDisabled?: boolean;
  reorderDownDisabled?: boolean;
}

function StopCategoryIcon({
  category,
  className,
}: {
  category: RouteStopCategory;
  className?: string;
}) {
  if (category === "origin") {
    return <Navigation className={cn("h-5 w-5 text-success", className)} />;
  }
  if (category === "destination") {
    return <Flag className={cn("h-5 w-5 text-destructive", className)} />;
  }
  return <MapPin className={cn("h-5 w-5 text-muted-foreground", className)} />;
}

export function TripDetailRouteStopCard({
  stop,
  onCompleteAddress,
  onEditStop,
  onRemoveWaypoint,
  onReorderUp,
  onReorderDown,
  reorderUpDisabled,
  reorderDownDisabled,
}: TripDetailRouteStopCardProps) {
  const category = getRouteStopCategory(stop);
  const needsAddress = !isStopDomicilioComplete(stop);
  const needsOperation = !isStopWaypointOperationComplete(stop);
  const showPickup = hasStopType(stop.stopType, StopType.PICKUP);
  const showDelivery = hasStopType(stop.stopType, StopType.DELIVERY);
  const showOperations = category === "waypoint" && (showPickup || showDelivery);
  const openSheetForIncomplete =
    (needsAddress || needsOperation) && onCompleteAddress;
  const openSheetForEdit =
    !needsAddress && !needsOperation && onEditStop;
  const showRemove =
    category === "waypoint" && typeof onRemoveWaypoint === "function";
  const showReorder =
    category === "waypoint" &&
    (typeof onReorderUp === "function" || typeof onReorderDown === "function");

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 transition-colors",
        routeStopCardBorderClass(category),
      )}
    >
      <StopCategoryIcon category={category} className="mt-0.5 shrink-0" />

      <div className="min-w-0 flex-1 space-y-3">
        {showOperations ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {showPickup ? (
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-medium",
                  getStopTypeBadgeClasses(StopType.PICKUP),
                )}
              >
                {getStopTypeConfig(StopType.PICKUP).label}
              </span>
            ) : null}
            {showDelivery ? (
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-medium",
                  getStopTypeBadgeClasses(StopType.DELIVERY),
                )}
              >
                {getStopTypeConfig(StopType.DELIVERY).label}
              </span>
            ) : null}
          </div>
        ) : null}

        {needsOperation ? (
          <Badge variant="warning" tone="soft" className="text-xs font-normal">
            {copy.chip.missingOperation}
          </Badge>
        ) : null}

        <TripDetailRouteStopAddress stop={stop} />

        {category !== "origin" ? (
          stop.distanceFromPreviousKm != null ? (
            <p className="text-xs tabular-nums text-muted-foreground">
              {copy.format.distanceKm(
                stop.distanceFromPreviousKm.toLocaleString("es-MX"),
              )}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {copy.state.missingDistance}
            </p>
          )
        ) : null}

        {stop.contactName ? (
          <p className="text-xs text-muted-foreground">
            {copy.label.contactPrefix} {stop.contactName}
            {stop.contactPhone ? ` · ${stop.contactPhone}` : ""}
          </p>
        ) : null}

        {stop.notes ? (
          <p className="text-xs text-muted-foreground">
            {copy.label.notePrefix} {stop.notes}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {openSheetForIncomplete ? (
            <Button type="button" size="sm" variant="outline" onClick={onCompleteAddress}>
              {needsAddress
                ? copy.action.completeAddress
                : copy.action.editStop}
            </Button>
          ) : openSheetForEdit ? (
            <Button type="button" size="sm" variant="outline" onClick={onEditStop}>
              {copy.action.editStop}
            </Button>
          ) : null}

          {showReorder ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={reorderUpDisabled || !onReorderUp}
                onClick={onReorderUp}
                aria-label={copy.action.reorderUp}
              >
                ↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={reorderDownDisabled || !onReorderDown}
                onClick={onReorderDown}
                aria-label={copy.action.reorderDown}
              >
                ↓
              </Button>
            </>
          ) : null}

          {showRemove ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onRemoveWaypoint}
            >
              {copy.action.removeWaypoint}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
