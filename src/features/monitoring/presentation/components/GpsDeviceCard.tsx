import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  History,
  MoreHorizontal,
  Radio,
  Unlink,
} from "lucide-react";
import { config } from "@shared/config";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { usePermissions } from "@shared/permissions";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { DetailSection, InfoRow } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  useGpsDevice,
  useGpsTrackingEntitlement,
} from "../../application";
import {
  FLEET_MAP_PATH,
  fleetHistoryPath,
  type GpsDeviceLastPosition,
  type GpsPositionStatusType,
} from "../../domain";
import { GPS_STATUS_COLOR } from "../config/gpsStatusStyles";
import { monitoringCopy } from "../copy/monitoringCopy";
import { addressDisplay } from "../utils/addressDisplay";
import { formatAbsoluteTime } from "../utils/formatAbsoluteTime";
import { formatCardinalHeading } from "../utils/cardinalHeading";
import { isModuleNotEntitledError } from "../utils/isModuleNotEntitledError";
import { movementLabel } from "../utils/movementLabel";
import { RelativeTime } from "./RelativeTime";
import { LinkGpsDeviceSheet } from "./LinkGpsDeviceSheet";
import { UnlinkGpsDeviceDialog } from "./UnlinkGpsDeviceDialog";

export interface GpsDeviceCardProps {
  readonly vehicleId: string;
  readonly unitNumber: string;
  readonly brand?: string | null;
  readonly model?: string | null;
}

function formatLinkedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildStaticMapUrl(
  lat: number,
  lng: number,
  status: GpsPositionStatusType,
  token: string,
): string {
  const color = GPS_STATUS_COLOR[status].hex;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+${color}(${lng},${lat})/${lng},${lat},13,0/560x200@2x?access_token=${encodeURIComponent(token)}`;
}

export function GpsDeviceCard({
  vehicleId,
  unitNumber,
  brand,
  model,
}: GpsDeviceCardProps) {
  const copy = monitoringCopy.device;
  const { hasPermission } = usePermissions();
  const canExecute = hasPermission("gps_tracking", "execute");
  const mapboxToken = config.geolocation.mapboxPublicToken;
  const entitlement = useGpsTrackingEntitlement();

  const query = useGpsDevice(vehicleId, {
    enabled: entitlement.canUseModule,
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);

  const vehicleLabel = [unitNumber, brand, model].filter(Boolean).join(" · ");
  const disabled =
    query.isError &&
    isApiError(query.error) &&
    query.error.code === "GPS_TRACKING_DISABLED";
  const notEntitled =
    entitlement.showNotActivated ||
    (query.isError && isModuleNotEntitledError(query.error));

  return (
    <DetailSection
      icon={<Radio className="h-4 w-4" />}
      title={copy.title}
      description={undefined}
      actions={
        query.data?.linked && canExecute ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Más acciones GPS"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => {
                  setTimeout(() => setUnlinkOpen(true), 0);
                }}
              >
                <Unlink className="mr-2 h-4 w-4" aria-hidden />
                {copy.unlinkMenu}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null
      }
    >
      <Card data-testid="gps-device-card">
        <CardContent className="space-y-4 pt-6">
          {notEntitled ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="gps-module-not-activated"
            >
              {copy.notEntitledMessage}
            </p>
          ) : query.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          ) : query.isError ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {disabled ? copy.disabledMessage : copy.loadError}
              </p>
              {!disabled ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void query.refetch()}
                >
                  {copy.retry}
                </Button>
              ) : null}
            </div>
          ) : !query.data?.linked ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Radio className="h-4 w-4 text-muted-foreground" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">{copy.unlinkedTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {copy.unlinkedDescription}
                  </p>
                </div>
              </div>
              {canExecute ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setLinkOpen(true)}
                  data-testid="gps-link-cta"
                >
                  {copy.linkCta}
                </Button>
              ) : null}
            </div>
          ) : (
            <LinkedBody
              vehicleId={vehicleId}
              imei={query.data.imei}
              linkedAt={query.data.linkedAt}
              linkedByName={query.data.linkedByName}
              lastPosition={query.data.lastPosition}
              mapboxToken={mapboxToken}
            />
          )}
        </CardContent>
      </Card>

      {canExecute && !notEntitled ? (
        <>
          <LinkGpsDeviceSheet
            vehicleId={vehicleId}
            vehicleLabel={vehicleLabel}
            open={linkOpen}
            onOpenChange={setLinkOpen}
          />
          <UnlinkGpsDeviceDialog
            vehicleId={vehicleId}
            vehicleLabel={unitNumber}
            open={unlinkOpen}
            onOpenChange={setUnlinkOpen}
          />
        </>
      ) : null}
    </DetailSection>
  );
}

function LinkedBody({
  vehicleId,
  imei,
  linkedAt,
  linkedByName,
  lastPosition,
  mapboxToken,
}: {
  vehicleId: string;
  imei: string;
  linkedAt: string;
  linkedByName: string | null;
  lastPosition: GpsDeviceLastPosition | null;
  mapboxToken: string;
}) {
  const copy = monitoringCopy.device;
  const parity = monitoringCopy.parity;
  const status: GpsPositionStatusType = lastPosition?.status ?? "offline";
  const colors = GPS_STATUS_COLOR[status];
  const hasFix = lastPosition != null;
  const heading = hasFix
    ? formatCardinalHeading(lastPosition.courseDeg)
    : null;
  const address = hasFix
    ? addressDisplay(
        lastPosition.address,
        lastPosition.addressStatus,
        parity.addressUnavailable,
      )
    : null;
  const movement = hasFix
    ? movementLabel(lastPosition.movementStatus, {
        moving: parity.movement.moving,
        stopped: parity.movement.stopped,
        empty: copy.emptyValue,
      })
    : copy.emptyValue;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        <InfoRow
          variant="inline"
          label={copy.label.imei}
          value={imei}
          mono
          copyable
          copyValue={imei}
        />
        <InfoRow
          variant="inline"
          label={copy.label.status}
          value={
            <span className="inline-flex items-center gap-2">
              <span
                className={cn("h-2 w-2 rounded-full", colors.fill)}
                aria-hidden
              />
              <span className={colors.labelClass}>{copy.status[status]}</span>
            </span>
          }
        />
        <InfoRow
          variant="inline"
          label={copy.label.movement}
          value={movement}
        />
        <InfoRow
          variant="inline"
          label={copy.label.lastPosition}
          value={
            hasFix
              ? `${lastPosition.latitude.toFixed(4)}, ${lastPosition.longitude.toFixed(4)}`
              : copy.emptyValue
          }
          mono={hasFix}
        />
        <InfoRow
          variant="inline"
          label={copy.label.signal}
          value={
            hasFix ? (
              <span className="flex flex-col gap-0.5">
                <span className="text-sm">
                  {formatAbsoluteTime(lastPosition.recordedAt)}
                </span>
                <RelativeTime
                  iso={lastPosition.recordedAt}
                  className={cn(
                    "text-xs text-muted-foreground",
                    status === "stale" && colors.labelClass,
                  )}
                />
              </span>
            ) : (
              copy.noReport
            )
          }
        />
        <InfoRow
          variant="inline"
          label={copy.label.address}
          value={address ?? copy.emptyValue}
        />
        <InfoRow
          variant="inline"
          label={copy.label.speed}
          value={
            hasFix && lastPosition.speedKmh != null
              ? `${Math.round(lastPosition.speedKmh)} km/h`
              : copy.emptyValue
          }
        />
        <InfoRow
          variant="inline"
          label={copy.label.course}
          value={heading?.label ?? copy.emptyValue}
        />
        <InfoRow
          variant="inline"
          label={copy.label.sats}
          value={
            hasFix && lastPosition.satellites != null
              ? String(lastPosition.satellites)
              : copy.emptyValue
          }
        />
        <InfoRow
          variant="inline"
          label={copy.label.battery}
          value={
            hasFix && lastPosition.batteryPct != null
              ? parity.batteryPct(lastPosition.batteryPct)
              : copy.emptyValue
          }
        />
        <InfoRow
          variant="inline"
          label={copy.label.phone}
          value={
            hasFix && lastPosition.phone
              ? lastPosition.phone
              : copy.emptyValue
          }
        />
        <InfoRow
          variant="inline"
          label={copy.label.odometer}
          value={
            hasFix && lastPosition.odometerKm != null
              ? parity.odometerKm(lastPosition.odometerKm)
              : copy.emptyValue
          }
        />
        <InfoRow
          variant="inline"
          label={copy.label.linked}
          value={copy.linkedBy(formatLinkedAt(linkedAt), linkedByName)}
        />
      </div>

      {hasFix && mapboxToken ? (
        <div className="overflow-hidden rounded-md border">
          <img
            src={buildStaticMapUrl(
              lastPosition.latitude,
              lastPosition.longitude,
              status,
              mapboxToken,
            )}
            alt="Última posición GPS"
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex h-32 items-center justify-center rounded-md border border-dashed",
            "bg-muted/30 text-sm text-muted-foreground",
          )}
        >
          {copy.waitingSignal}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link
            to={fleetHistoryPath(vehicleId)}
            className="inline-flex items-center gap-1"
            data-testid="gps-view-history"
          >
            <History className="h-3.5 w-3.5" aria-hidden />
            {copy.viewHistory}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={FLEET_MAP_PATH} className="inline-flex items-center gap-1">
            {copy.viewOnMap}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
