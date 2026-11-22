import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailTimeline } from "@shared/ui/data-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDateTime, formatTime } from "@shared/utils/dateUtils";
import {
  AlertTriangle,
  Ban,
  Clock,
  Flag,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  StickyNote,
} from "lucide-react";
import {
  getOrderedStops,
  TripStatus,
  type CfdiEmissionIntent,
  type TripOperationalOutcomeType,
  type TripStatusType,
  type TripStop,
  type TripCargo,
} from "@features/trips/domain";
import {
  useSyncTripDetailOnTimelineEvents,
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
} from "./trackingStopEligibility";
import { TripTrackingMap } from "./TripTrackingMap";
import {
  QuickCloseTripSheet,
  RegisterTrackingIncidentSheet,
  RegisterTrackingNoteSheet,
  DeclareFalseTripSheet,
  CloseTrackingIncidentSheet,
  getTrackingEventTimelineBody,
  getTrackingIncidentTimelineMeta,
  getFalseTripDeclaredTimelineMeta,
  getReturnPlannedTimelineTitle,
  getReturnPlannedTimelineMeta,
  shouldShowIncidentClosedChip,
  TrackingStatesLegend,
  TripTrackingContactCard,
  TripTrackingIncidentStrip,
  TripTrackingStopsTimeline,
  TripTrackingStopWorkbenchSheet,
  buildTrackingItineraryRows,
  isTrackingCurrentStop,
  resolveLatestIncidentDetail,
  resolveTrackingCurrentStopId,
  resolveTrackingTrafficLight,
  canDeclareFalseTrip,
  canQuickCloseTrip,
  trackingCopy,
  type TrackingContactInfo,
  type TrackingOperationalFocusRequest,
} from "./trip-tracking";
import {
  cargoActionToStatus,
  type CargoManualAction,
} from "../utils/cargoStatusActions";
import { sinCfdiCargoBlockReason } from "../utils/tripSinCfdiCargoGating";
import { getCargoStatusVariant } from "./trip-cargos/tripCargoDetailHelpers";
import { useToast } from "@shared/hooks";
import { isClientPortalRole, isDriverPortalRole } from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import { tripDetailCopy } from "../copy";
import { showTripDetailErrorToast } from "../helpers/toastTripDetailError";

/**
 * Abrir Sheet desde DropdownMenu: diferir un tick para que Radix no dispare
 * onFocusOutside (regla sheet-from-menu-focus).
 */
function openSheetFromMenu(open: (() => void) | undefined) {
  if (!open) return;
  window.setTimeout(open, 0);
}

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
  /** Solicitud Sin factura abierta: al iniciar, el API la cancela (D6). */
  pendingSinCfdiRequest?: boolean;
  /** ADR-0079: nombre del declarante (fallback de bitácora; no UUID). */
  falseTripDeclaredBy?: string | null;
  /**
   * T4-043: `trip.invoicing.hasActiveSplit` — bloquea CTA de viaje en falso.
   */
  hasActiveSplit?: boolean;
  /** ADR-0093 — soft-warn al finalizar. */
  requiresFiscalAttention?: boolean;
  /** F3b — GET aditivos de desenlace. */
  originNoCargoPendingOutcome?: boolean;
  returnReplanRequired?: boolean;
  onPlanReturn?: () => void;
  /** F6: contacto flota (ya en detalle de viaje; sin fetch extra). */
  contact?: TrackingContactInfo | null;
  onCargosChanged?: () => void;
}

export function TripTrackingTab({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  status,
  cargos: cargosProp = [],
  operationalOutcome,
  cfdiEmissionIntent,
  falseTripDeclaredBy = null,
  hasActiveSplit = false,
  requiresFiscalAttention = false,
  originNoCargoPendingOutcome = false,
  returnReplanRequired = false,
  onPlanReturn,
  contact = null,
  onCargosChanged,
}: TripTrackingTabProps) {
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isDriverPortal = isDriverPortalRole(role);
  const isClientPortal = isClientPortalRole(role);
  const [searchParams, setSearchParams] = useSearchParams();
  const canUpdateTrip = hasPermission("trips", "update");
  const canOperateTracking =
    canUpdateTrip ||
    hasPermission("trips", "updateStatus") ||
    hasPermission("trips", "execute");
  /** Mutaciones de carga requieren `trips.update` (API); no inventar ACL. */
  const canMutateCargo = canUpdateTrip;
  const [quickCloseSheetOpen, setQuickCloseSheetOpen] = useState(false);
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
  const [pendingCargoAction, setPendingCargoAction] = useState<{
    cargoId: string;
    action: CargoManualAction;
  } | null>(null);
  const [refreshTickMs, setRefreshTickMs] = useState(() => Date.now());
  const { toast } = useToast();

  const timelineQuery = useTripTimeline(tripId);
  const timeline = timelineQuery.data;
  const refreshTripDetail = useSyncTripDetailOnTimelineEvents(
    tripId,
    timeline?.events,
  );
  /** Prefer page prop when timeline cache still shows a divergent status. */
  const tripStatus =
    timeline?.trip.status === status
      ? timeline.trip.status
      : status;

  useEffect(() => {
    if (tripStatus !== TripStatus.IN_PROGRESS) return;
    const id = window.setInterval(() => setRefreshTickMs(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, [tripStatus]);

  /** F3b: deep-link Qué sigue → Declarar falso (antes de early-return loading). */
  useEffect(() => {
    if (searchParams.get("intent") !== "declare_false") return;
    if (isClientPortal || !canOperateTracking) return;
    setFalseTripSheetOpen(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("intent");
        return next;
      },
      { replace: true },
    );
  }, [
    searchParams,
    isClientPortal,
    canOperateTracking,
    setSearchParams,
  ]);

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
  const originAwaitingDeparture = useMemo(
    () => findOriginAwaitingDeparture(orderedStops),
    [orderedStops],
  );
  const activeEscalaForDeparture = useMemo(
    () => findActiveEscalaForDeparture(orderedStops),
    [orderedStops],
  );
  const nextStopForArrival = useMemo(
    () => findNextStopForArrival(orderedStops),
    [orderedStops],
  );
  const destinationAwaitingClosure = useMemo(
    () => findDestinationAwaitingTripArrival(orderedStops),
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

  const estimatedArrivalLabel = useMemo(() => {
    const eta = timeline?.progress.estimatedArrival;
    if (!eta) return null;
    return trackingCopy.label.arrivesAt(formatTime(eta.toISOString()));
  }, [timeline?.progress.estimatedArrival]);

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

  const quickCloseEligible =
    !isClientPortal &&
    canOperateTracking &&
    canQuickCloseTrip(tripStatus, orderedStops, cargos, operationalOutcome, {
      originNoCargoPendingOutcome,
      returnReplanRequired,
    });
  const quickCloseCargoBlockReason = quickCloseEligible
    ? sinCfdiCargoBlockReason(cfdiEmissionIntent, cargos, "complete")
    : null;
  const showsQuickCloseCta = quickCloseEligible;

  const declareFalseTripDomainEligible = canDeclareFalseTrip({
    tripStatus,
    stops: orderedStops,
    cargos,
    hasActiveRevenueSplit: false,
    cfdiEmissionIntent,
    operationalOutcome,
  });
  const declareFalseTripBaseEligible =
    !isClientPortal &&
    canOperateTracking &&
    declareFalseTripDomainEligible;
  const showsDeclareFalseTripCta =
    declareFalseTripBaseEligible && !hasActiveSplit;
  const showsDeclareFalseTripSplitBlockHint =
    declareFalseTripBaseEligible && hasActiveSplit;

  const showBitacoraMoreActions =
    !isClientPortal &&
    canOperateTracking &&
    (showsQuickCloseCta ||
      showsDeclareFalseTripCta ||
      showsDeclareFalseTripSplitBlockHint);

  const openNoteSheet = (stop: TripStop | null = null) => {
    if (!canOperateTracking) return;
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

    setWorkbenchRequestedStopId(null);
  };

  const refreshBitacora = () => {
    void timelineQuery.refetch();
    refreshTripDetail();
  };

  return (
    <div className="space-y-4" data-tracking-layout="operate-seguimiento">
      {/* D35 / Q8 — incidente abierto: franja + Llamar / Cerrar */}
      {timeline.trip.hasOpenIncident ? (
        <TripTrackingIncidentStrip
          summary={openIncidentSummary}
          callPhone={contact?.driverPhone}
          canClose={canOperateTracking}
          onClose={() => setCloseIncidentSheetOpen(true)}
        />
      ) : null}

      {/* Artboard: Paradas+Contacto | Mapa+Bitácora (sin strip ni segundo Qué sigue) */}
      <section
        className="grid items-start gap-4 lg:grid-cols-[minmax(280px,400px)_minmax(0,1fr)]"
        data-tracking-section="consulta"
        aria-label={trackingCopy.section.consulta}
      >
        <div className="space-y-4 min-w-0">
          <TripTrackingStopsTimeline
            rows={itineraryRows}
            orderedStops={orderedStops}
            tripStatus={tripStatus}
            cargos={cargos}
            selectedStopId={railSelectedEffectiveId}
            onSelectStop={handleRailSelect}
            selectionHint={railSelectionHint}
            trafficLight={trafficLight}
            estimatedArrivalLabel={estimatedArrivalLabel}
            onCargoAction={canMutateCargo ? handleCargoAction : undefined}
            pendingCargoAction={pendingCargoAction}
            canMutateCargo={canMutateCargo}
            returnReplanRequired={returnReplanRequired}
            onPlanReturn={onPlanReturn}
            getCargoStatusVariant={getCargoStatusVariant}
          />
          <TrackingStatesLegend showCargo={cargos.length > 0} />
          <TripTrackingContactCard contact={contact} />
        </div>

        <div className="space-y-4 min-w-0">
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
          <Card id="tracking-bitacora" data-tracking-section="feed">
            <CardHeader className="space-y-2 pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {trackingCopy.section.bitacora}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <CardDescription>
                      {trackingCopy.hint.timelineHasEvents}
                    </CardDescription>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground"
                      aria-label={trackingCopy.action.refreshBitacoraAria}
                      title={trackingCopy.action.refreshBitacoraTitle}
                      disabled={timelineQuery.isFetching}
                      onClick={refreshBitacora}
                    >
                      {timelineQuery.isFetching ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                {canOperateTracking && !isClientPortal ? (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {showBitacoraMoreActions ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={trackingCopy.action.moreActions}
                            data-tracking-section="bitacora-more-actions"
                          >
                            <MoreHorizontal className="mr-1.5 h-3.5 w-3.5" />
                            {trackingCopy.action.moreActions}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          {showsQuickCloseCta ? (
                            <DropdownMenuItem
                              disabled={Boolean(quickCloseCargoBlockReason)}
                              title={quickCloseCargoBlockReason ?? undefined}
                              onSelect={() => {
                                if (quickCloseCargoBlockReason) return;
                                openSheetFromMenu(() =>
                                  setQuickCloseSheetOpen(true),
                                );
                              }}
                            >
                              <Flag className="mr-2 h-4 w-4" />
                              {trackingCopy.action.quickClose}
                            </DropdownMenuItem>
                          ) : null}
                          {showsDeclareFalseTripCta ? (
                            <DropdownMenuItem
                              onSelect={() =>
                                openSheetFromMenu(() =>
                                  setFalseTripSheetOpen(true),
                                )
                              }
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              {trackingCopy.action.declareFalseTrip}
                            </DropdownMenuItem>
                          ) : null}
                          {showsDeclareFalseTripSplitBlockHint ? (
                            <DropdownMenuItem
                              disabled
                              title={
                                trackingCopy.hint.declareFalseTripBlockedBySplit
                              }
                            >
                              <Ban className="mr-2 h-4 w-4 shrink-0" />
                              <span className="flex min-w-0 flex-col gap-0.5">
                                <span>
                                  {trackingCopy.action.declareFalseTrip}
                                </span>
                                <span className="text-xs font-normal text-muted-foreground whitespace-normal">
                                  {
                                    trackingCopy.hint
                                      .declareFalseTripBlockedBySplit
                                  }
                                </span>
                              </span>
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canOperateStops}
                      title={
                        !canOperateStops
                          ? trackingCopy.error.registerRequiresInProgress
                          : undefined
                      }
                      onClick={() => openIncidentSheet()}
                    >
                      <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                      {trackingCopy.action.incident}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canOperateStops}
                      title={
                        !canOperateStops
                          ? trackingCopy.error.registerRequiresInProgress
                          : undefined
                      }
                      onClick={() => openNoteSheet()}
                    >
                      <StickyNote className="mr-1.5 h-3.5 w-3.5" />
                      {trackingCopy.action.note}
                    </Button>
                  </div>
                ) : null}
              </div>
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
                    const returnPlannedTitle =
                      event.eventType === "return_planned"
                        ? getReturnPlannedTimelineTitle(event)
                        : null;
                    const returnPlannedMeta =
                      event.eventType === "return_planned"
                        ? getReturnPlannedTimelineMeta(event)
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
                              {returnPlannedTitle ??
                                formatTrackingEventLabel(
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
                          {returnPlannedMeta.length > 0 ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {returnPlannedMeta.join(" · ")}
                            </p>
                          ) : null}
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
        </div>
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
