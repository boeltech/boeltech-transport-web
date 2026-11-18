import { Link } from "react-router-dom";

import {
  useGpsDevice,
  useGpsTrackingEntitlement,
} from "@features/monitoring/application";
import { fleetMapFocusPath } from "@features/monitoring/domain";
import { GPS_STATUS_COLOR } from "@features/monitoring/presentation/config/gpsStatusStyles";
import { monitoringCopy } from "@features/monitoring/presentation/copy/monitoringCopy";
import { RelativeTime } from "@features/monitoring/presentation";
import { usePermissions } from "@shared/permissions";

const POLL_MS = 30_000;

export interface TripResumenFleetGpsStatusProps {
  readonly vehicleId: string | null | undefined;
}

/**
 * Estado GPS compacto dentro de Flota (D6) — sin card propia.
 * Oculto si no hay device vinculado (Q7: no inventar señal).
 * T6 / DC5: no render / no query si el complemento no está `active`.
 */
export function TripResumenFleetGpsStatus({
  vehicleId,
}: TripResumenFleetGpsStatusProps) {
  const { hasPermission } = usePermissions();
  const canReadGps = hasPermission("gps_tracking", "read");
  const entitlement = useGpsTrackingEntitlement();
  const gpsActive = canReadGps && entitlement.state === "active";

  const query = useGpsDevice(vehicleId ?? "", {
    enabled: Boolean(vehicleId) && gpsActive,
    refetchInterval: POLL_MS,
  });

  if (!vehicleId || !gpsActive) return null;
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
