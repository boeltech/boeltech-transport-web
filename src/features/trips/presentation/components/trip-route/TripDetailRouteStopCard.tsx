import {
  Clock,
  FileText,
  Flag,
  MapPin,
  Navigation,
  Package,
  Pencil,
  Phone,
  User,
} from "lucide-react";

import { StopType, type TripStatusType, type TripStop } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import {
  getStopTypeBadgeClasses,
  getStopTypeConfig,
} from "@features/trips/presentation/uiHelpers";

import { TripStopAddressLines } from "../TripStopAddressLines";
import { tripDetailCopy } from "../../copy";
import {
  formatDistanceSourceLabel,
  getRouteStopCategory,
  getStopOperationalVisitLabel,
  getStopOperationalVisitState,
  getStopTimeDisplayRows,
  routeStopCardBorderClass,
  shouldShowTrackingHint,
  stopUsesSavedAddress,
  type RouteStopCategory,
  type TripScheduleTimes,
} from "./tripRouteDetailHelpers";

const copy = tripDetailCopy.route;

export interface TripDetailRouteStopCardProps {
  stop: TripStop;
  displayOrder: number;
  tripStatus: TripStatusType;
  tripTimes?: TripScheduleTimes;
  canEdit?: boolean;
  onEdit?: () => void;
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
  displayOrder,
  tripStatus,
  tripTimes,
  canEdit = false,
  onEdit,
}: TripDetailRouteStopCardProps) {
  const category = getRouteStopCategory(stop);
  const visitState = getStopOperationalVisitState(stop, category, tripTimes);
  const visitLabel = getStopOperationalVisitLabel(visitState);
  const timeRows = getStopTimeDisplayRows(stop, category, tripTimes);
  const stopTypes = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];
  const distanceSource = formatDistanceSourceLabel(stop.distanceSource);
  const isVisitedForTracking = visitState === "visited";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 transition-colors",
        routeStopCardBorderClass(category),
      )}
    >
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <span className="text-xs font-semibold text-muted-foreground">
          {copy.format.stopOrderHash(displayOrder)}
        </span>
      </div>

      <StopCategoryIcon category={category} className="shrink-0" />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex w-full flex-wrap items-center gap-x-1.5 gap-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {stopTypes.map((type) => {
              const config = getStopTypeConfig(type);
              return (
                <span
                  key={type}
                  className={cn(
                    "rounded px-2 py-0.5 text-xs font-medium",
                    getStopTypeBadgeClasses(type),
                  )}
                >
                  {config.label}
                </span>
              );
            })}
            {stopUsesSavedAddress(stop) ? (
              <Badge
                variant="outline"
                className="border-success/30 text-xs text-success-soft-foreground"
              >
                <FileText className="mr-1 h-3 w-3" />
                {copy.label.savedAddress}
              </Badge>
            ) : null}
            {stop.sequenceOrder > 1 && stop.distanceFromPreviousKm != null ? (
              <Badge variant="outline" className="text-xs font-normal">
                {copy.format.distanceSegment(
                  distanceSource ?? copy.label.distanceFallback,
                  stop.distanceFromPreviousKm.toLocaleString("es-MX"),
                )}
              </Badge>
            ) : null}
          </div>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            <Badge
              variant={visitState === "visited" ? "default" : "secondary"}
              className="font-normal"
            >
              {visitLabel}
            </Badge>
            {shouldShowTrackingHint(tripStatus, isVisitedForTracking) ? (
              <Badge variant="outline" className="text-xs">
                {copy.label.manageInTracking}
              </Badge>
            ) : null}
            {canEdit && onEdit ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 gap-1 px-2 text-xs"
                onClick={onEdit}
              >
                <Pencil className="h-3 w-3" />
                {copy.action.quickEdit}
              </Button>
            ) : null}
          </div>
        </div>

        <TripStopAddressLines
          stop={stop}
          primaryClassName="truncate text-sm font-semibold"
          secondaryClassName="text-xs text-muted-foreground"
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {timeRows.map((row) => (
            <span key={`${row.kind}-${row.label}`} className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {row.label}: {row.value}
            </span>
          ))}
        </div>

        {category === "origin" ? (
          <p className="text-xs text-muted-foreground">{copy.hint.originDeparture}</p>
        ) : null}

        {stop.rfcRemitenteDestinatario ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            {stop.rfcRemitenteDestinatario}
            {stop.nombreRemitenteDestinatario
              ? ` — ${stop.nombreRemitenteDestinatario}`
              : ""}
          </p>
        ) : null}

        {stop.contactName ? (
          <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            {stop.contactName}
            {stop.contactPhone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {stop.contactPhone}
              </span>
            ) : null}
          </p>
        ) : null}

        {stop.cargoActionDescription ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5 shrink-0" />
            {stop.cargoActionDescription}
          </p>
        ) : null}

        {stop.notes ? (
          <p className="text-xs italic text-muted-foreground">
            {copy.label.notePrefix} {stop.notes}
          </p>
        ) : null}

        {!stop.rfcRemitenteDestinatario &&
        (stopTypes.includes(StopType.ORIGIN) ||
          stopTypes.includes(StopType.DESTINATION) ||
          stopTypes.includes(StopType.PICKUP) ||
          stopTypes.includes(StopType.DELIVERY)) ? (
          <p className="text-xs text-warning-soft-foreground">{copy.hint.pendingRfc}</p>
        ) : null}
      </div>
    </div>
  );
}
