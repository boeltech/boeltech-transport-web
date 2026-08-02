import { useEffect, useMemo, useState } from "react";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { DetailAlertCard } from "@shared/ui/data-display";
import { DetailTimeline } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  Clock,
  Loader2,
  RefreshCw,
  Route,
} from "lucide-react";
import { getOrderedStops, TripStatus, type TripStatusType, type TripStop, type TripCargo } from "@features/trips/domain";
import {
  useTripTimeline,
  useUpdateCargo,
} from "@features/trips/application";
import { formatStopTimelineLabel } from "../uiHelpers";
import { formatTrackingEventLabel } from "./trackingEventLabels";
import { resolveTrackingEventIcon } from "./trackingEventIcons";
import {
  findActiveEscalaForDeparture,
  findDestinationAwaitingTripArrival,
  findNextStopForArrival,
  findOriginAwaitingDeparture,
} from "./trackingStopEligibility";
import { TripTrackingMap } from "./TripTrackingMap";
import {
  formatDataUpdatedAgo,
  getTrackingScopeAlertItems,
  RegisterStopTrackingEventSheet,
  RegisterTripArrivalSheet,
  RegisterTrackingIncidentSheet,
  RegisterTrackingNoteSheet,
  StartTripSheet,
  DepartOriginSheet,
  getTrackingEventTimelineBody,
  getTrackingIncidentTimelineMeta,
  TripTrackingStopsCargosMasterDetail,
  trackingCopy,
} from "./trip-tracking";
import {
  cargoActionToStatus,
  type CargoManualAction,
} from "../utils/cargoStatusActions";
import { getCargoStatusVariant } from "./trip-cargos/tripCargoDetailHelpers";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { tripDetailCopy } from "../copy";
import { isOriginStop } from "./trackingStopEligibility";

interface TripTrackingTabProps {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  driverId?: string;
  tripStartMileage?: number | null;
  status: TripStatusType;
  /** Cargas del page-level `useTripCargos` (misma query key; no duplicar observer). */
  cargos?: readonly TripCargo[];
  onCargosChanged?: () => void;
}

export function TripTrackingTab({
  tripId,
  tripCode,
  vehicleId,
  driverId,
  tripStartMileage,
  status,
  cargos: cargosProp = [],
  onCargosChanged,
}: TripTrackingTabProps) {
  const { hasPermission } = usePermissions();
  const canOperateTracking =
    hasPermission("trips", "update") ||
    hasPermission("trips", "updateStatus");
  const [startSheetOpen, setStartSheetOpen] = useState(false);
  const [tripArrivalSheetOpen, setTripArrivalSheetOpen] = useState(false);
  const [arrivalSheetOpen, setArrivalSheetOpen] = useState(false);
  const [departureSheetOpen, setDepartureSheetOpen] = useState(false);
  const [departOriginSheetOpen, setDepartOriginSheetOpen] = useState(false);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [incidentSheetOpen, setIncidentSheetOpen] = useState(false);
  /** Parada elegida al abrir evidencia desde el detail; null = fallback operativo. */
  const [evidenceReferenceStop, setEvidenceReferenceStop] =
    useState<TripStop | null>(null);
  const [refreshTickMs, setRefreshTickMs] = useState(() => Date.now());
  const [pendingCargoAction, setPendingCargoAction] = useState<{
    cargoId: string;
    action: CargoManualAction;
  } | null>(null);
  const { toast } = useToast();

  const timelineQuery = useTripTimeline(tripId);
  const timeline = timelineQuery.data;
  const tripStatus = timeline?.trip.status ?? status;

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
      toast({
        title: tripDetailCopy.cargo.toast.deliverError,
        description: error.message,
        variant: "destructive",
      });
      setPendingCargoAction(null);
    },
  });

  const handleCargoAction = (cargoId: string, action: CargoManualAction) => {
    if (!canOperateTracking) return;
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

  const scopeAlertItems = useMemo(
    () =>
      getTrackingScopeAlertItems(
        tripStatus,
        timeline?.trip.hasOpenIncident ?? false,
      ),
    [tripStatus, timeline?.trip.hasOpenIncident],
  );

  const originStop = useMemo(
    () => orderedStops.find((stop) => isOriginStop(stop)),
    [orderedStops],
  );
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

  const isArrivalOverdue = useMemo(() => {
    const eta = timeline?.progress.estimatedArrival;
    if (eta == null) return false;
    if (
      tripStatus !== TripStatus.IN_PROGRESS &&
      tripStatus !== TripStatus.SCHEDULED
    ) {
      return false;
    }
    return eta.getTime() < refreshTickMs;
  }, [timeline?.progress.estimatedArrival, tripStatus, refreshTickMs]);

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
            No se pudo cargar la informacion de seguimiento.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => timelineQuery.refetch()}
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canOperateStops =
    canOperateTracking && tripStatus === TripStatus.IN_PROGRESS;

  const openNoteSheet = (stop: TripStop | null = null) => {
    if (!canOperateTracking) return;
    setEvidenceReferenceStop(stop);
    setNoteSheetOpen(true);
  };

  const openIncidentSheet = (stop: TripStop | null = null) => {
    if (!canOperateTracking) return;
    setEvidenceReferenceStop(stop);
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

  const evidenceReferenceStopForSheets =
    evidenceReferenceStop ?? referenceStopForGps;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {tripStatus === TripStatus.IN_PROGRESS ? (
            <Badge variant="secondary" className="text-xs">
              {trackingCopy.state.live}
            </Badge>
          ) : null}
          {updatedAgoLabel ? (
            <span>Actualizado {updatedAgoLabel}</span>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => timelineQuery.refetch()}
          disabled={timelineQuery.isFetching}
        >
          {timelineQuery.isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {trackingCopy.action.refresh}
        </Button>
      </div>

      {scopeAlertItems.length > 0 ? (
        <DetailAlertCard
          severity={timeline.trip.hasOpenIncident ? "warning" : "info"}
          icon={<Route className="h-4 w-4" />}
          title={trackingCopy.section.status}
          items={scopeAlertItems}
        />
      ) : null}

      <TripTrackingStopsCargosMasterDetail
        stops={orderedStops}
        tripStatus={tripStatus}
        tripTimes={tripScheduleTimes}
        cargos={cargos}
        progress={timeline.progress}
        actualDeparture={timeline.trip.actualDeparture ?? null}
        overdue={isArrivalOverdue}
        pendingCargoAction={pendingCargoAction}
        onCargoAction={handleCargoAction}
        getCargoStatusVariant={getCargoStatusVariant}
        canOperateTracking={canOperateTracking}
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
          canOperateTracking ? () => setDepartOriginSheetOpen(true) : undefined
        }
        onCloseTrip={
          canOperateTracking ? () => setTripArrivalSheetOpen(true) : undefined
        }
        onRegisterNote={canOperateTracking ? openNoteSheet : undefined}
        onRegisterIncident={
          canOperateTracking ? openIncidentSheet : undefined
        }
        canRegisterEvidence={canOperateStops}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {trackingCopy.section.timeline}
            </CardTitle>
            {timeline.events.length === 0 ? (
              <CardDescription>
                {trackingCopy.state.noEvents} operativos registrados.
              </CardDescription>
            ) : (
              <CardDescription>
                Registro de operaciones del viaje.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {timeline.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay eventos para este viaje.
              </p>
            ) : (
              <DetailTimeline
                items={timeline.events.map((event) => {
                  const relatedStop = event.stopId
                    ? stopsById.get(event.stopId)
                    : undefined;
                  const EventIcon = resolveTrackingEventIcon(event.eventType);
                  const timelineBody = getTrackingEventTimelineBody(event);
                  const incidentMeta =
                    event.eventType === "incident"
                      ? getTrackingIncidentTimelineMeta(event)
                      : [];
                  return {
                    id: event.id,
                    icon: <EventIcon className="h-4 w-4" />,
                    completed:
                      event.eventType === "trip_arrived" ||
                      event.eventType === "stop_departed",
                    content: (
                      <div className="rounded-md border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {formatTrackingEventLabel(
                              event.eventType,
                              relatedStop,
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(event.occurredAt.toISOString())}
                          </p>
                        </div>
                        {timelineBody ||
                        incidentMeta.length > 0 ||
                        event.stopId ||
                        event.payload?.cargo_description ||
                        (event.latitude != null && event.longitude != null) ? (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-muted-foreground">
                              Ver más
                            </summary>
                            {typeof event.payload?.cargo_description === "string" ? (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {event.payload.cargo_description}
                              </p>
                            ) : null}
                            {event.latitude != null && event.longitude != null ? (
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
                            {event.stopId ? (() => {
                              const stopLabel = stopTimelineLabelsById.get(event.stopId);
                              if (!stopLabel) return null;
                              return (
                                <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                  <p>{stopLabel.primary}</p>
                                  {stopLabel.secondary ? (
                                    <p>{stopLabel.secondary}</p>
                                  ) : null}
                                </div>
                              );
                            })() : null}
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

        <TripTrackingMap
          stops={orderedStops}
          events={timeline.events}
          routeGeojson={timeline.map.routeGeojson}
          lastKnownPosition={timeline.map.lastKnownPosition}
        />
      </div>

      {canOperateTracking ? (
        <>
          <StartTripSheet
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            driverId={driverId}
            tripStartMileage={tripStartMileage}
            originStop={originStop}
            open={startSheetOpen}
            onOpenChange={setStartSheetOpen}
          />
          <RegisterTripArrivalSheet
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            tripStartMileage={tripStartMileage}
            scheduledDeparture={timeline.trip.scheduledDeparture ?? undefined}
            actualDeparture={timeline.trip.actualDeparture ?? undefined}
            destinationStop={destinationAwaitingClosure ?? null}
            displayOrder={destinationClosureOrder}
            cargos={cargos}
            orderedStops={orderedStops}
            open={tripArrivalSheetOpen}
            onOpenChange={setTripArrivalSheetOpen}
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
          <RegisterTrackingNoteSheet
            tripId={tripId}
            referenceStop={evidenceReferenceStopForSheets}
            open={noteSheetOpen}
            onOpenChange={handleNoteSheetOpenChange}
          />
          <RegisterTrackingIncidentSheet
            tripId={tripId}
            referenceStop={evidenceReferenceStopForSheets}
            open={incidentSheetOpen}
            onOpenChange={handleIncidentSheetOpenChange}
          />
        </>
      ) : null}
    </div>
  );
}
