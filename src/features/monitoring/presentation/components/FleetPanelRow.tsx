import { cn } from "@shared/lib/utils/cn";
import type { FleetVehiclePosition } from "../../domain";
import { GPS_STATUS_COLOR } from "../config/gpsStatusStyles";
import { monitoringCopy } from "../copy/monitoringCopy";
import { RelativeTime } from "./RelativeTime";

export interface FleetPanelRowProps {
  readonly position: FleetVehiclePosition;
  readonly selected: boolean;
  readonly onSelect: (position: FleetVehiclePosition) => void;
}

export function FleetPanelRow({
  position,
  selected,
  onSelect,
}: FleetPanelRowProps) {
  const copy = monitoringCopy.fleet;
  const colors = GPS_STATUS_COLOR[position.status];
  const modelLine = [position.vehicleBrand, position.vehicleModel]
    .filter(Boolean)
    .join(" ");
  const hasCoords =
    position.latitude != null && position.longitude != null;
  const speedLabel =
    position.speedKmh != null && hasCoords
      ? copy.speed(position.speedKmh)
      : copy.noSignal;

  return (
    <button
      type="button"
      onClick={() => onSelect(position)}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        "hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/60",
        selected ? "bg-white/12 ring-1 ring-white/15" : "bg-transparent",
      )}
      data-testid={`fleet-panel-row-${position.vehicleId}`}
    >
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2",
          colors.fill,
          colors.ring,
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold tracking-tight text-zinc-50">
            {position.vehicleEconomicNumber}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
            {hasCoords && position.recordedAt ? (
              <RelativeTime iso={position.recordedAt} />
            ) : (
              copy.noSignal
            )}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-zinc-400">
          {modelLine || position.vehiclePlate}
        </span>
        <span className="mt-1 block text-[11px] tabular-nums text-zinc-500">
          {speedLabel}
          {position.vehiclePlate ? ` · ${position.vehiclePlate}` : null}
        </span>
      </span>
    </button>
  );
}
