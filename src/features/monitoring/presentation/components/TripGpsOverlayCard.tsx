import { Link } from "react-router-dom";
import { History, MapPin, Radio } from "lucide-react";
import { config } from "@shared/config";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { useGpsDevice } from "../../application";
import {
  FLEET_MAP_PATH,
  fleetHistoryPath,
  fleetMapFocusPath,
} from "../../domain";
import { GPS_STATUS_COLOR } from "../config/gpsStatusStyles";
import { monitoringCopy } from "../copy/monitoringCopy";
import { addressDisplay } from "../utils/addressDisplay";
import { formatAbsoluteTime } from "../utils/formatAbsoluteTime";
import { formatCardinalHeading } from "../utils/cardinalHeading";
import { movementLabel } from "../utils/movementLabel";
import { RelativeTime } from "./RelativeTime";
import { TripGpsMiniMap } from "./TripGpsMiniMap";

const POLL_MS = 30_000;

export interface TripGpsOverlayCardProps {
  readonly vehicleId: string | null | undefined;
  /** Eco / placa para aria del marcador. */
  readonly vehicleLabel?: string | null;
}

/**
 * Card «Posición GPS» en tab Operación (CA-32–38, CA-56).
 * No renderiza si no hay vehicleId o el device no está vinculado.
 */
export function TripGpsOverlayCard({
  vehicleId,
  vehicleLabel,
}: TripGpsOverlayCardProps) {
  const copy = monitoringCopy.overlay;
  const fleetCopy = monitoringCopy.fleet;
  const mapboxToken = config.geolocation.mapboxPublicToken;

  const query = useGpsDevice(vehicleId ?? "", {
    enabled: Boolean(vehicleId),
    refetchInterval: POLL_MS,
  });

  if (!vehicleId) return null;
  if (query.isPending || query.isLoading) return null;
  if (query.isError || !query.data?.linked) return null;

  const device = query.data;
  const pos = device.lastPosition;
  const label = vehicleLabel?.trim() || "Unidad";

  return (
    <Card data-testid="trip-gps-overlay-card">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Radio className="h-4 w-4 shrink-0 text-primary" />
          {copy.title}
        </CardTitle>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to={pos ? fleetMapFocusPath(vehicleId) : FLEET_MAP_PATH}>
              <MapPin className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {copy.viewOnMap}
            </Link>
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to={fleetHistoryPath(vehicleId)}>
              <History className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {copy.viewHistory}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {pos ? (
          <>
            {mapboxToken ? (
              <TripGpsMiniMap
                token={mapboxToken}
                latitude={pos.latitude}
                longitude={pos.longitude}
                status={pos.status}
                courseDeg={pos.courseDeg}
                label={label}
              />
            ) : (
              <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
                {copy.mapUnavailable}
              </p>
            )}

            <div className="grid gap-1 sm:grid-cols-2">
              <InfoRow
                variant="inline"
                label={copy.label.status}
                value={
                  <span
                    className={GPS_STATUS_COLOR[pos.status].labelClass}
                  >
                    {fleetCopy.status[pos.status]}
                  </span>
                }
              />
              <InfoRow
                variant="inline"
                label={copy.label.movement}
                value={movementLabel(pos.movementStatus, {
                  moving: fleetCopy.movement.moving,
                  stopped: fleetCopy.movement.stopped,
                  empty: fleetCopy.movement.empty,
                })}
              />
              <InfoRow
                variant="inline"
                label={copy.label.speed}
                value={
                  pos.speedKmh != null
                    ? fleetCopy.speed(pos.speedKmh)
                    : copy.emptyValue
                }
              />
              <InfoRow
                variant="inline"
                label={copy.label.course}
                value={
                  formatCardinalHeading(pos.courseDeg)?.label ?? copy.emptyValue
                }
              />
              <InfoRow
                variant="inline"
                label={copy.label.lastSignal}
                value={
                  <span className="flex flex-col gap-0.5">
                    <span>{formatAbsoluteTime(pos.recordedAt)}</span>
                    <span className="text-xs text-muted-foreground">
                      <RelativeTime iso={pos.recordedAt} />
                    </span>
                  </span>
                }
              />
              <InfoRow
                variant="inline"
                label={copy.label.address}
                value={
                  addressDisplay(
                    pos.address,
                    pos.addressStatus,
                    fleetCopy.addressUnavailable,
                  ) ?? copy.emptyValue
                }
              />
              <InfoRow
                variant="inline"
                label={copy.label.sats}
                value={
                  pos.satellites != null
                    ? String(pos.satellites)
                    : copy.emptyValue
                }
              />
              <InfoRow
                variant="inline"
                label={copy.label.battery}
                value={
                  pos.batteryPct != null
                    ? monitoringCopy.parity.batteryPct(pos.batteryPct)
                    : copy.emptyValue
                }
              />
              {pos.phone ? (
                <InfoRow
                  variant="inline"
                  label={copy.label.phone}
                  value={pos.phone}
                />
              ) : null}
              <InfoRow
                variant="inline"
                label={copy.label.odometer}
                value={
                  pos.odometerKm != null
                    ? monitoringCopy.parity.odometerKm(pos.odometerKm)
                    : copy.emptyValue
                }
              />
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
            {copy.waitingSignal}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
