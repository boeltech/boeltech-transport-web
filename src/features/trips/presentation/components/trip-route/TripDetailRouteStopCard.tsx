import { Flag, MapPin, Navigation } from "lucide-react";

import { StopType, type TripStop } from "@features/trips/domain";
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
  routeStopCardBorderClass,
  type RouteStopCategory,
} from "./tripRouteDetailHelpers";

const copy = tripDetailCopy.route;

export interface TripDetailRouteStopCardProps {
  stop: TripStop;
  onCompleteAddress?: () => void;
  onEditStop?: () => void;
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
}: TripDetailRouteStopCardProps) {
  const category = getRouteStopCategory(stop);
  const needsAddress = !isStopDomicilioComplete(stop);
  const showPickup = hasStopType(stop.stopType, StopType.PICKUP);
  const showDelivery = hasStopType(stop.stopType, StopType.DELIVERY);
  const showOperations = category === "waypoint" && (showPickup || showDelivery);

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

        {needsAddress && onCompleteAddress ? (
          <Button type="button" size="sm" variant="outline" onClick={onCompleteAddress}>
            {copy.action.completeAddress}
          </Button>
        ) : !needsAddress && onEditStop ? (
          <Button type="button" size="sm" variant="outline" onClick={onEditStop}>
            {copy.action.editStop}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
