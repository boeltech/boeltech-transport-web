import { useEffect, useMemo, useState } from "react";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { DetailAlertCard } from "@shared/ui/data-display";
import { DetailTimeline } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Play,
  RefreshCw,
  Route,
  StickyNote,
} from "lucide-react";
import { getOrderedStops, type TripStatusType } from "@features/trips/domain";
import { useTripTimeline } from "@features/trips/application";
import { formatStopTimelineLabel } from "../uiHelpers";
import {
  formatArrivalButtonLabel,
  formatDepartureButtonLabel,
  formatStopActionTooltip,
  formatTripArrivalButtonLabel,
  resolveStopDisplayOrder,
} from "./trackingActionLabels";
import { formatTrackingEventLabel } from "./trackingEventLabels";
import {
  findActiveEscalaForDeparture,
  findDestinationAwaitingTripArrival,
  findNextStopForArrival,
} from "./trackingStopEligibility";
import { TripTrackingMap } from "./TripTrackingMap";
import { StartTripDialog } from "./StartTripDialog";
import {
  formatDataUpdatedAgo,
  getTrackingScopeAlertItems,
  RegisterStopTrackingEventSheet,
  RegisterTripArrivalSheet,
  RegisterTrackingIncidentSheet,
  RegisterTrackingNoteSheet,
  getTrackingEventTimelineBody,
  getTrackingIncidentTimelineMeta,
  TripTrackingOperationalItinerary,
  trackingCopy,
} from "./trip-tracking";
import { isOriginStop } from "./trackingStopEligibility";

interface TripTrackingTabProps {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  tripStartMileage?: number | null;
  status: TripStatusType;
}

export function TripTrackingTab({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  status,
}: TripTrackingTabProps) {
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [tripArrivalSheetOpen, setTripArrivalSheetOpen] = useState(false);
  const [arrivalSheetOpen, setArrivalSheetOpen] = useState(false);
  const [departureSheetOpen, setDepartureSheetOpen] = useState(false);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [incidentSheetOpen, setIncidentSheetOpen] = useState(false);
  const [refreshTickMs, setRefreshTickMs] = useState(() => Date.now());

  const timelineQuery = useTripTimeline(tripId);

  useEffect(() => {
    if (status !== "in_progress") return;
    const id = window.setInterval(() => setRefreshTickMs(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, [status]);
  const timeline = timelineQuery.data;
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
  const destinationAwaitingClosure = useMemo(
    () => findDestinationAwaitingTripArrival(orderedStops),
    [orderedStops],
  );
  const nextArrivalOrder = useMemo(
    () =>
      nextStopForArrival
        ? resolveStopDisplayOrder(orderedStops, nextStopForArrival.id)
        : undefined,
    [nextStopForArrival, orderedStops],
  );
  const activeDepartureOrder = useMemo(
    () =>
      activeEscalaForDeparture
        ? resolveStopDisplayOrder(orderedStops, activeEscalaForDeparture.id)
        : undefined,
    [activeEscalaForDeparture, orderedStops],
  );
  const arrivalButtonLabel = useMemo(
    () => formatArrivalButtonLabel(nextStopForArrival, nextArrivalOrder),
    [nextStopForArrival, nextArrivalOrder],
  );
  const departureButtonLabel = useMemo(
    () =>
      formatDepartureButtonLabel(
        activeEscalaForDeparture,
        activeDepartureOrder,
      ),
    [activeEscalaForDeparture, activeDepartureOrder],
  );
  const arrivalButtonTitle = useMemo(() => {
    if (!nextStopForArrival || nextArrivalOrder == null) return undefined;
    return formatStopActionTooltip(nextStopForArrival, nextArrivalOrder);
  }, [nextStopForArrival, nextArrivalOrder]);
  const departureButtonTitle = useMemo(() => {
    if (!activeEscalaForDeparture || activeDepartureOrder == null) {
      return undefined;
    }
    return formatStopActionTooltip(
      activeEscalaForDeparture,
      activeDepartureOrder,
    );
  }, [activeEscalaForDeparture, activeDepartureOrder]);
  const destinationClosureOrder = useMemo(
    () =>
      destinationAwaitingClosure
        ? resolveStopDisplayOrder(orderedStops, destinationAwaitingClosure.id)
        : undefined,
    [destinationAwaitingClosure, orderedStops],
  );
  const tripArrivalButtonLabel = useMemo(
    () =>
      formatTripArrivalButtonLabel(
        destinationAwaitingClosure,
        destinationClosureOrder,
      ),
    [destinationAwaitingClosure, destinationClosureOrder],
  );
  const tripArrivalButtonTitle = useMemo(() => {
    if (!destinationAwaitingClosure || destinationClosureOrder == null) {
      return undefined;
    }
    return formatStopActionTooltip(
      destinationAwaitingClosure,
      destinationClosureOrder,
    );
  }, [destinationAwaitingClosure, destinationClosureOrder]);

  const scopeAlertItems = useMemo(
    () =>
      getTrackingScopeAlertItems(
        status,
        timeline?.trip.hasOpenIncident ?? false,
      ),
    [status, timeline?.trip.hasOpenIncident],
  );

  const originStop = useMemo(
    () => orderedStops.find((stop) => isOriginStop(stop)),
    [orderedStops],
  );
  const referenceStopForGps = useMemo(
    () =>
      activeEscalaForDeparture ??
      nextStopForArrival ??
      destinationAwaitingClosure ??
      null,
    [
      activeEscalaForDeparture,
      nextStopForArrival,
      destinationAwaitingClosure,
    ],
  );
  const updatedAgoLabel = useMemo(() => {
    if (!timelineQuery.dataUpdatedAt) return null;
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

  const latestEvent = timeline?.events[0] ?? null;

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

  const canStart = status === "scheduled";
  const canOperateStops = status === "in_progress";
  const canArrive = canOperateStops && !!nextStopForArrival;
  const canDepart = canOperateStops && !!activeEscalaForDeparture;
  const canCloseAtDestination =
    canOperateStops && !!destinationAwaitingClosure;
  const startButtonTitle = canStart
    ? undefined
    : trackingCopy.error.startRequiresScheduled;
  const arriveButtonTitle = canArrive
    ? arrivalButtonTitle
    : trackingCopy.error.arriveRequiresInProgress;
  const departButtonTitle = canDepart
    ? departureButtonTitle
    : trackingCopy.error.departRequiresEscala;
  const closeButtonTitle = canCloseAtDestination
    ? tripArrivalButtonTitle
    : trackingCopy.error.closeRequiresDestination;
  const registerButtonTitle = canOperateStops
    ? undefined
    : trackingCopy.error.registerRequiresInProgress;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {status === "in_progress" ? (
            <Badge variant="secondary" className="text-xs">
              {trackingCopy.state.live}
            </Badge>
          ) : null}
          {updatedAgoLabel ? (
            <span>Actualizado {updatedAgoLabel}</span>
          ) : null}
          {timelineQuery.isFetching ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {trackingCopy.state.syncing}
            </span>
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

      <DetailAlertCard
        severity={timeline.trip.hasOpenIncident ? "warning" : "info"}
        icon={<Route className="h-4 w-4" />}
        title={trackingCopy.section.status}
        items={scopeAlertItems}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progreso</CardDescription>
            <CardTitle className="text-2xl">
              {timeline.progress.percentComplete}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {timeline.progress.stopsCompleted}/{timeline.progress.stopsTotal}{" "}
            paradas completadas
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Distancia planificada</CardDescription>
            <CardTitle className="text-2xl">
              {timeline.progress.distancePlannedKm != null
                ? `${timeline.progress.distancePlannedKm.toLocaleString("es-MX")} km`
                : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Calculada desde las paradas del viaje
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Distancia real</CardDescription>
            <CardTitle className="text-2xl">
              {timeline.progress.distanceActualKm != null
                ? `${timeline.progress.distanceActualKm.toLocaleString("es-MX")} km`
                : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            total_dist_rec proyectado por tracking
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ETA</CardDescription>
            <CardTitle className="text-base">
              {timeline.progress.estimatedArrival
                ? formatDateTime(timeline.progress.estimatedArrival.toISOString())
                : "Sin ETA"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Basado en la programacion del viaje
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <TripTrackingOperationalItinerary
          stops={orderedStops}
          tripStatus={status}
          tripTimes={tripScheduleTimes}
        />

        <Card className="xl:sticky xl:top-24">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              {trackingCopy.section.actions}
            </CardTitle>
            <CardDescription>{trackingCopy.hint.actionsScope}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Operativas
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  onClick={() => setStartDialogOpen(true)}
                  disabled={!canStart}
                  title={startButtonTitle}
                  className="justify-start sm:w-auto"
                >
                  <Play className="mr-2 h-4 w-4 shrink-0" />
                  {trackingCopy.action.start}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setArrivalSheetOpen(true)}
                  disabled={!canArrive}
                  title={arriveButtonTitle}
                  className="justify-start sm:max-w-xs"
                >
                  <MapPin className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{arrivalButtonLabel}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDepartureSheetOpen(true)}
                  disabled={!canDepart}
                  title={departButtonTitle}
                  className="justify-start sm:max-w-xs"
                >
                  <Navigation className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{departureButtonLabel}</span>
                </Button>
                <Button
                  variant={canCloseAtDestination ? "default" : "outline"}
                  onClick={() => setTripArrivalSheetOpen(true)}
                  disabled={!canCloseAtDestination}
                  title={closeButtonTitle}
                  className="justify-start sm:max-w-xs"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{tripArrivalButtonLabel}</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Registro
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNoteSheetOpen(true)}
                  disabled={!canOperateStops}
                  title={registerButtonTitle}
                >
                  <StickyNote className="mr-2 h-4 w-4" />
                  {trackingCopy.action.note}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIncidentSheetOpen(true)}
                  disabled={!canOperateStops}
                  title={registerButtonTitle}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {trackingCopy.action.incident}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {trackingCopy.section.timeline}
            </CardTitle>
            {latestEvent ? (
              <CardDescription>
                Ultimo evento:{" "}
                {formatTrackingEventLabel(
                  latestEvent.eventType,
                  latestEvent.stopId
                    ? stopsById.get(latestEvent.stopId)
                    : undefined,
                )}
              </CardDescription>
            ) : (
              <CardDescription>
                {trackingCopy.state.noEvents} operativos registrados.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {timeline.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavia no hay eventos para este viaje.
              </p>
            ) : (
              <DetailTimeline
                items={timeline.events.map((event) => {
                  const relatedStop = event.stopId
                    ? stopsById.get(event.stopId)
                    : undefined;
                  const eventIcon =
                    event.eventType === "incident"
                      ? AlertTriangle
                      : event.eventType === "note"
                        ? StickyNote
                        : event.eventType === "trip_departed"
                          ? Play
                          : event.eventType === "trip_arrived"
                            ? CheckCircle2
                            : event.eventType === "stop_departed"
                              ? Navigation
                              : MapPin;
                  const EventIcon = eventIcon;
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
                        {event.latitude != null ||
                        timelineBody ||
                        incidentMeta.length > 0 ||
                        event.stopId ? (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-muted-foreground">
                              Ver detalle
                            </summary>
                            {event.latitude != null && event.longitude != null ? (
                              <p className="mt-1 font-mono text-xs text-muted-foreground">
                                GPS: {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
                                {event.accuracyMeters != null
                                  ? ` · ~${Math.round(event.accuracyMeters)} m`
                                  : null}
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

      <StartTripDialog
        tripId={tripId}
        tripCode={tripCode}
        vehicleId={vehicleId}
        tripStartMileage={tripStartMileage}
        originStop={originStop}
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
      />
      <RegisterTripArrivalSheet
        tripId={tripId}
        tripCode={tripCode}
        vehicleId={vehicleId}
        tripStartMileage={tripStartMileage}
        destinationStop={destinationAwaitingClosure ?? null}
        displayOrder={destinationClosureOrder}
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
        open={departureSheetOpen}
        onOpenChange={setDepartureSheetOpen}
      />
      <RegisterTrackingNoteSheet
        tripId={tripId}
        referenceStop={referenceStopForGps}
        open={noteSheetOpen}
        onOpenChange={setNoteSheetOpen}
      />
      <RegisterTrackingIncidentSheet
        tripId={tripId}
        referenceStop={referenceStopForGps}
        open={incidentSheetOpen}
        onOpenChange={setIncidentSheetOpen}
      />
    </div>
  );
}
