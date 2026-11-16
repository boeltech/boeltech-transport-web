import { Link } from "react-router-dom";

import { useGpsDevice } from "@features/monitoring/application";
import { fleetMapFocusPath } from "@features/monitoring/domain";
import { GPS_STATUS_COLOR } from "@features/monitoring/presentation/config/gpsStatusStyles";
import { monitoringCopy } from "@features/monitoring/presentation/copy/monitoringCopy";
import { RelativeTime } from "@features/monitoring/presentation";

const POLL_MS = 30_000;

export interface TripResumenFleetGpsStatusProps {
  readonly vehicleId: string | null | undefined;
}

/**
 * Estado GPS compacto dentro de Flota (D6) — sin card propia.
 * Oculto si no hay device vinculado (Q7: no inventar señal).
 */
export function TripResumenFleetGpsStatus({
  vehicleId,
}: TripResumenFleetGpsStatusProps) {
  const query = useGpsDevice(vehicleId ?? "", {
    enabled: Boolean(vehicleId),
    refetchInterval: POLL_MS,
  });

  if (!vehicleId) return null;
  if (query.isPending || query.isLoading) return null;
  if (query.isError || !query.data?.linked) return null;

  const pos = query.data.lastPosition;
  if (!pos) {
    return (
      <p className="text-xs text-muted-foreground">
        {monitoringCopy.overlay.waitingSignal}
      </p>
    );
  }

  const statusLabel = monitoringCopy.fleet.status[pos.status];
  const statusClass = GPS_STATUS_COLOR[pos.status].labelClass;

  return (
    <p
      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"
      data-testid="trip-resumen-fleet-gps"
    >
      <span className={statusClass}>GPS {statusLabel}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">
        <RelativeTime iso={pos.recordedAt} />
      </span>
      <Link
        to={fleetMapFocusPath(vehicleId)}
        className="text-primary hover:underline"
      >
        {monitoringCopy.overlay.viewOnMap}
      </Link>
    </p>
  );
}
