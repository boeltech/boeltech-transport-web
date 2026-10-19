import type { FleetHistoryPoint } from "../../domain";
import { monitoringCopy } from "../copy/monitoringCopy";
import { addressDisplay } from "../utils/addressDisplay";
import { formatAbsoluteTime } from "../utils/formatAbsoluteTime";
import { formatCardinalHeading } from "../utils/cardinalHeading";
import { movementLabel } from "../utils/movementLabel";
import { cn } from "@shared/lib/utils/cn";
import type { GpsAddressStatusType } from "../../domain";

export interface HistoryPointDetailCardProps {
  readonly point: FleetHistoryPoint | null;
  readonly address: string | null | undefined;
  readonly addressStatus: GpsAddressStatusType | null | undefined;
  readonly addressLoading?: boolean;
  readonly className?: string;
}

export function HistoryPointDetailCard({
  point,
  address,
  addressStatus,
  addressLoading = false,
  className,
}: HistoryPointDetailCardProps) {
  const copy = monitoringCopy.history.detail;
  const parity = monitoringCopy.parity;

  if (!point) return null;

  const heading = formatCardinalHeading(point.courseDeg);
  const movement = movementLabel(point.movementStatus, {
    moving: parity.movement.moving,
    stopped: parity.movement.stopped,
    empty: parity.empty,
  });
  const resolvedAddress = addressLoading
    ? copy.addressLoading
    : addressDisplay(
        address ?? null,
        addressStatus ?? "unavailable",
        parity.addressUnavailable,
      );

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-white/10 bg-zinc-900/80 p-3 text-xs text-zinc-300",
        className,
      )}
      data-testid="history-point-detail"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {copy.title} · #{point.seq}
      </p>
      <p className="text-sm font-medium text-zinc-100">
        {formatAbsoluteTime(point.recordedAt)}
      </p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <div>
          <dt className="text-zinc-500">{copy.coords}</dt>
          <dd className="font-mono tabular-nums">
            {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">{copy.speed}</dt>
          <dd>
            {point.speedKmh != null
              ? `${Math.round(point.speedKmh)} km/h`
              : parity.empty}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">{copy.course}</dt>
          <dd>{heading?.label ?? parity.empty}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">{copy.movement}</dt>
          <dd>{movement}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">{copy.sats}</dt>
          <dd>
            {point.satellites != null ? point.satellites : parity.empty}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">{copy.battery}</dt>
          <dd>
            {point.batteryPct != null
              ? parity.batteryPct(point.batteryPct)
              : parity.empty}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-zinc-500">{copy.odometer}</dt>
          <dd>
            {point.odometerKm != null
              ? parity.odometerKm(point.odometerKm)
              : parity.empty}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-zinc-500">{copy.address}</dt>
          <dd className="leading-snug text-zinc-200">
            {resolvedAddress ?? parity.empty}
          </dd>
        </div>
      </dl>
    </div>
  );
}
