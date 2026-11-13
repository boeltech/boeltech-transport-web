import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, Radio } from "lucide-react";
import { config } from "@shared/config";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Skeleton } from "@shared/ui/skeleton";
import {
  useFleetHistory,
  useFleetPositions,
  useGpsTrackingEntitlement,
  useReverseGeocode,
} from "../../application";
import { FLEET_MAP_PATH } from "../../domain";
import { GpsModuleNotActivatedState } from "../components/GpsModuleNotActivatedState";
import { HistoryPeriodToolbar } from "../components/HistoryPeriodToolbar";
import { HistoryPointDetailCard } from "../components/HistoryPointDetailCard";
import { HistoryPointsTable } from "../components/HistoryPointsTable";
import { HistoryTrackMap } from "../components/HistoryTrackMap";
import { TimeScrubber } from "../components/TimeScrubber";
import { monitoringCopy } from "../copy/monitoringCopy";
import {
  resolveHistoryPreset,
  toIsoRange,
  type HistoryPeriodPreset,
  type HistoryPeriodRange,
} from "../utils/historyPeriod";
import { isModuleNotEntitledError } from "../utils/isModuleNotEntitledError";

const GEOCODE_DEBOUNCE_MS = 350;

export function FleetHistoryPage() {
  const copy = monitoringCopy.history;
  const { vehicleId = "" } = useParams<{ vehicleId: string }>();
  const mapboxToken = config.geolocation.mapboxPublicToken;
  const entitlement = useGpsTrackingEntitlement();

  const [preset, setPreset] = useState<HistoryPeriodPreset>("last4h");
  const [range, setRange] = useState<HistoryPeriodRange>(() =>
    resolveHistoryPreset("last4h"),
  );
  const isoRange = useMemo(() => toIsoRange(range), [range]);

  const fleetQuery = useFleetPositions({ enabled: entitlement.canUseModule });
  const historyQuery = useFleetHistory(vehicleId, isoRange, {
    enabled: entitlement.canUseModule,
  });
  const points = historyQuery.data?.points ?? [];

  const [selectedSeq, setSelectedSeq] = useState<number | null>(null);
  const [debouncedPoint, setDebouncedPoint] = useState<{
    lat: number;
    lon: number;
    key: string;
  } | null>(null);

  const selectedPoint =
    selectedSeq != null
      ? points.find((p) => p.seq === selectedSeq) ?? null
      : null;

  // Default select last point when data arrives / range changes
  useEffect(() => {
    if (points.length === 0) {
      setSelectedSeq(null);
      return;
    }
    setSelectedSeq((prev) => {
      if (prev != null && points.some((p) => p.seq === prev)) return prev;
      return points[points.length - 1]!.seq;
    });
  }, [points]);

  // Debounce reverse geocode on selected point
  useEffect(() => {
    if (!selectedPoint) {
      setDebouncedPoint(null);
      return;
    }
    const key = `${selectedPoint.seq}:${selectedPoint.latitude}:${selectedPoint.longitude}`;
    const timer = window.setTimeout(() => {
      setDebouncedPoint({
        lat: selectedPoint.latitude,
        lon: selectedPoint.longitude,
        key,
      });
    }, GEOCODE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [selectedPoint]);

  const geocodeQuery = useReverseGeocode(
    debouncedPoint?.lat,
    debouncedPoint?.lon,
    {
      enabled: debouncedPoint != null,
      debounceKey: debouncedPoint?.key,
    },
  );

  const unitLabel = useMemo(() => {
    const fromFleet = fleetQuery.data?.positions.find(
      (p) => p.vehicleId === vehicleId,
    );
    if (fromFleet) {
      return [
        fromFleet.vehicleEconomicNumber,
        fromFleet.vehiclePlate,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    if (historyQuery.data?.imei) {
      return `${copy.unitFallback} · ${historyQuery.data.imei}`;
    }
    return copy.unitFallback;
  }, [fleetQuery.data, historyQuery.data, vehicleId, copy.unitFallback]);

  const disabled =
    historyQuery.isError &&
    isApiError(historyQuery.error) &&
    historyQuery.error.code === "GPS_TRACKING_DISABLED";
  const notLinked =
    historyQuery.isError &&
    isApiError(historyQuery.error) &&
    historyQuery.error.code === "GPS_DEVICE_NOT_LINKED";
  const traccarDown =
    historyQuery.isError &&
    isApiError(historyQuery.error) &&
    historyQuery.error.code === "GPS_TRACCAR_UNAVAILABLE";
  const notEntitled =
    entitlement.showNotActivated ||
    (historyQuery.isError && isModuleNotEntitledError(historyQuery.error));

  const isEmpty =
    !historyQuery.isLoading &&
    !historyQuery.isError &&
    points.length === 0;

  const handlePeriodChange = (
    nextPreset: HistoryPeriodPreset,
    nextRange: HistoryPeriodRange,
  ) => {
    setPreset(nextPreset);
    setRange(nextRange);
  };

  const addressLoading =
    Boolean(selectedPoint) &&
    (debouncedPoint == null ||
      geocodeQuery.isFetching ||
      (debouncedPoint != null &&
        selectedPoint != null &&
        (Math.abs(debouncedPoint.lat - selectedPoint.latitude) > 1e-6 ||
          Math.abs(debouncedPoint.lon - selectedPoint.longitude) > 1e-6)));

  return (
    <div
      className="relative h-full min-h-[calc(100dvh-4rem)] overflow-hidden bg-zinc-950"
      data-testid="fleet-history-page"
    >
      <div className="absolute inset-0 lg:right-[360px]">
        {mapboxToken ? (
          <HistoryTrackMap
            token={mapboxToken}
            points={points}
            selectedSeq={selectedSeq}
            onSelectSeq={setSelectedSeq}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-900 px-6 text-center">
            <p className="max-w-sm text-sm text-zinc-400">
              {copy.mapUnavailable}
            </p>
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950/35 via-transparent to-zinc-950/45 lg:right-[360px]"
        aria-hidden
      />

      {/* Top chrome */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[min(100%-1.5rem,420px)] flex-col gap-2 md:left-14 lg:left-16">
        <Link
          to={FLEET_MAP_PATH}
          className={cn(
            "pointer-events-auto inline-flex w-fit items-center rounded-full",
            "border border-white/10 bg-zinc-950/80 px-3 py-1.5 text-xs font-medium text-zinc-100",
            "shadow-lg backdrop-blur-md hover:bg-zinc-900/90",
          )}
          data-testid="history-back-fleet"
        >
          {copy.backToFleet}
        </Link>
        <div
          className={cn(
            "pointer-events-auto inline-flex items-center gap-2 rounded-full",
            "border border-white/10 bg-zinc-950/75 px-3 py-1.5 text-zinc-100 shadow-lg backdrop-blur-md",
          )}
        >
          <Radio className="h-3.5 w-3.5 text-success" aria-hidden />
          <span className="text-xs font-semibold tracking-wide">
            {copy.title}
          </span>
          <span className="truncate text-[11px] text-zinc-400">{unitLabel}</span>
        </div>
      </div>

      {/* Scrubber over map */}
      {points.length > 0 ? (
        <div className="absolute inset-x-3 bottom-3 z-20 lg:right-[372px]">
          <TimeScrubber
            points={points}
            selectedSeq={selectedSeq}
            onSelectSeq={setSelectedSeq}
          />
        </div>
      ) : null}

      {/* Side panel */}
      <aside
        className={cn(
          "absolute inset-y-0 right-0 z-30 flex w-full max-w-full flex-col",
          "border-l border-white/10 bg-zinc-950/90 text-zinc-100 shadow-2xl backdrop-blur-xl",
          "sm:max-w-[360px]",
        )}
        aria-label={copy.tableTitle}
      >
        <div className="space-y-3 border-b border-white/10 px-4 py-3">
          <HistoryPeriodToolbar
            preset={preset}
            range={range}
            onPresetChange={handlePeriodChange}
          />
          {historyQuery.data?.sampled ? (
            <p className="text-[11px] text-amber-400/90">
              {copy.sampledNote(
                historyQuery.data.pointCount,
                historyQuery.data.rawPointCount,
              )}
            </p>
          ) : historyQuery.data ? (
            <p className="text-[11px] text-zinc-500">
              {copy.pointCount(historyQuery.data.pointCount)}
            </p>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 py-3">
          {notEntitled ? (
            <GpsModuleNotActivatedState variant="page" className="py-8" />
          ) : historyQuery.isLoading ? (
            <div className="space-y-2" aria-label={copy.loadingAria}>
              <Skeleton className="h-24 w-full rounded-xl bg-white/10" />
              <Skeleton className="h-40 w-full rounded-xl bg-white/10" />
            </div>
          ) : historyQuery.isError ? (
            <Alert
              variant="destructive"
              className="border-destructive/40 bg-background/95"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {disabled
                  ? copy.errorDisabled
                  : notLinked
                    ? copy.errorNotLinked
                    : traccarDown
                      ? copy.errorTraccar
                      : copy.errorTitle}
              </AlertTitle>
              <AlertDescription className="mt-2">
                {!disabled && !notLinked ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void historyQuery.refetch()}
                  >
                    {copy.retry}
                  </Button>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm font-medium text-zinc-200">
                {copy.emptyTitle}
              </p>
              <p className="text-xs text-zinc-500">{copy.emptyDescription}</p>
            </div>
          ) : (
            <>
              <HistoryPointDetailCard
                point={selectedPoint}
                address={geocodeQuery.data?.address}
                addressStatus={geocodeQuery.data?.addressStatus}
                addressLoading={addressLoading}
              />
              <HistoryPointsTable
                className="min-h-0 flex-1"
                points={points}
                selectedSeq={selectedSeq}
                onSelectSeq={setSelectedSeq}
              />
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default FleetHistoryPage;
