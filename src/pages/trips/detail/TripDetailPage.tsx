/**
 * TripDetailPage
 * FSD: Pages Layer - Composition
 *
 * ACTUALIZADO: Alineado con el Backend
 * - Campos alineados con estructura del backend
 * - Sección de origen/destino agregada
 * - Helpers de UI incluidos
 */

import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Progress } from "@shared/ui/progress";
import { Skeleton } from "@shared/ui/skeleton";
import { Badge } from "@shared/ui/badge";
import { Separator } from "@shared/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@shared/ui/alert-dialog";

import {
  useTrip,
  useTripStops,
  useStartTrip,
  useCancelTrip,
  useDeleteTrip,
  useMarkStopVisited,
  calculateDistance,
  formatDisplayDate,
  formatDuration,
  formatMileage,
  formatCurrency,
  getStopTypeConfig,
} from "@/features/trips";

import {
  type TripStatusType,
  TripStatus,
  TRIP_STATUS_LABELS,
  canEditTrip,
  canDeleteTrip,
  canStartTrip,
  canCancelTrip,
  canFinishTrip,
  calculateTripDuration,
  calculateStopsProgress,
} from "@features/trips/domain";

import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Building2,
  Truck,
  User,
  Calendar,
  Clock,
  Gauge,
  DollarSign,
  MapPin,
  Check,
  Package,
  Navigation,
} from "lucide-react";
import { TRIP_STATUS_BADGE_COLORS } from "@features/trips/presentation";

// ============================================================================
// COMPONENTS
// ============================================================================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-sm text-muted-foreground min-w-[80px]">
        {label}
      </span>
      <span className="text-sm font-medium truncate">{value}</span>
    </div>
  );
}

interface TripStatusBadgeProps {
  status: TripStatusType;
}

function TripStatusBadge({ status }: TripStatusBadgeProps) {
  return (
    <Badge className={cn("font-medium", TRIP_STATUS_BADGE_COLORS[status])}>
      {TRIP_STATUS_LABELS[status]}
    </Badge>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // Queries
  const { data: trip, isLoading } = useTrip(id || "");
  const { data: stops = [] } = useTripStops(id || "");

  // Mutations
  const startMutation = useStartTrip({
    onSuccess: () => toast({ title: "Viaje iniciado", variant: "success" }),
    onError: (e) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useCancelTrip({
    onSuccess: () => toast({ title: "Viaje cancelado", variant: "success" }),
    onError: (e) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useDeleteTrip({
    onSuccess: () => {
      toast({ title: "Viaje eliminado", variant: "success" });
      navigate("/trips");
    },
    onError: (e) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markVisitedMutation = useMarkStopVisited({
    onSuccess: () =>
      toast({ title: "Parada marcada como visitada", variant: "success" }),
    onError: (e) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Loading state
  if (isLoading) return <TripDetailSkeleton />;

  // Not found state
  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Viaje no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El viaje que buscas no existe o fue eliminado.
        </p>
        <Button onClick={() => navigate("/trips")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Viajes
        </Button>
      </div>
    );
  }

  // Permissions & capabilities
  const userCanEdit =
    hasPermission("trips", "update") && canEditTrip(trip.status);
  const userCanDelete =
    hasPermission("trips", "delete") && canDeleteTrip(trip.status);
  const tripCanStart = canStartTrip(trip.status);
  const tripCanFinish = canFinishTrip(trip.status);
  const tripCanCancel = canCancelTrip(trip.status);

  // Calculated values
  const distance = calculateDistance(trip.mileage);
  const duration = calculateTripDuration(trip);
  const progress = calculateStopsProgress(stops);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/trips")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{trip.tripCode}</h1>
            <TripStatusBadge status={trip.status} />
          </div>
          <div className="pl-12 space-y-1">
            {trip.client && (
              <p className="text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" /> {trip.client.legalName}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {trip.originCity} → {trip.destinationCity}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-0">
          {tripCanStart && (
            <Button
              onClick={() => startMutation.mutate(trip.id)}
              disabled={startMutation.isPending}
            >
              <Play className="mr-2 h-4 w-4" /> Iniciar Viaje
            </Button>
          )}

          {tripCanFinish && (
            <Button onClick={() => navigate(`/trips/${trip.id}/finish`)}>
              <CheckCircle className="mr-2 h-4 w-4" /> Finalizar
            </Button>
          )}

          {tripCanCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <XCircle className="mr-2 h-4 w-4" /> Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar viaje?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El viaje será marcado como
                    cancelado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, volver</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelMutation.mutate({ id: trip.id })}
                  >
                    Sí, cancelar viaje
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {userCanEdit && (
            <Button
              variant="outline"
              onClick={() => navigate(`/trips/${trip.id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </Button>
          )}

          {userCanDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar viaje?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente el viaje{" "}
                    {trip.tripCode} y todos sus datos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteMutation.mutate(trip.id)}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="route">
            Ruta {stops.length > 0 && `(${stops.length})`}
          </TabsTrigger>
          <TabsTrigger value="costs">Costos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Trip Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Información del Viaje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Salida"
                  value={formatDisplayDate(trip.scheduledDeparture)}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Llegada Est."
                  value={formatDisplayDate(trip.scheduledArrival)}
                />
                {trip.actualDeparture && (
                  <InfoRow
                    icon={<Play className="h-4 w-4 text-blue-500" />}
                    label="Salida Real"
                    value={formatDisplayDate(trip.actualDeparture)}
                  />
                )}
                {trip.actualArrival && (
                  <InfoRow
                    icon={<Check className="h-4 w-4 text-emerald-500" />}
                    label="Llegada Real"
                    value={formatDisplayDate(trip.actualArrival)}
                  />
                )}
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Duración"
                  value={formatDuration(duration)}
                />
              </CardContent>
            </Card>

            {/* Vehicle & Driver */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Unidad y Conductor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trip.vehicle ? (
                  <>
                    <InfoRow
                      icon={<Truck className="h-4 w-4" />}
                      label="Unidad"
                      value={trip.vehicle.unitNumber}
                    />
                    <InfoRow
                      icon={<Truck className="h-4 w-4" />}
                      label="Placa"
                      value={trip.vehicle.licensePlate}
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin vehículo asignado
                  </p>
                )}

                <Separator className="my-2" />

                {trip.driver ? (
                  <InfoRow
                    icon={<User className="h-4 w-4" />}
                    label="Conductor"
                    value={trip.driver.fullName}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin conductor asignado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Mileage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gauge className="h-4 w-4" /> Kilometraje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  icon={<Gauge className="h-4 w-4" />}
                  label="Inicial"
                  value={formatMileage(trip.mileage.start)}
                />
                <InfoRow
                  icon={<Gauge className="h-4 w-4" />}
                  label="Final"
                  value={formatMileage(trip.mileage.end)}
                />
                <Separator className="my-2" />
                <InfoRow
                  icon={<Navigation className="h-4 w-4" />}
                  label="Distancia"
                  value={formatMileage(distance)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Origin & Destination */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" /> Origen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{trip.originAddress}</p>
                <p className="text-sm text-muted-foreground">
                  {trip.originCity}
                  {trip.originState && `, ${trip.originState}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" /> Destino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{trip.destinationAddress}</p>
                <p className="text-sm text-muted-foreground">
                  {trip.destinationCity}
                  {trip.destinationState && `, ${trip.destinationState}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cargo Info */}
          {(trip.cargo.description ||
            trip.cargo.weight ||
            trip.cargo.volume) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" /> Información de Carga
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trip.cargo.description && (
                  <p className="mb-2">{trip.cargo.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  {trip.cargo.weight && (
                    <span className="text-muted-foreground">
                      Peso:{" "}
                      <span className="font-medium">
                        {trip.cargo.weight} kg
                      </span>
                    </span>
                  )}
                  {trip.cargo.volume && (
                    <span className="text-muted-foreground">
                      Volumen:{" "}
                      <span className="font-medium">
                        {trip.cargo.volume} m³
                      </span>
                    </span>
                  )}
                  {trip.cargo.units && (
                    <span className="text-muted-foreground">
                      Unidades:{" "}
                      <span className="font-medium">{trip.cargo.units}</span>
                    </span>
                  )}
                  {trip.cargo.value && (
                    <span className="text-muted-foreground">
                      Valor:{" "}
                      <span className="font-medium">
                        {formatCurrency(trip.cargo.value)}
                      </span>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {trip.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{trip.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Route Tab */}
        <TabsContent value="route" className="space-y-4 mt-4">
          {/* Progress Bar for In-Progress Trips */}
          {trip.status === TripStatus.IN_PROGRESS && stops.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso de la ruta</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stops List */}
          {stops.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No hay paradas registradas para este viaje.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {stops.map((stop, index) => {
                const config = getStopTypeConfig(stop.stopType);
                const isVisited = !!stop.actualArrival;
                const isLast = index === stops.length - 1;
                const canMarkVisited =
                  trip.status === TripStatus.IN_PROGRESS && !isVisited;

                const IconComponent = config.icon;

                return (
                  <div key={stop.id} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center border-2",
                          isVisited
                            ? "bg-emerald-100 border-emerald-500"
                            : "bg-background border-muted-foreground/30",
                        )}
                      >
                        {isVisited ? (
                          <Check className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <IconComponent
                            className={cn("h-5 w-5", config.color)}
                          />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={cn(
                            "w-0.5 flex-1 min-h-[40px]",
                            isVisited
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/30",
                          )}
                        />
                      )}
                    </div>

                    {/* Stop Card */}
                    <Card
                      className={cn("flex-1 mb-4", isVisited && "opacity-75")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                #{stop.sequenceOrder}
                              </span>
                            </div>
                            <p className="text-sm">{stop.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {stop.city}
                              {stop.state && `, ${stop.state}`}
                              {stop.postalCode && ` ${stop.postalCode}`}
                            </p>
                            {stop.locationName && (
                              <p className="text-sm text-muted-foreground">
                                📍 {stop.locationName}
                              </p>
                            )}
                            {stop.estimatedArrival && !isVisited && (
                              <p className="text-xs text-muted-foreground">
                                Llegada est.:{" "}
                                {formatDisplayDate(stop.estimatedArrival)}
                              </p>
                            )}
                            {stop.actualArrival && (
                              <p className="text-xs text-emerald-600 font-medium">
                                ✓ Llegada:{" "}
                                {formatDisplayDate(stop.actualArrival)}
                              </p>
                            )}
                            {stop.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {stop.notes}
                              </p>
                            )}
                          </div>

                          {canMarkVisited && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                markVisitedMutation.mutate({
                                  tripId: trip.id,
                                  stopId: stop.id,
                                })
                              }
                              disabled={markVisitedMutation.isPending}
                            >
                              <Check className="mr-1 h-4 w-4" /> Marcar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Desglose de Costos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Tarifa Base</span>
                  <span className="font-medium">
                    {formatCurrency(trip.costs.baseRate)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Combustible</span>
                  <span className="font-medium">
                    {formatCurrency(trip.costs.fuelCost)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Casetas</span>
                  <span className="font-medium">
                    {formatCurrency(trip.costs.tollCost)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Otros Gastos</span>
                  <span className="font-medium">
                    {formatCurrency(trip.costs.otherCosts)}
                  </span>
                </div>
                <div className="flex justify-between py-3 text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatCurrency(trip.costs.totalCost)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function TripDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-64" />

      {/* Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default TripDetailPage;
