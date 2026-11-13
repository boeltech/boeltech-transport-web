import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, MapPin, Radio } from "lucide-react";
import { config } from "@shared/config";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  useFleetPositions,
  useGpsTrackingEntitlement,
} from "../../application";
import type { FleetVehiclePosition } from "../../domain";
import { FleetMapView } from "../components/FleetMapView";
import { FleetPanel } from "../components/FleetPanel";
import { GpsModuleNotActivatedState } from "../components/GpsModuleNotActivatedState";
import { monitoringCopy } from "../copy/monitoringCopy";
import { isModuleNotEntitledError } from "../utils/isModuleNotEntitledError";

function isDisabledError(error: unknown): boolean {
  return isApiError(error) && error.code === "GPS_TRACKING_DISABLED";
}

export function FleetMapPage() {
  const copy = monitoringCopy.fleet;
  const mapboxToken = config.geolocation.mapboxPublicToken;
  const entitlement = useGpsTrackingEntitlement();
  const query = useFleetPositions({ enabled: entitlement.canUseModule });
  const [searchParams] = useSearchParams();
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [focusVehicleId, setFocusVehicleId] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("vehicleId");
    if (fromQuery) {
      setFocusVehicleId(fromQuery);
    }
  }, [searchParams]);

  const positions = useMemo(
    () => query.data?.positions ?? [],
    [query.data?.positions],
  );
  const summary = query.data?.summary;
  const isEmpty =
    entitlement.canUseModule &&
    !query.isLoading &&
    !query.isError &&
    (summary?.totalLinked === 0 || positions.length === 0);

  const disabled = query.isError && isDisabledError(query.error);
  const notEntitled =
    entitlement.showNotActivated ||
    (query.isError && isModuleNotEntitledError(query.error));

  const handleSelect = (position: FleetVehiclePosition) => {
    setFocusVehicleId(position.vehicleId);
  };

  const mapPositions = useMemo(
    () =>
      positions.filter(
        (p) => p.latitude != null && p.longitude != null,
      ),
    [positions],
  );

  return (
    <div
      className="relative h-full min-h-[calc(100dvh-4rem)] overflow-hidden bg-zinc-950"
      data-testid="fleet-map-page"
    >
      {/* Map canvas */}
      <div className="absolute inset-0">
        {mapboxToken ? (
          <FleetMapView
            token={mapboxToken}
            positions={notEntitled ? [] : mapPositions}
            focusVehicleId={focusVehicleId}
            onMarkerSelect={handleSelect}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-900 px-6 text-center">
            <p className="max-w-sm text-sm text-zinc-400">{copy.mapUnavailable}</p>
          </div>
        )}
      </div>

      {/* Ambient vignette — map-first atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-zinc-950/50"
        aria-hidden
      />

      {/* Title chip — a la derecha del NavigationControl Mapbox (top-left ~10+32px) */}
      <div className="pointer-events-none absolute left-14 top-3 z-10 md:left-16 md:top-4">
        <div
          className={cn(
            "pointer-events-auto inline-flex items-center gap-2 rounded-full",
            "border border-white/10 bg-zinc-950/75 px-3 py-1.5 text-zinc-100 shadow-lg backdrop-blur-md",
          )}
        >
          <MapPin className="h-3.5 w-3.5 text-success" aria-hidden />
          <span className="text-xs font-semibold tracking-wide">{copy.title}</span>
        </div>
      </div>

      {notEntitled ? (
        <GpsModuleNotActivatedState variant="map" />
      ) : null}

      {/* Overlay states */}
      {!notEntitled && query.isError ? (
        <div className="absolute inset-x-0 top-14 z-30 flex justify-center px-4">
          <Alert
            variant="destructive"
            className="max-w-lg border-destructive/40 bg-background/95 shadow-xl"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {disabled ? copy.errorDisabled : copy.errorTitle}
            </AlertTitle>
            <AlertDescription className="mt-2 flex flex-wrap items-center gap-3">
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
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!notEntitled && isEmpty ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/55 px-6 backdrop-blur-[2px]">
          <div
            className={cn(
              "max-w-md rounded-2xl border border-white/10 bg-zinc-950/90 p-8 text-center shadow-2xl",
              "text-zinc-100",
            )}
            data-testid="fleet-map-empty"
          >
            <Radio className="mx-auto h-10 w-10 text-success/80" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              {copy.emptyTitle}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{copy.emptyDescription}</p>
            <Button asChild className="mt-6" variant="default">
              <Link to="/vehicles">{copy.emptyCta}</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!notEntitled && !isEmpty ? (
        <FleetPanel
          positions={positions}
          summary={summary}
          selectedVehicleId={focusVehicleId}
          isLoading={query.isLoading}
          collapsed={panelCollapsed}
          onToggleCollapsed={() => setPanelCollapsed((v) => !v)}
          onSelect={handleSelect}
        />
      ) : null}
    </div>
  );
}

export default FleetMapPage;
