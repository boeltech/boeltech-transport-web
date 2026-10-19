import { Link } from "react-router-dom";
import { ArrowUpRight, Navigation } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { FleetVehiclePosition } from "../../domain";
import { GPS_STATUS_COLOR } from "../config/gpsStatusStyles";
import { monitoringCopy } from "../copy/monitoringCopy";
import { RelativeTime } from "./RelativeTime";

export interface VehiclePopoverContentProps {
  readonly position: FleetVehiclePosition;
}

/** Contenido del popover Mapbox (HTML montado vía React root en el marcador). */
export function VehiclePopoverContent({ position }: VehiclePopoverContentProps) {
  const copy = monitoringCopy.fleet;
  const colors = GPS_STATUS_COLOR[position.status];
  const modelLine = [position.vehicleBrand, position.vehicleModel]
    .filter(Boolean)
    .join(" ");
  const hasCoords =
    position.latitude != null && position.longitude != null;

  return (
    <div
      className="min-w-[220px] max-w-[260px] space-y-2.5 p-1 text-zinc-900"
      data-testid={`fleet-popover-${position.vehicleId}`}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
            colors.fill,
          )}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            {position.vehicleEconomicNumber}
            {modelLine ? (
              <span className="font-normal text-zinc-500"> · {modelLine}</span>
            ) : null}
          </p>
          <p className={cn("mt-0.5 text-[11px] font-medium", colors.labelClass)}>
            {copy.status[position.status]}
          </p>
        </div>
      </div>

      <div className="space-y-1 border-t border-zinc-200 pt-2 text-xs text-zinc-600">
        {hasCoords ? (
          <p className="font-mono tabular-nums">
            {position.latitude!.toFixed(4)}, {position.longitude!.toFixed(4)}
          </p>
        ) : (
          <p>{copy.noSignal}</p>
        )}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {position.speedKmh != null && hasCoords ? (
            <span>{copy.speed(position.speedKmh)}</span>
          ) : null}
          {position.courseDeg != null && position.status === "online" ? (
            <span className="inline-flex items-center gap-0.5">
              <Navigation className="h-3 w-3" aria-hidden />
              {copy.course(position.courseDeg)}
            </span>
          ) : null}
        </p>
        {position.recordedAt ? (
          <p>
            <RelativeTime iso={position.recordedAt} />
          </p>
        ) : null}
      </div>

      <Link
        to={`/vehicles/${position.vehicleId}`}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium text-success",
          "underline-offset-4 hover:underline",
        )}
      >
        {copy.viewVehicle}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
