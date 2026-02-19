/**
 * TripDetailPage
 * FSD: Pages Layer - Composition
 *
 * ACTUALIZADO: Alineado con el Wizard de Creación
 * - Stops obtenidos de trip.stops (ya vienen en useTrip, no requiere useTripStops)
 * - stopType como StopTypeValue[] (array) — soporta tipos compuestos
 * - Tabs: Resumen, Ruta, Cargas, Costos, Historial
 * - Preparado para cargos y expenses (cuando el backend los incluya)
 *
 * Clean Architecture: Page compone componentes de Presentation + hooks de Application
 */

import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Progress } from "@shared/ui/progress";
import { Skeleton } from "@shared/ui/skeleton";
import { Separator } from "@shared/ui/separator";

import {
  useTrip,
  useMarkStopVisited,
  calculateDistance,
  calculateTripDuration,
  formatDisplayDate,
  formatDuration,
  formatMileage,
  formatCurrency,
  getStopTypeConfig,
  getStatusConfig,
} from "@/features/trips";

import {
  type TripStatusType,
  type StopTypeValue,
  type ExpenseCategoryType,
  TripStatus,
  TRIP_STATUS_LABELS,
  STOP_TYPE_LABELS,
  EXPENSE_CATEGORY_LABELS,
  getOrderedStops,
  calculateStopsProgress,
} from "@features/trips/domain";

import { useToast } from "@shared/hooks";
import {
  ArrowLeft,
  Play,
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
  FileText,
  History,
  Receipt,
  Phone,
  Weight,
  Box,
  CircleDollarSign,
} from "lucide-react";
import {
  TripActions,
  TripStatusBadgeAnimated,
} from "@features/trips/presentation";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene la config visual para un stopType que puede ser string | string[]
 * Para arrays compuestos (["origin", "pickup"]), retorna la config del primer tipo
 * y un label combinado.
 */
function getStopDisplayConfig(
  stopType: StopTypeValue | StopTypeValue[] | string | string[],
) {
  const types = Array.isArray(stopType) ? stopType : [stopType];
  const primaryType = types[0] as StopTypeValue;
  const config = getStopTypeConfig(primaryType);

  if (types.length > 1) {
    const labels = types.map((t) => STOP_TYPE_LABELS[t as StopTypeValue] || t);
    return { ...config, label: labels.join(" + ") };
  }

  return config;
}

// ============================================================================
// SUB-COMPONENTS
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: trip, isLoading, refetch } = useTrip(id || "");

  // Stops: usar trip.stops si disponible, fallback a useTripStops
  // const { data: stopsFromQuery = [] } = useTripStops(id || "", {
  //   enabled: !!id && !trip?.stops,
  // });
  // const stops = trip?.stops ?? stopsFromQuery;

  const stops = trip?.stops ?? [];
  const orderedStops = getOrderedStops(stops);

  // Cargos y expenses del trip (cuando el backend los incluya)
  const cargos = trip?.cargos ?? [];
  const expenses = trip?.expenses ?? [];

  // ── Mutations ────────────────────────────────────────────────────────────
  const markVisitedMutation = useMarkStopVisited({
    onSuccess: () =>
      toast({ title: "Parada marcada como visitada", variant: "success" }),
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) return <TripDetailSkeleton />;

  // ── Not Found ────────────────────────────────────────────────────────────
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

  // ── Calculated values ────────────────────────────────────────────────────
  const distance = calculateDistance(trip.mileage);
  const duration = calculateTripDuration(trip);
  const progress = calculateStopsProgress(stops);

  // Totales de cargos
  const totalRevenue = cargos.reduce((sum, c) => sum + (c.rate || 0), 0);
  const totalCargoWeight = cargos.reduce((sum, c) => sum + (c.weight || 0), 0);

  // Totales de expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Tab count badges
  const cargoCount = cargos.length;
  const expenseCount = expenses.length;

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
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
            <TripStatusBadgeAnimated status={trip.status} size="sm" />
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

        <TripActions
          tripId={trip.id}
          tripCode={trip.tripCode}
          status={trip.status}
          variant="buttons"
          onActionComplete={refetch}
        />
      </div>

      {/* ================================================================ */}
      {/* TABS                                                             */}
      {/* ================================================================ */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="route">
            Ruta {orderedStops.length > 0 && `(${orderedStops.length})`}
          </TabsTrigger>
          <TabsTrigger value="cargo">
            Cargas {cargoCount > 0 && `(${cargoCount})`}
          </TabsTrigger>
          <TabsTrigger value="costs">Costos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* TAB: RESUMEN                                                  */}
        {/* ============================================================ */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* ── Información del Viaje ──────────────────────────────── */}
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

            {/* ── Unidad y Conductor ─────────────────────────────────── */}
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

            {/* ── Kilometraje ────────────────────────────────────────── */}
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

          {/* ── Origen y Destino ──────────────────────────────────────── */}
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

          {/* ── Resumen de Carga (legacy fields) ─────────────────────── */}
          {(trip.cargo.description ||
            trip.cargo.weight ||
            trip.cargo.volume) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" /> Información General de Carga
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

          {/* ── Notas ────────────────────────────────────────────────── */}
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

          {/* ── Razón de Cancelación ─────────────────────────────────── */}
          {trip.cancellationReason && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-600 dark:text-red-400">
                  Razón de Cancelación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {trip.cancellationReason}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: RUTA                                                     */}
        {/* ============================================================ */}
        <TabsContent value="route" className="space-y-4 mt-4">
          {/* Progress Bar for In-Progress Trips */}
          {trip.status === TripStatus.IN_PROGRESS &&
            orderedStops.length > 0 && (
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
          {orderedStops.length === 0 ? (
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
              {orderedStops.map((stop, index) => {
                const config = getStopDisplayConfig(stop.stopType);
                const isVisited = !!stop.actualArrival;
                const isLast = index === orderedStops.length - 1;
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
                            ? "bg-emerald-100 border-emerald-500 dark:bg-emerald-900/30"
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
                            {/* Stop Type + Sequence */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                #{stop.sequenceOrder}
                              </span>
                              {/* Badges para tipos compuestos */}
                              {Array.isArray(stop.stopType) &&
                                stop.stopType.length > 1 &&
                                stop.stopType.map((type) => {
                                  const typeConfig = getStopTypeConfig(
                                    type as StopTypeValue,
                                  );
                                  return (
                                    <Badge
                                      key={type}
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        typeConfig.color,
                                      )}
                                    >
                                      {typeConfig.label}
                                    </Badge>
                                  );
                                })}
                            </div>

                            {/* Address */}
                            <p className="text-sm">{stop.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {stop.city}
                              {stop.state && `, ${stop.state}`}
                              {stop.postalCode && ` ${stop.postalCode}`}
                            </p>

                            {/* Location name */}
                            {stop.locationName && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{" "}
                                {stop.locationName}
                              </p>
                            )}

                            {/* Contact */}
                            {stop.contactName && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" /> {stop.contactName}
                                {stop.contactPhone && (
                                  <span className="flex items-center gap-1 ml-2">
                                    <Phone className="h-3 w-3" />
                                    {stop.contactPhone}
                                  </span>
                                )}
                              </p>
                            )}

                            {/* Cargo action */}
                            {stop.cargoActionDescription && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Package className="h-3 w-3" />{" "}
                                {stop.cargoActionDescription}
                              </p>
                            )}

                            {/* Cargo weight/units on stop */}
                            {(stop.cargoWeight || stop.cargoUnits) && (
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                {stop.cargoWeight && (
                                  <span>Peso: {stop.cargoWeight} kg</span>
                                )}
                                {stop.cargoUnits && (
                                  <span>Unidades: {stop.cargoUnits}</span>
                                )}
                              </div>
                            )}

                            {/* Distance to next */}
                            {stop.distanceToNextKm != null &&
                              stop.distanceToNextKm > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Distancia al siguiente:{" "}
                                  {stop.distanceToNextKm} km
                                </p>
                              )}

                            {/* Times */}
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

                            {/* Notes */}
                            {stop.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {stop.notes}
                              </p>
                            )}
                          </div>

                          {/* Mark Visited Button */}
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

        {/* ============================================================ */}
        {/* TAB: CARGAS                                                   */}
        {/* ============================================================ */}
        <TabsContent value="cargo" className="space-y-4 mt-4">
          {cargos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No hay cargas registradas para este viaje.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Las cargas detalladas se registran en el wizard de creación.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Resumen de cargas */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>Total Cargas</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{cargoCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Weight className="h-4 w-4" />
                      <span>Peso Total</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {totalCargoWeight > 0
                        ? `${totalCargoWeight.toLocaleString("es-MX")} kg`
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CircleDollarSign className="h-4 w-4" />
                      <span>Ingreso Total</span>
                    </div>
                    <p className="text-2xl font-bold mt-1 text-emerald-600">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de cargas */}
              <div className="space-y-3">
                {cargos.map((cargo) => (
                  <Card key={cargo.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {cargo.description}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {cargo.status}
                            </Badge>
                          </div>

                          {cargo.client && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {cargo.client.legalName}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                            {cargo.weight && (
                              <span>Peso: {cargo.weight} kg</span>
                            )}
                            {cargo.units && (
                              <span>Unidades: {cargo.units}</span>
                            )}
                            {cargo.volume && (
                              <span>Volumen: {cargo.volume} m³</span>
                            )}
                            {cargo.declaredValue && (
                              <span>
                                Valor: {formatCurrency(cargo.declaredValue)}
                              </span>
                            )}
                          </div>

                          {/* Movements */}
                          {cargo.movements && cargo.movements.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {cargo.movements.map((movement, idx) => {
                                const stopForMovement = orderedStops.find(
                                  (s) =>
                                    s.id === movement.stopId ||
                                    s.sequenceOrder === movement.stopIndex,
                                );
                                return (
                                  <div
                                    key={movement.id || idx}
                                    className="flex items-center gap-2 text-xs text-muted-foreground"
                                  >
                                    {movement.movementType === "pickup" ? (
                                      <Package className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <Box className="h-3 w-3 text-orange-500" />
                                    )}
                                    <span className="capitalize">
                                      {movement.movementType === "pickup"
                                        ? "Recoger"
                                        : "Entregar"}
                                    </span>
                                    {stopForMovement && (
                                      <span>
                                        en {stopForMovement.city}
                                        {stopForMovement.locationName &&
                                          ` (${stopForMovement.locationName})`}
                                      </span>
                                    )}
                                    {movement.weight && (
                                      <span>• {movement.weight} kg</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {cargo.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {cargo.notes}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-semibold text-emerald-600">
                            {formatCurrency(cargo.rate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cargo.currency || "MXN"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: COSTOS                                                   */}
        {/* ============================================================ */}
        <TabsContent value="costs" className="space-y-4 mt-4">
          {/* Desglose base */}
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

          {/* Gastos detallados del wizard */}
          {expenses.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> Gastos Detallados
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {expenseCount} gastos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {expense.description}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {EXPENSE_CATEGORY_LABELS[
                              expense.category as ExpenseCategoryType
                            ] || expense.category}
                          </Badge>
                        </div>
                        {expense.vendorName && (
                          <p className="text-xs text-muted-foreground">
                            {expense.vendorName}
                          </p>
                        )}
                      </div>
                      <span className="font-medium shrink-0 ml-4">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  ))}

                  <Separator className="my-2" />
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Total Gastos Detallados</span>
                    <span>{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: HISTORIAL                                                */}
        {/* ============================================================ */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {!trip.statusHistory || trip.statusHistory.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No hay historial de cambios disponible.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" /> Historial de Estados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {trip.statusHistory.map((entry, index) => {
                    const isLast = index === trip.statusHistory!.length - 1;
                    const statusConfig = getStatusConfig(
                      entry.newStatus as TripStatusType,
                    );
                    const StatusIcon = statusConfig?.icon || FileText;

                    return (
                      <div key={entry.id} className="flex gap-4">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center border-2",
                              statusConfig?.bgColor ||
                                "bg-gray-100 dark:bg-gray-800",
                              statusConfig?.borderColor || "border-gray-300",
                            )}
                          >
                            <StatusIcon
                              className={cn(
                                "h-4 w-4",
                                statusConfig?.color || "text-gray-500",
                              )}
                            />
                          </div>
                          {!isLast && (
                            <div className="w-0.5 flex-1 min-h-[24px] bg-muted-foreground/20" />
                          )}
                        </div>

                        {/* Entry content */}
                        <div className="pb-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {TRIP_STATUS_LABELS[
                                entry.newStatus as TripStatusType
                              ] || entry.newStatus}
                            </span>
                            {entry.previousStatus && (
                              <span className="text-xs text-muted-foreground">
                                (desde{" "}
                                {TRIP_STATUS_LABELS[
                                  entry.previousStatus as TripStatusType
                                ] || entry.previousStatus}
                                )
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDisplayDate(entry.changedAt)}
                            {entry.changedByName && ` • ${entry.changedByName}`}
                          </p>
                          {entry.reason && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {entry.reason}
                            </p>
                          )}
                          {entry.mileage != null && (
                            <p className="text-xs text-muted-foreground">
                              Kilometraje: {formatMileage(entry.mileage)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
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
      <Skeleton className="h-10 w-96" />

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
