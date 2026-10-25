import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailTimeline } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  Clock,
  Loader2,
  Map as MapIcon,
  RefreshCw,
} from "lucide-react";
import { getOrderedStops, TripStatus, type CfdiEmissionIntent, type TripOperationalOutcomeType, type TripStatusType, type TripStop, type TripCargo } from "@features/trips/domain";
import {
  useTripTimeline,
  useUpdateCargo,
} from "@features/trips/application";
import { formatStopTimelineLabel } from "../uiHelpers";
import { formatStopActionShortLabel } from "./trackingActionLabels";
import { formatTrackingEventLabel } from "./trackingEventLabels";
import { resolveTrackingEventIcon } from "./trackingEventIcons";
import {
  findActiveEscalaForDeparture,
  findDestinationAwaitingTripArrival,
  findNextStopForArrival,
  findOriginAwaitingDeparture,
  isDestinationStop,
  isOriginStop,
} from "./trackingStopEligibility";
import { TripTrackingMap } from "./TripTrackingMap";
import {
  formatDataUpdatedAgo,
  RegisterStopTrackingEventSheet,
  RegisterTripArrivalSheet,
  QuickCloseTripSheet,
  RegisterTrackingIncidentSheet,
  RegisterTrackingNoteSheet,
  StartTripSheet,
  DepartOriginSheet,
  DeclareFalseTripSheet,
  CloseTrackingIncidentSheet,
  getTrackingEventTimelineBody,
  getTrackingIncidentTimelineMeta,
  getFalseTripDeclaredTimelineMeta,
  shouldShowIncidentClosedChip,
  TrackingStatesLegend,
  TripTrackingIncidentStrip,
  TripTrackingItineraryRail,
  TripTrackingNowPanel,
  TripTrackingProgressStrip,
  TripTrackingStopWorkbenchSheet,
  TRACKING_ON_SITE_PRIMARY_KINDS,
  buildTrackingHeaderContextPhrase,
  buildTrackingItineraryRows,
  isTrackingCurrentStop,
  resolveLatestIncidentDetail,
  resolveTrackingCurrentStopId,
  resolveTrackingPrimaryAction,
  resolveTrackingTrafficLight,
  trackingCopy,
  type TrackingContactInfo,
  type TrackingOperationalFocusRequest,
} from "./trip-tracking";
import {
  cargoActionToStatus,
  type CargoManualAction,
} from "../utils/cargoStatusActions";
import { getCargoStatusVariant } from "./trip-cargos/tripCargoDetailHelpers";
import { useToast } from "@shared/hooks";
import { isClientPortalRole, isDriverPortalRole } from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import { tripDetailCopy } from "../copy";
import { showTripDetailErrorToast } from "../helpers/toastTripDetailError";

interface TripTrackingTabProps {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  driverId?: string;
  tripStartMileage?: number | null;
  /** Señal barata PD6: origen≈sucursal para default «ya en andén». */
  originBranchId?: string | null;
  status: TripStatusType;
  /** Cargas del page-level `useTripCargos` (misma query key; no duplicar observer). */
  cargos?: readonly TripCargo[];
  /** ADR-0079 / ADR-0088: oculta atajo de cierre si el viaje es en falso. */
  operationalOutcome?: TripOperationalOutcomeType;
  /** ADR-0096: oculta Declarar viaje en falso si liquidación sin CFDI. */
  cfdiEmissionIntent?: CfdiEmissionIntent;
  /** ADR-0079: actor del falso si el API lo envía en el viaje (fallback de bitácora). */
  falseTripDeclaredBy?: string | null;
  /**
   * T4-043: `trip.invoicing.hasActiveSplit` — bloquea CTA de viaje en falso.
   */
  hasActiveSplit?: boolean;
  /** ADR-0093 — soft-warn al finalizar. */
  requiresFiscalAttention?: boolean;
  /** F6: contacto flota (ya en detalle de viaje; sin fetch extra). */
  contact?: TrackingContactInfo | null;
  onCargosChanged?: () => void;
}

export function TripTrackingTab({
  tripId,
  tripCode,
  vehicleId,
  driverId,
  tripStartMileage,
  originBranchId = null,
  status,
  cargos: cargosProp = [],
  operationalOutcome,
  cfdiEmissionIntent,
  falseTripDeclaredBy = null,
  hasActiveSplit = false,
  requiresFiscalAttention = false,
  contact = null,
  onCargosChanged,
}: TripTrackingTabProps) {
  const [, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isDriverPortal = isDriverPortalRole(role);
  const isClientPortal = isClientPortalRole(role);
  const canUpdateTrip = hasPermission("trips", "update");
  const canOperateTracking =
    canUpdateTrip ||
    hasPermission("trips", "updateStatus") ||
    hasPermission("trips", "execute");
  /** Mutaciones de carga requieren `trips.update` (API); no inventar ACL. */
  const canMutateCargo = canUpdateTrip;
  const [startSheetOpen, setStartSheetOpen] = useState(false);
  const [tripArrivalSheetOpen, setTripArrivalSheetOpen] = useState(false);
  const [quickCloseSheetOpen, setQuickCloseSheetOpen] = useState(false);
  const [arrivalSheetOpen, setArrivalSheetOpen] = useState(false);
  const [departureSheetOpen, setDepartureSheetOpen] = useState(false);
  const [departOriginSheetOpen, setDepartOriginSheetOpen] = useState(false);
  const [falseTripSheetOpen, setFalseTripSheetOpen] = useState(false);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [incidentSheetOpen, setIncidentSheetOpen] = useState(false);
  const [closeIncidentSheetOpen, setCloseIncidentSheetOpen] = useState(false);
  /**
   * F6: Sheet workbench solo mientras la parada pedida sigue siendo la en curso.
   * Derivado (sin effect) para no cascada setState.
   */
  const [workbenchRequestedStopId, setWorkbenchRequestedStopId] = useState<
    string | null
  >(null);
  /** Parada elegida al abrir evidencia desde el detail; null = fallback operativo. */
  const [evidenceReferenceStop, setEvidenceReferenceStop] =
    useState<TripStop | null>(null);
  const [focusRequest, setFocusRequest] =
    useState<TrackingOperationalFocusRequest | null>(null);
  const [railSelectedStopId, setRailSelectedStopId] = useState<string | null>(
    null,
  );
  const [refreshTickMs, setRefreshTickMs] = useState(() => Date.now());
  const [pendingCargoAction, setPendingCargoAction] = useState<{
    cargoId: string;
    action: CargoManualAction;
  } | null>(null);
  const { toast } = useToast();

  const timelineQuery = useTripTimeline(tripId);
  const timeline = timelineQuery.data;
  /** Prefer page prop when timeline cache still shows a divergent status. */
  const tripStatus =
    timeline?.trip.status === status
      ? timeline.trip.status
      : status;

  const cargos = cargosProp;

  const updateCargoMutation = useUpdateCargo(tripId, {
    onSuccess: (_data, variables) => {
      const action =
        pendingCargoAction?.cargoId === variables.cargoId
          ? pendingCargoAction.action
          : null;
      if (action === "pickup") {
        toast({ title: tripDetailCopy.cargo.toast.pickup, variant: "success" });
      } else if (action === "deliver") {
        toast({ title: tripDetailCopy.cargo.toast.delivered, variant: "success" });
      } else if (action === "return") {
        toast({ title: tripDetailCopy.cargo.toast.returned, variant: "success" });
      } else if (action === "cancel") {
        toast({ title: tripDetailCopy.cargo.toast.cancelled, variant: "success" });
      }
      setPendingCargoAction(null);
      onCargosChanged?.();
    },
    onError: (error) => {
      showTripDetailErrorToast(
        toast,
        error,
        tripDetailCopy.cargo.toast.deliverError,
      );
      setPendingCargoAction(null);
    },
  });

  const handleCargoAction = (cargoId: string, action: CargoManualAction) => {
    if (!canMutateCargo) return;
    setPendingCargoAction({ cargoId, action });
    updateCargoMutation.mutate({
      cargoId,
      data: { status: cargoActionToStatus(action) },
    });
  };

  useEffect(() => {
    if (tripStatus !== TripStatus.IN_PROGRESS) return;
    const id = window.setInterval(() => setRefreshTickMs(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, [tripStatus]);

  const orderedStops = useMemo(
    () => (timeline ? getOrderedStops(timeline.stops) : []),
    [timeline],
  );
  const stopsById = useMemo(
    () => new Map(orderedStops.map((stop) => [stop.id, stop])),
    [orderedStops],
  );
  const stopTimelineLabelsById = useMemo(() => {
    const labels = new Map<string, ReturnType<typeof formatStopTimelineLabel>>();
    orderedStops.forEach((stop, index) => {
      labels.set(stop.id, formatStopTimelineLabel(stop, index + 1));
    });
    return labels;
  }, [orderedStops]);
  const nextStopForArrival = useMemo(
    () => findNextStopForArrival(orderedStops),
    [orderedStops],
  );
  const activeEscalaForDeparture = useMemo(
    () => findActiveEscalaForDeparture(orderedStops),
    [orderedStops],
  );
  const originAwaitingDeparture = useMemo(
    () => findOriginAwaitingDeparture(orderedStops),
    [orderedStops],
  );
  const destinationAwaitingClosure = useMemo(
    () => findDestinationAwaitingTripArrival(orderedStops),
    [orderedStops],
  );
  const nextArrivalOrder = useMemo(
    () =>
      nextStopForArrival
        ? orderedStops.findIndex((s) => s.id === nextStopForArrival.id) + 1
        : undefined,
    [nextStopForArrival, orderedStops],
  );
  const activeDepartureOrder = useMemo(
    () =>
      activeEscalaForDeparture
        ? orderedStops.findIndex((s) => s.id === activeEscalaForDeparture.id) + 1
        : undefined,
    [activeEscalaForDeparture, orderedStops],
  );
  const originDepartureOrder = useMemo(
    () =>
      originAwaitingDeparture
        ? orderedStops.findIndex((s) => s.id === originAwaitingDeparture.id) + 1
        : undefined,
    [originAwaitingDeparture, orderedStops],
  );
  const destinationClosureOrder = useMemo(
    () =>
      destinationAwaitingClosure
        ? orderedStops.findIndex((s) => s.id === destinationAwaitingClosure.id) + 1
        : undefined,
    [destinationAwaitingClosure, orderedStops],
  );

  const originStop = useMemo(
    () => orderedStops.find((stop) => isOriginStop(stop)),
    [orderedStops],
  );
  const destinationStop = useMemo(() => {
    for (let i = orderedStops.length - 1; i >= 0; i -= 1) {
      const stop = orderedStops[i];
      if (stop && isDestinationStop(stop)) return stop;
    }
    return null;
  }, [orderedStops]);
  const referenceStopForGps = useMemo(
    () =>
      originAwaitingDeparture ??
      activeEscalaForDeparture ??
      nextStopForArrival ??
      destinationAwaitingClosure ??
      null,
    [
      originAwaitingDeparture,
      activeEscalaForDeparture,
      nextStopForArrival,
      destinationAwaitingClosure,
    ],
  );
  const updatedAgoLabel = useMemo(() => {
    if (!timelineQuery.dataUpdatedAt) return null;
    const ageMs = refreshTickMs - timelineQuery.dataUpdatedAt;
    // D7: solo mostrar antigüedad si supera 2 minutos
    if (ageMs < 2 * 60 * 1000) return null;
    return formatDataUpdatedAgo(timelineQuery.dataUpdatedAt, refreshTickMs);
  }, [timelineQuery.dataUpdatedAt, refreshTickMs]);

  const tripScheduleTimes = useMemo(
    () =>
      timeline
        ? {
            scheduledDeparture: timeline.trip.scheduledDeparture ?? undefined,
            actualDeparture: timeline.trip.actualDeparture,
          }
        : undefined,
    [timeline],
  );

  const itineraryRows = useMemo(
    () => buildTrackingItineraryRows(orderedStops, tripScheduleTimes, cargos),
    [orderedStops, tripScheduleTimes, cargos],
  );

  const currentStopId = useMemo(
    () => resolveTrackingCurrentStopId(itineraryRows),
    [itineraryRows],
  );

  const currentStopRow = useMemo(
    () =>
      currentStopId
        ? itineraryRows.find((row) => row.stop.id === currentStopId) ?? null
        : null,
    [itineraryRows, currentStopId],
  );

  const railSelectedEffectiveId =
    railSelectedStopId ?? focusRequest?.stopId ?? null;

  const railSelectionHint = useMemo(() => {
    if (!railSelectedEffectiveId || tripStatus !== TripStatus.IN_PROGRESS) {
      return null;
    }
    if (isTrackingCurrentStop(railSelectedEffectiveId, itineraryRows)) {
      return null;
    }
    return trackingCopy.hint.railMapOnly;
  }, [railSelectedEffectiveId, tripStatus, itineraryRows]);

  const trafficLight = useMemo(() => {
    if (!timeline) return "n/a" as const;
    return resolveTrackingTrafficLight({
      tripStatus,
      hasOpenIncident: timeline.trip.hasOpenIncident,
      now: refreshTickMs,
      estimatedArrival: timeline.progress.estimatedArrival,
      scheduledArrival: timeline.trip.scheduledArrival,
      stops: orderedStops,
    });
  }, [timeline, tripStatus, refreshTickMs, orderedStops]);

  const primaryAction = useMemo(
    () =>
      resolveTrackingPrimaryAction(tripStatus, orderedStops, cargos, {
        canMutateCargo,
      }),
    [tripStatus, orderedStops, cargos, canMutateCargo],
  );

  const headerNextStopLabel = useMemo(() => {
    if (!primaryAction.stop) return null;
    const fromName = primaryAction.stop.locationName?.trim();
    if (fromName) return fromName;
    const order =
      primaryAction.displayOrder ??
      orderedStops.findIndex((s) => s.id === primaryAction.stop!.id) + 1;
    return formatStopTimelineLabel(primaryAction.stop, order || 1).primary;
  }, [primaryAction.stop, primaryAction.displayOrder, orderedStops]);

  const headerContextPhrase = useMemo(() => {
    const onSite =
      TRACKING_ON_SITE_PRIMARY_KINDS.has(primaryAction.kind) ||
      Boolean(currentStopRow?.waitingPhase);
    if (onSite && headerNextStopLabel) {
      return buildTrackingHeaderContextPhrase({
        situation: "on_site",
        stopLabel: headerNextStopLabel,
        waitingPhase: Boolean(currentStopRow?.waitingPhase),
      });
    }
    return buildTrackingHeaderContextPhrase({
      situation: "in_transit",
      stopLabel: headerNextStopLabel,
      estimatedArrival: timeline?.progress.estimatedArrival ?? null,
    });
  }, [
    primaryAction.kind,
    currentStopRow?.waitingPhase,
    headerNextStopLabel,
    timeline?.progress.estimatedArrival,
  ]);

  const openIncidentSummary =
    timeline?.trip.hasOpenIncident
      ? trackingCopy.hint.openIncidentSummary(
          resolveLatestIncidentDetail(timeline.events),
        )
      : null;

  const workbenchSheetOpen =
    workbenchRequestedStopId != null &&
    currentStopId != null &&
    workbenchRequestedStopId === currentStopId;

  const evidenceReferenceStopForSheets =
    evidenceReferenceStop ?? currentStopRow?.stop ?? referenceStopForGps;

  const evidenceAssociateMeta = useMemo(() => {
    const stop = evidenceReferenceStopForSheets;
    if (!stop?.id) return null;
    const row = itineraryRows.find((r) => r.stop.id === stop.id);
    const displayOrder =
      row?.displayOrder ??
      orderedStops.findIndex((s) => s.id === stop.id) + 1;
    if (!displayOrder || displayOrder < 1) return null;
    return {
      id: stop.id,
      label: formatStopActionShortLabel(stop, displayOrder),
    };
  }, [evidenceReferenceStopForSheets, itineraryRows, orderedStops]);

  if (timelineQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (timelineQuery.isError || !timeline) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {trackingCopy.state.loadError}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => timelineQuery.refetch()}
          >
            {trackingCopy.action.retry}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canOperateStops =
    canOperateTracking && tripStatus === TripStatus.IN_PROGRESS;

  const openNoteSheet = (stop: TripStop | null = null) => {
    if (!canOperateTracking) return;
    // PD10 — preasociar parada en curso si no se pasa otra.
    setEvidenceReferenceStop(stop ?? currentStopRow?.stop ?? null);
    setNoteSheetOpen(true);
  };

  const openIncidentSheet = (stop: TripStop | null = null) => {
    if (!canOperateTracking) return;
    setEvidenceReferenceStop(stop ?? currentStopRow?.stop ?? null);
    setIncidentSheetOpen(true);
  };

  const handleNoteSheetOpenChange = (open: boolean) => {
    setNoteSheetOpen(open);
    if (!open) setEvidenceReferenceStop(null);
  };

  const handleIncidentSheetOpenChange = (open: boolean) => {
    setIncidentSheetOpen(open);
    if (!open) setEvidenceReferenceStop(null);
  };

  const handleRailSelect = (stopId: string) => {
    setRailSelectedStopId(stopId);
    const nextFocus: TrackingOperationalFocusRequest = {
      stopId,
      nonce: (focusRequest?.nonce ?? 0) + 1,
    };
    setFocusRequest(nextFocus);

    if (isTrackingCurrentStop(stopId, itineraryRows)) {
      setWorkbenchRequestedStopId(stopId);
      return;
    }

    // Parada no en curso: solo selección en riel + foco en mapa (sin scroll a bitácora).
    setWorkbenchRequestedStopId(null);
  };

  const handleGoToCargos = (stopId: string) => {
    setRailSelectedStopId(stopId);
    setFocusRequest((prev) => ({
      stopId,
      nonce: (prev?.nonce ?? 0) + 1,
    }));
    if (isTrackingCurrentStop(stopId, itineraryRows)) {
      setWorkbenchRequestedStopId(stopId);
    }
  };

  return (
    <div className="space-y-4" data-tracking-layout="prd-f6">
      {/* HEADER — status · semáforo · siguiente+ETA */}
      <section
        className="rounded-lg border bg-card px-3 py-2.5 sm:px-4"
        data-tracking-section="header"
        aria-label={trackingCopy.section.metrics}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TripTrackingProgressStrip
            progress={timeline.progress}
            tripStatus={tripStatus}
            trafficLight={trafficLight}
            contextPhrase={headerContextPhrase}
            readOnly={
              !canOperateTracking ||
              (tripStatus !== TripStatus.SCHEDULED &&
                tripStatus !== TripStatus.IN_PROGRESS)
            }
          />
          <div className="flex flex-wrap items-center gap-2">
            {tripStatus === TripStatus.IN_PROGRESS ? (
              updatedAgoLabel ? (
                <span className="text-xs text-muted-foreground">
                  {trackingCopy.hint.updatedAgo(updatedAgoLabel)}
                </span>
              ) : (
                <Badge variant="secondary" className="text-xs font-normal">
                  {trackingCopy.state.live}
                </Badge>
              )
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void timelineQuery.refetch();
              }}
              disabled={timelineQuery.isFetching}
              className="shrink-0 gap-1.5"
            >
              {timelineQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {trackingCopy.action.refresh}
            </Button>
          </div>
        </div>
      </section>

      {/* F7.2 — incidente abierto: franja full-width entre header y riel */}
      {timeline.trip.hasOpenIncident ? (
        <TripTrackingIncidentStrip
          summary={openIncidentSummary}
          canClose={canOperateTracking}
          onClose={() => setCloseIncidentSheetOpen(true)}
        />
      ) : null}

      {/* PARADAS — riel / itinerario */}
      <TripTrackingItineraryRail
        stops={orderedStops}
        tripStatus={tripStatus}
        tripTimes={tripScheduleTimes}
        cargos={cargos}
        selectedStopId={railSelectedEffectiveId}
        onSelectStop={handleRailSelect}
        selectionHint={railSelectionHint}
      />

      {/* PD8 — leyenda colapsada bajo el riel */}
      <TrackingStatesLegend showCargo={cargos.length > 0} />

      {/* OPERATE — full-width; mapa fuera del fold (PD1 / layout A) */}
      <TripTrackingNowPanel
        stops={orderedStops}
        tripStatus={tripStatus}
        tripTimes={tripScheduleTimes}
        cargos={cargos}
        onStartTrip={
          canOperateTracking ? () => setStartSheetOpen(true) : undefined
        }
        onArrive={
          canOperateTracking ? () => setArrivalSheetOpen(true) : undefined
        }
        onDepart={
          canOperateTracking ? () => setDepartureSheetOpen(true) : undefined
        }
        onDepartOrigin={
          canOperateTracking
            ? () => setDepartOriginSheetOpen(true)
            : undefined
        }
        onCloseTrip={
          canOperateTracking
            ? () => setTripArrivalSheetOpen(true)
            : undefined
        }
        onQuickCloseTrip={
          canOperateTracking
            ? () => setQuickCloseSheetOpen(true)
            : undefined
        }
        operationalOutcome={operationalOutcome}
        cfdiEmissionIntent={cfdiEmissionIntent}
        hasActiveSplit={hasActiveSplit}
        onDeclareFalseTrip={
          canOperateTracking &&
          cfdiEmissionIntent !== "sin_cfdi_efectivo"
            ? () => setFalseTripSheetOpen(true)
            : undefined
        }
        onGoToCargos={handleGoToCargos}
        onCargoAction={canMutateCargo ? handleCargoAction : undefined}
        pendingCargoAction={pendingCargoAction}
        onRegisterNote={
          canOperateTracking ? () => openNoteSheet() : undefined
        }
        onRegisterIncident={
          canOperateTracking ? () => openIncidentSheet() : undefined
        }
        canRegisterNote={canOperateStops}
        canRegisterIncident={canOperateStops}
        canOperateTracking={canOperateTracking}
        canMutateCargo={canMutateCargo}
        isDriverPortal={isDriverPortal}
        isClientPortal={isClientPortal}
        contact={contact}
        onGoToRouteTab={() => {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set("tab", "route");
              return next;
            },
            { replace: true },
          );
        }}
      />

      {/* CONSULTA — mapa + bitácora bajo fold (sub-tabs; sin sticky F6) */}
      <section
        className="space-y-3"
        data-tracking-section="consulta"
        aria-label={trackingCopy.section.consulta}
      >
        <p className="text-xs font-medium text-muted-foreground">
          {trackingCopy.section.consulta}
        </p>
        <Tabs defaultValue="map" className="min-w-0">
          <TabsList aria-label={trackingCopy.section.consulta}>
            <TabsTrigger value="map" className="gap-1.5">
              <MapIcon className="h-3.5 w-3.5" aria-hidden />
              {trackingCopy.section.map}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {trackingCopy.section.timeline}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="map" className="mt-3">
            <div
              className="min-w-0"
              data-tracking-section="map"
              data-tracking-map-weight="consulta"
            >
              <TripTrackingMap
                stops={orderedStops}
                events={timeline.events}
                routeGeojson={timeline.map.routeGeojson}
                lastKnownPosition={timeline.map.lastKnownPosition}
                mapClassName="h-[min(22rem,45vh)] min-h-64"
                focusStop={focusRequest}
                distanceActualKm={timeline.progress.distanceActualKm}
              />
            </div>
          </TabsContent>
          <TabsContent value="timeline" className="mt-3">
            <Card id="tracking-bitacora" data-tracking-section="feed">
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {trackingCopy.section.timeline}
                </CardTitle>
                {timeline.events.length === 0 ? (
                  <CardDescription>{trackingCopy.state.noEvents}</CardDescription>
                ) : (
                  <CardDescription>
                    {trackingCopy.hint.timelineHasEvents}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {timeline.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {trackingCopy.state.timelineEmpty}
                  </p>
                ) : (
                  <DetailTimeline
                    items={timeline.events.map((event) => {
                      const relatedStop = event.stopId
                        ? stopsById.get(event.stopId)
                        : undefined;
                      const EventIcon = resolveTrackingEventIcon(
                        event.eventType,
                      );
                      const timelineBody = getTrackingEventTimelineBody(event);
                      const incidentMeta =
                        event.eventType === "incident"
                          ? getTrackingIncidentTimelineMeta(event)
                          : [];
                      const showIncidentClosedChip =
                        shouldShowIncidentClosedChip(
                          event.eventType,
                          timeline.trip.hasOpenIncident,
                        );
                      const falseTripMeta =
                        event.eventType === "false_trip_declared"
                          ? getFalseTripDeclaredTimelineMeta(
                              event,
                              falseTripDeclaredBy,
                            )
                          : [];
                      const hasDetail =
                        Boolean(timelineBody) ||
                        incidentMeta.length > 0 ||
                        Boolean(event.stopId) ||
                        typeof event.payload?.cargo_description === "string" ||
                        (event.latitude != null && event.longitude != null) ||
                        falseTripMeta.length > 0;
                      return {
                        id: event.id,
                        icon: <EventIcon className="h-4 w-4" />,
                        completed:
                          event.eventType === "trip_arrived" ||
                          event.eventType === "stop_departed" ||
                          event.eventType === "false_trip_declared",
                        content: (
                          <div className="min-w-0 py-0.5">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <p className="text-sm font-medium">
                                {formatTrackingEventLabel(
                                  event.eventType,
                                  relatedStop,
                                )}
                              </p>
                              {showIncidentClosedChip ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-normal shrink-0"
                                >
                                  {trackingCopy.hint.incidentClosedChip}
                                </Badge>
                              ) : null}
                              <p className="text-xs text-muted-foreground tabular-nums">
                                {formatDateTime(
                                  event.occurredAt.toISOString(),
                                )}
                              </p>
                            </div>
                            {hasDetail ? (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-xs text-muted-foreground">
                                  {trackingCopy.action.timelineMore}
                                </summary>
                                {falseTripMeta.length > 0 ? (
                                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                    {falseTripMeta.map((line) => (
                                      <li key={line}>{line}</li>
                                    ))}
                                  </ul>
                                ) : null}
                                {typeof event.payload?.cargo_description ===
                                "string" ? (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {event.payload.cargo_description}
                                  </p>
                                ) : null}
                                {event.latitude != null &&
                                event.longitude != null ? (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {trackingCopy.hint.timelineLocationSaved}
                                  </p>
                                ) : null}
                                {timelineBody ? (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {timelineBody}
                                  </p>
                                ) : null}
                                {incidentMeta.length > 0 ? (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {incidentMeta.join(" · ")}
                                  </p>
                                ) : null}
                                {event.stopId
                                  ? (() => {
                                      const stopLabel =
                                        stopTimelineLabelsById.get(
                                          event.stopId,
                                        );
                                      if (!stopLabel) return null;
                                      return (
                                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                          <p>{stopLabel.primary}</p>
                                          {stopLabel.secondary ? (
                                            <p>{stopLabel.secondary}</p>
                                          ) : null}
                                        </div>
                                      );
                                    })()
                                  : null}
                              </details>
                            ) : null}
                          </div>
                        ),
                      };
                    })}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <TripTrackingStopWorkbenchSheet
        open={workbenchSheetOpen}
        onOpenChange={(open) => {
          if (!open) setWorkbenchRequestedStopId(null);
        }}
        row={currentStopRow}
        tripStatus={tripStatus}
        orderedStops={orderedStops}
        cargos={cargos}
        tripInProgress={
          canMutateCargo && tripStatus === TripStatus.IN_PROGRESS
        }
        pendingCargoAction={pendingCargoAction}
        getCargoStatusVariant={getCargoStatusVariant}
        onCargoAction={handleCargoAction}
        canMutateCargo={canMutateCargo}
      />

      {canOperateTracking ? (
        <>
          <StartTripSheet
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            driverId={driverId}
            tripStartMileage={tripStartMileage}
            originStop={originStop}
            originBranchId={originBranchId}
            cfdiEmissionIntent={cfdiEmissionIntent}
            cargos={cargos}
            open={startSheetOpen}
            onOpenChange={setStartSheetOpen}
            isDriverPortal={isDriverPortal}
          />
          <RegisterTripArrivalSheet
            tripId={tripId}
            tripCode={tripCode}
            tripStartMileage={tripStartMileage}
            plannedDistanceKm={timeline.progress.distancePlannedKm}
            scheduledDeparture={timeline.trip.scheduledDeparture ?? undefined}
            actualDeparture={timeline.trip.actualDeparture ?? undefined}
            destinationStop={destinationAwaitingClosure ?? null}
            displayOrder={destinationClosureOrder}
            cargos={cargos}
            orderedStops={orderedStops}
            cfdiEmissionIntent={cfdiEmissionIntent}
            requiresFiscalAttention={requiresFiscalAttention}
            hasOpenIncident={timeline.trip.hasOpenIncident}
            isDriverPortal={isDriverPortal}
            open={tripArrivalSheetOpen}
            onOpenChange={setTripArrivalSheetOpen}
          />
          <QuickCloseTripSheet
            tripId={tripId}
            tripCode={tripCode}
            tripStartMileage={tripStartMileage}
            plannedDistanceKm={timeline.progress.distancePlannedKm}
            stops={orderedStops}
            scheduledDeparture={timeline.trip.scheduledDeparture ?? undefined}
            actualDeparture={timeline.trip.actualDeparture ?? undefined}
            destinationStop={destinationStop}
            cargos={cargos}
            cfdiEmissionIntent={cfdiEmissionIntent}
            requiresFiscalAttention={requiresFiscalAttention}
            hasOpenIncident={timeline.trip.hasOpenIncident}
            isDriverPortal={isDriverPortal}
            open={quickCloseSheetOpen}
            onOpenChange={setQuickCloseSheetOpen}
          />
          <RegisterStopTrackingEventSheet
            tripId={tripId}
            mode="arrival"
            stop={nextStopForArrival ?? null}
            displayOrder={nextArrivalOrder}
            open={arrivalSheetOpen}
            onOpenChange={setArrivalSheetOpen}
          />
          <RegisterStopTrackingEventSheet
            tripId={tripId}
            mode="departure"
            stop={activeEscalaForDeparture ?? null}
            displayOrder={activeDepartureOrder}
            cargos={cargos}
            orderedStops={orderedStops}
            open={departureSheetOpen}
            onOpenChange={setDepartureSheetOpen}
          />
          <DepartOriginSheet
            tripId={tripId}
            originStop={originAwaitingDeparture ?? originStop ?? null}
            displayOrder={originDepartureOrder ?? (originStop ? 1 : undefined)}
            cargos={cargos}
            orderedStops={orderedStops}
            open={departOriginSheetOpen}
            onOpenChange={setDepartOriginSheetOpen}
          />
          <DeclareFalseTripSheet
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            tripStartMileage={tripStartMileage}
            open={falseTripSheetOpen}
            onOpenChange={setFalseTripSheetOpen}
            onSuccess={onCargosChanged}
            isDriverPortal={isDriverPortal}
          />
          <RegisterTrackingNoteSheet
            tripId={tripId}
            referenceStop={evidenceReferenceStopForSheets}
            associatedStopId={evidenceAssociateMeta?.id}
            associatedStopLabel={evidenceAssociateMeta?.label}
            open={noteSheetOpen}
            onOpenChange={handleNoteSheetOpenChange}
          />
          <RegisterTrackingIncidentSheet
            tripId={tripId}
            referenceStop={evidenceReferenceStopForSheets}
            associatedStopId={evidenceAssociateMeta?.id}
            associatedStopLabel={evidenceAssociateMeta?.label}
            open={incidentSheetOpen}
            onOpenChange={handleIncidentSheetOpenChange}
          />
          <CloseTrackingIncidentSheet
            tripId={tripId}
            open={closeIncidentSheetOpen}
            onOpenChange={setCloseIncidentSheetOpen}
          />
        </>
      ) : null}
    </div>
  );
}
