import { useMemo, useState } from "react";
import { useToast } from "@shared/hooks/useToast";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { DetailTimeline } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Play,
  Route,
  StickyNote,
} from "lucide-react";
import { getOrderedStops, type TripStatusType } from "@features/trips/domain";
import {
  useRegisterTrackingEvent,
  useTripTimeline,
} from "@features/trips/application";
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
import { RegisterTripArrivalDialog } from "./RegisterTripArrivalDialog";

interface TripTrackingTabProps {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  tripStartMileage?: number | null;
  status: TripStatusType;
}

function randomIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : undefined;
}

export function TripTrackingTab({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  status,
}: TripTrackingTabProps) {
  const { toast } = useToast();
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [tripArrivalDialogOpen, setTripArrivalDialogOpen] = useState(false);
  const timelineQuery = useTripTimeline(tripId);
  const registerEventMutation = useRegisterTrackingEvent({
    onSuccess: () => {
      toast({ title: "Evento de seguimiento registrado", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "No se pudo registrar el evento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
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

  const handleArriveStop = () => {
    if (!nextStopForArrival) return;
    registerEventMutation.mutate({
      tripId,
      event: {
        eventType: "stop_arrived",
        stopId: nextStopForArrival.id,
        occurredAt: new Date().toISOString(),
        idempotencyKey: randomIdempotencyKey(),
      },
    });
  };

  const handleDepartStop = () => {
    if (!activeEscalaForDeparture) return;
    registerEventMutation.mutate({
      tripId,
      event: {
        eventType: "stop_departed",
        stopId: activeEscalaForDeparture.id,
        occurredAt: new Date().toISOString(),
        idempotencyKey: randomIdempotencyKey(),
      },
    });
  };

  const handleCreateNote = () => {
    const note = window.prompt("Nota operativa:");
    if (!note?.trim()) return;
    registerEventMutation.mutate({
      tripId,
      event: {
        eventType: "note",
        notes: note.trim(),
        occurredAt: new Date().toISOString(),
        idempotencyKey: randomIdempotencyKey(),
      },
    });
  };

  const handleCreateIncident = () => {
    const description = window.prompt("Describe el incidente:");
    if (!description?.trim()) return;
    registerEventMutation.mutate({
      tripId,
      event: {
        eventType: "incident",
        occurredAt: new Date().toISOString(),
        idempotencyKey: randomIdempotencyKey(),
        payload: {
          incident_type: "other",
          severity: "medium",
          description: description.trim(),
          requires_assistance: false,
        },
      },
    });
  };

  const isBusy = registerEventMutation.isPending;
  const canStart = status === "scheduled";
  const canOperateStops = status === "in_progress";
  const canArrive = canOperateStops && !!nextStopForArrival;
  const canDepart = canOperateStops && !!activeEscalaForDeparture;
  const canCloseAtDestination =
    canOperateStops && !!destinationAwaitingClosure;

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            Acciones de seguimiento
          </CardTitle>
          <CardDescription>
            Al iniciar el viaje se registran la salida del origen en el timeline.
            En escalas: llegada y salida. En destino: llegada y luego «Cerrar en
            destino» (odómetro final) para completar la parada y el viaje.
            El historial de estados del viaje está en la pestaña Historial.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            onClick={() => setStartDialogOpen(true)}
            disabled={!canStart || isBusy}
          >
            <Play className="mr-2 h-4 w-4" />
            Iniciar viaje
          </Button>
          <Button
            variant="outline"
            onClick={handleArriveStop}
            disabled={!canArrive || isBusy}
            title={arrivalButtonTitle}
            className="max-w-full sm:max-w-xs"
          >
            <MapPin className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{arrivalButtonLabel}</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleDepartStop}
            disabled={!canDepart || isBusy}
            title={departureButtonTitle}
            className="max-w-full sm:max-w-xs"
          >
            <Navigation className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{departureButtonLabel}</span>
          </Button>
          <Button
            variant="default"
            onClick={() => setTripArrivalDialogOpen(true)}
            disabled={!canCloseAtDestination || isBusy}
            title={tripArrivalButtonTitle}
            className="max-w-full sm:max-w-xs"
          >
            <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{tripArrivalButtonLabel}</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateNote}
            disabled={!canOperateStops || isBusy}
          >
            <StickyNote className="mr-2 h-4 w-4" />
            Nota
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateIncident}
            disabled={!canOperateStops || isBusy}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Incidente
          </Button>
          {timeline.trip.hasOpenIncident ? (
            <Badge variant="destructive" className="ml-auto">
              Incidente abierto
            </Badge>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Timeline operativo
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
                Sin eventos operativos registrados aun.
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
                        {event.notes ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {event.notes}
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
          lastKnownPosition={timeline.map.lastKnownPosition}
        />
      </div>

      <StartTripDialog
        tripId={tripId}
        tripCode={tripCode}
        vehicleId={vehicleId}
        tripStartMileage={tripStartMileage}
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
      />
      <RegisterTripArrivalDialog
        tripId={tripId}
        tripCode={tripCode}
        vehicleId={vehicleId}
        tripStartMileage={tripStartMileage}
        open={tripArrivalDialogOpen}
        onOpenChange={setTripArrivalDialogOpen}
      />
    </div>
  );
}
