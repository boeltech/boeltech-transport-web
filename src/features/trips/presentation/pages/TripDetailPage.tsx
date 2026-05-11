/**
 * TripDetailPage
 * FSD: Pages Layer - Composition
 *
 * ACTUALIZADO: Integración con hooks de Cargas y Gastos (Enfoque B)
 * - useTripCargos: Obtiene cargas del viaje via endpoint separado
 * - useTripExpenses: Obtiene gastos del viaje via endpoint separado
 * - useTripExpensesSummary: Obtiene resumen de gastos
 * - Tabs: Resumen, Ruta, Cargas, Costos, Historial
 *
 * Clean Architecture: Page compone componentes de Presentation + hooks de Application
 */

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  InfoRow,
  DetailTimeline,
  DetailAlertCard,
} from "@shared/ui/data-display";
import { Progress } from "@shared/ui/progress";
import { Skeleton } from "@shared/ui/skeleton";
import { Separator } from "@shared/ui/separator";
import {
  AlertCircle,
  Building2,
  Truck,
  User,
  Users,
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
  RefreshCw,
  Plus,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// ── Hooks de Application Layer ─────────────────────────────────────────────
import {
  useTrip,
  useMarkStopVisited,
  useUpdateCargo,
  // Nuevos hooks para cargas y gastos
  useTripCargos,
  useTripExpenses,
  useTripExpensesSummary,
  // Helpers
  calculateDistance,
  calculateTripDuration,
  formatDuration,
  formatMileage,
  formatCurrency,
  formatStopDisplayLocalityLine,
  formatStopDisplayPrimaryLine,
  getStopTypeConfig,
} from "@/features/trips";

// ── Domain Types ───────────────────────────────────────────────────────────
import {
  type TripStatusType,
  type StopTypeValue,
  type ExpenseCategoryType,
  type ExpenseStatusType,
  type CargoStatusType,
  TripStatus,
  CargoStatus,
  TRIP_STATUS_LABELS,
  STOP_TYPE_LABELS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  CARGO_STATUS_LABELS,
  getOrderedStops,
  calculateStopsProgress,
} from "@features/trips/domain";

import { useToast } from "@shared/hooks";
import {
  getTripStatusConfig,
  TripActions,
  TripInvoiceActions,
  TripStatusBadge,
} from "@features/trips/presentation";
import { formatDateTime } from "@shared/utils/dateUtils";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene la config visual para un stopType que puede ser string | string[]
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

/**
 * Obtiene el color del badge según el status del gasto
 */
function getExpenseStatusVariant(
  status: ExpenseStatusType,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
}

/**
 * Obtiene el color del badge según el status de la carga
 */
function getCargoStatusVariant(
  status: CargoStatusType,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "delivered":
      return "default";
    case "in_transit":
      return "secondary";
    case "cancelled":
    case "returned":
      return "destructive";
    default:
      return "outline";
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Skeleton para la sección de cargas
 */
function CargosSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-64" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para la sección de gastos
 */
function ExpensesSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between py-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Componente de error con retry
 */
function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="py-6 text-center">
        <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
        <p className="text-sm text-muted-foreground mb-3">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const tripId = id || "";

  // ══════════════════════════════════════════════════════════════════════════
  // QUERIES
  // ══════════════════════════════════════════════════════════════════════════

  // Query principal del viaje
  const {
    data: trip,
    isLoading: isLoadingTrip,
    refetch: refetchTrip,
  } = useTrip(tripId);

  // Query de cargas (endpoint separado)
  const {
    data: cargos = [],
    isLoading: isLoadingCargos,
    isError: isErrorCargos,
    refetch: refetchCargos,
  } = useTripCargos(tripId, {
    enabled: !!tripId,
  });

  // Query de gastos (endpoint separado)
  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    isError: isErrorExpenses,
    refetch: refetchExpenses,
  } = useTripExpenses(tripId, {
    enabled: !!tripId,
  });

  // Query de resumen de gastos
  const { data: expensesSummary } = useTripExpensesSummary(tripId, {
    enabled: !!tripId,
  });

  // Stops del viaje (vienen en el trip o se pueden obtener separados)
  const stops = trip?.stops ?? [];
  const orderedStops = getOrderedStops(stops);

  // ══════════════════════════════════════════════════════════════════════════
  // MUTATIONS
  // ══════════════════════════════════════════════════════════════════════════

  const markVisitedMutation = useMarkStopVisited({
    onSuccess: () => {
      toast({ title: "Parada marcada como visitada", variant: "success" });
      refetchTrip();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deliverCargoMutation = useUpdateCargo(tripId, {
    onSuccess: () => {
      toast({ title: "Carga marcada como entregada", variant: "success" });
      refetchCargos();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const [comparisonNowMs, setComparisonNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setComparisonNowMs(Date.now());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const tripAlerts = useMemo(() => {
    if (!trip) return undefined;

    const cards: ReactElement[] = [];

    if (trip.status === TripStatus.SCHEDULED) {
      const missing: { label?: string; text: string }[] = [];
      if (!trip.vehicle) {
        missing.push({ label: "Vehículo", text: "Sin unidad asignada." });
      }
      if (!trip.driver) {
        missing.push({
          label: "Conductor",
          text: "Sin conductor asignado.",
        });
      }
      if (missing.length > 0) {
        cards.push(
          <DetailAlertCard
            key="assignment-incomplete"
            severity="warning"
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Viaje programado sin asignación completa"
            items={missing}
          />,
        );
      }
    }

    if (
      (trip.status === TripStatus.SCHEDULED ||
        trip.status === TripStatus.IN_PROGRESS) &&
      trip.scheduledArrival &&
      !trip.actualArrival &&
      trip.scheduledArrival.getTime() < comparisonNowMs
    ) {
      cards.push(
        <DetailAlertCard
          key="eta-passed"
          severity="warning"
          icon={<Clock className="h-5 w-5" />}
          title="Tiempo de llegada estimado superado"
          items={[
            {
              label: "Llegada estimada",
              text: formatDateTime(trip.scheduledArrival.toISOString()),
            },
          ]}
        />,
      );
    }

    if (
      trip.status === TripStatus.IN_PROGRESS &&
      (!trip.vehicle || !trip.driver)
    ) {
      const missing: { label?: string; text: string }[] = [];
      if (!trip.vehicle) {
        missing.push({
          label: "Vehículo",
          text: "Sin datos de unidad en el viaje.",
        });
      }
      if (!trip.driver) {
        missing.push({
          label: "Conductor",
          text: "Sin datos de conductor en el viaje.",
        });
      }
      if (missing.length > 0) {
        cards.push(
          <DetailAlertCard
            key="operation-missing"
            severity="critical"
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Datos de operación incompletos"
            items={missing}
          />,
        );
      }
    }

    if (cards.length === 0) return undefined;
    return <div className="space-y-3">{cards}</div>;
  }, [trip, comparisonNowMs]);

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoadingTrip) {
    return (
      <DetailPageShell
        isLoading
        header={{
          backHref: "/trips",
          icon: <Truck className="h-6 w-6" />,
          title: "Viaje",
        }}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOT FOUND STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (!trip) {
    return (
      <DetailPageShell
        isLoading={false}
        notFound
        notFoundConfig={{
          icon: <AlertCircle />,
          title: "Viaje no encontrado",
          description: "El viaje que buscas no existe o fue eliminado.",
          backHref: "/trips",
          backLabel: "Volver a Viajes",
        }}
        header={{
          backHref: "/trips",
          icon: <Truck className="h-6 w-6" />,
          title: "Viaje",
        }}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALCULATED VALUES
  // ══════════════════════════════════════════════════════════════════════════

  const distance = calculateDistance(trip.mileage);
  const duration = calculateTripDuration(trip);
  const progress = calculateStopsProgress(stops);

  // Stops de referencia para el resumen
  const originStop = orderedStops.find((s) =>
    (Array.isArray(s.stopType) ? s.stopType : [s.stopType]).includes("origin"),
  );
  const destinationStop = orderedStops.find((s) =>
    (Array.isArray(s.stopType) ? s.stopType : [s.stopType]).includes(
      "destination",
    ),
  );

  // Totales de cargas
  const cargoCount = cargos.length;
  const totalDeclaredValue = cargos.reduce(
    (sum, c) => sum + (c.declaredValue || 0),
    0,
  );
  const totalCargoWeight = cargos.reduce((sum, c) => sum + (c.weight || 0), 0);

  // Totales de gastos (del summary o calculado)
  const expenseCount = expenses.length;
  const totalExpenses =
    expensesSummary?.total ??
    expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingExpenses = expensesSummary?.pendingCount ?? 0;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <DetailPageShell
      isLoading={false}
      header={{
        backHref: "/trips",
        icon: <Truck className="h-6 w-6" />,
        iconVariant:
          trip.status === TripStatus.CANCELLED ? "muted" : "primary",
        title: trip.tripCode,
        subtitle: `${trip.originCity} → ${trip.destinationCity}`,
        statusBadge: <TripStatusBadge status={trip.status} size="sm" showIcon={true} />,
        actions: (
          <div className="flex items-center gap-2 flex-wrap">
            <TripInvoiceActions trip={trip} />
            <TripActions
              tripId={trip.id}
              tripCode={trip.tripCode}
              status={trip.status}
              variant="buttons"
              onActionComplete={() => {
                refetchTrip();
                refetchCargos();
                refetchExpenses();
              }}
            />
          </div>
        ),
      }}
      alerts={tripAlerts}
      stats={[
        {
          title: "Distancia",
          value:
            distance != null && distance > 0
              ? `${distance.toLocaleString("es-MX")} km`
              : "—",
          icon: <Navigation className="h-5 w-5 text-primary" />,
        },
        {
          title: "Duración",
          value: duration ? formatDuration(duration) : "—",
          icon: <Clock className="h-5 w-5 text-blue-500" />,
        },
        {
          title: "Cargas",
          value: cargoCount,
          icon: <Package className="h-5 w-5 text-amber-500" />,
          description:
            totalCargoWeight > 0
              ? `${totalCargoWeight.toLocaleString("es-MX")} kg total`
              : undefined,
        },
        {
          title: "Tarifa base",
          value: trip.costs.baseRate > 0 ? formatCurrency(trip.costs.baseRate) : "—",
          icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
        },
      ]}
      tabs={{
        defaultValue: "overview",
        items: [
          {
            value: "overview",
            label: "Resumen",
            content: (
              <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* ── Información del Viaje ──────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" /> Información del viaje
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <InfoRow
                  variant="inline"
                  label="Salida"
                  value={formatDateTime(trip.scheduledDeparture.toISOString())}
                />
                <InfoRow
                  variant="inline"
                  label="Llegada est."
                  value={formatDateTime(trip.scheduledArrival?.toISOString())}
                />
                {trip.actualDeparture ? (
                  <InfoRow
                    variant="inline"
                    label="Salida real"
                    value={formatDateTime(trip.actualDeparture.toISOString())}
                  />
                ) : null}
                {trip.actualArrival ? (
                  <InfoRow
                    variant="inline"
                    label="Llegada real"
                    value={formatDateTime(trip.actualArrival.toISOString())}
                  />
                ) : null}
                <InfoRow variant="inline" label="Duración" value={formatDuration(duration)} />
              </CardContent>
            </Card>

            {/* ── Unidad y Conductor ─────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" /> Unidad y conductor
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {trip.vehicle ? (
                  <>
                    <InfoRow variant="inline" label="Unidad" value={trip.vehicle.unitNumber} />
                    <InfoRow variant="inline" label="Placa" value={trip.vehicle.licensePlate} />
                  </>
                ) : (
                  <p className="py-2 text-sm text-muted-foreground">Sin vehículo asignado</p>
                )}

                <Separator className="my-2" />

                {trip.driver ? (
                  <InfoRow variant="inline" label="Conductor" value={trip.driver.fullName} />
                ) : (
                  <p className="text-sm text-muted-foreground">Sin conductor asignado</p>
                )}

                {trip.internalStaff && trip.internalStaff.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        Equipo de apoyo (interno)
                      </p>
                      {trip.internalStaff.map((member) => (
                        <div key={member.id} className="text-xs rounded-md border p-2">
                          <p className="font-medium">{member.employeeFullName}</p>
                          {member.isPaymentResponsible && (
                            <p className="text-muted-foreground">
                              Responsable de pago
                            </p>
                          )}
                          {member.paymentNotes && (
                            <p className="text-muted-foreground italic mt-1">
                              {member.paymentNotes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── Kilometraje ─────────────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="h-4 w-4" /> Kilometraje
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <InfoRow variant="inline" label="Inicial" value={formatMileage(trip.mileage.start)} />
                <InfoRow variant="inline" label="Final" value={formatMileage(trip.mileage.end)} />
                <Separator className="my-2" />
                <InfoRow variant="inline" label="Distancia" value={formatMileage(distance)} />
              </CardContent>
            </Card>
          </div>

          {/* ── Origen y Destino ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Origen */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Navigation className="h-4 w-4 text-green-600" /> Origen
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {originStop ? (
                  <>
                    <InfoRow
                      variant="inline"
                      label="Ubicación"
                      value={originStop.locationName?.trim() || "—"}
                    />
                    <InfoRow
                      variant="inline"
                      label="Calle y número"
                      value={
                        [
                          originStop.street,
                          originStop.exteriorNumber
                            ? `#${originStop.exteriorNumber}`
                            : null,
                          originStop.interiorNumber
                            ? `Int. ${originStop.interiorNumber}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ")
                          .trim() || "—"
                      }
                    />
                    <InfoRow
                      variant="inline"
                      label="Colonia"
                      value={originStop.colonia?.trim() || "—"}
                    />
                    <InfoRow
                      variant="inline"
                      label="Ciudad / Estado / C.P."
                      value={
                        [
                          originStop.city,
                          originStop.state,
                          originStop.postalCode
                            ? `C.P. ${originStop.postalCode}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"
                      }
                    />
                    {originStop.rfcRemitenteDestinatario ? (
                      <InfoRow
                        variant="inline"
                        label="RFC"
                        value={originStop.rfcRemitenteDestinatario}
                        mono
                        copyable
                      />
                    ) : null}
                    {originStop.nombreRemitenteDestinatario ? (
                      <InfoRow
                        variant="inline"
                        label="Razón social (CP)"
                        value={originStop.nombreRemitenteDestinatario}
                      />
                    ) : null}
                    {originStop.estimatedDeparture ? (
                      <InfoRow
                        variant="inline"
                        label="Salida programada"
                        value={formatDateTime(
                          originStop.estimatedDeparture.toISOString(),
                        )}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <InfoRow
                      variant="inline"
                      label="Dirección"
                      value={trip.originAddress?.trim() || "—"}
                    />
                    <InfoRow
                      variant="inline"
                      label="Ciudad / Estado"
                      value={
                        [trip.originCity, trip.originState]
                          .filter(Boolean)
                          .join(", ") || "—"
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Destino */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-red-600" /> Destino
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {destinationStop ? (
                  <>
                    <InfoRow
                      variant="inline"
                      label="Ubicación"
                      value={destinationStop.locationName?.trim() || "—"}
                    />
                    <InfoRow
                      variant="inline"
                      label="Calle y número"
                      value={
                        [
                          destinationStop.street,
                          destinationStop.exteriorNumber
                            ? `#${destinationStop.exteriorNumber}`
                            : null,
                          destinationStop.interiorNumber
                            ? `Int. ${destinationStop.interiorNumber}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ")
                          .trim() || "—"
                      }
                    />
                    <InfoRow
                      variant="inline"
                      label="Colonia"
                      value={destinationStop.colonia?.trim() || "—"}
                    />
                    <InfoRow
                      variant="inline"
                      label="Ciudad / Estado / C.P."
                      value={
                        [
                          destinationStop.city,
                          destinationStop.state,
                          destinationStop.postalCode
                            ? `C.P. ${destinationStop.postalCode}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"
                      }
                    />
                    {destinationStop.rfcRemitenteDestinatario ? (
                      <InfoRow
                        variant="inline"
                        label="RFC"
                        value={destinationStop.rfcRemitenteDestinatario}
                        mono
                        copyable
                      />
                    ) : null}
                    {destinationStop.nombreRemitenteDestinatario ? (
                      <InfoRow
                        variant="inline"
                        label="Razón social (CP)"
                        value={destinationStop.nombreRemitenteDestinatario}
                      />
                    ) : null}
                    {destinationStop.estimatedArrival ? (
                      <InfoRow
                        variant="inline"
                        label="Llegada programada"
                        value={formatDateTime(
                          destinationStop.estimatedArrival.toISOString(),
                        )}
                      />
                    ) : null}
                    {destinationStop.distanceFromPreviousKm != null ? (
                      <InfoRow
                        variant="inline"
                        label="Distancia (tramo)"
                        value={`${destinationStop.distanceFromPreviousKm.toLocaleString("es-MX")} km`}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <InfoRow
                      variant="inline"
                      label="Dirección"
                      value={trip.destinationAddress?.trim() || "—"}
                    />
                    <InfoRow
                      variant="inline"
                      label="Ciudad / Estado"
                      value={
                        [trip.destinationCity, trip.destinationState]
                          .filter(Boolean)
                          .join(", ") || "—"
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Notas ───────────────────────────────────────────────────── */}
          {trip.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {trip.notes}
                </p>
              </CardContent>
            </Card>
          )}
              </>
            ),
          },
          {
            value: "route",
            label:
              orderedStops.length > 0
                ? `Ruta (${orderedStops.length})`
                : "Ruta",
            content: (
              <>
          {orderedStops.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Navigation className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No hay paradas registradas para este viaje.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Progress */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Progreso de la ruta
                    </span>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>

              <DetailTimeline
                items={orderedStops.map((stop) => {
                  const config = getStopDisplayConfig(stop.stopType);
                  const StopIcon = config.icon;
                  const isVisited = !!stop.actualArrival;
                  const canMarkVisited =
                    trip.status === TripStatus.IN_PROGRESS && !isVisited;

                  return {
                    id: stop.id,
                    icon: <StopIcon className={cn("h-5 w-5", config.color)} />,
                    completed: isVisited,
                    dotBgClassName: config.bgColor,
                    dotIconClassName: config.color,
                    content: (
                      <Card className="mb-4">
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
                                {isVisited && (
                                  <Badge
                                    variant="default"
                                    className="bg-emerald-500 text-xs"
                                  >
                                    Visitado
                                  </Badge>
                                )}
                              </div>

                              {/* Location name */}
                              <p className="text-sm font-medium">
                                {formatStopDisplayPrimaryLine(stop)}
                              </p>

                              {stop.colonia && (
                                <p className="text-sm text-muted-foreground">
                                  {stop.colonia}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {formatStopDisplayLocalityLine(stop)}
                              </p>
                              {import.meta.env.DEV && stop.addressId && (
                                <p
                                  className="text-[10px] font-mono text-muted-foreground/80"
                                  title="address_id (solo en desarrollo)"
                                >
                                  address_id: {stop.addressId}
                                </p>
                              )}

                              {/* RFC / Nombre remitente-destinatario */}
                              {stop.rfcRemitenteDestinatario && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <FileText className="h-3 w-3" />
                                  {stop.rfcRemitenteDestinatario}
                                  {stop.nombreRemitenteDestinatario &&
                                    ` — ${stop.nombreRemitenteDestinatario}`}
                                </p>
                              )}

                              {/* Contact */}
                              {stop.contactName && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />{" "}
                                  {stop.contactName}
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

                              {/* Distancia desde parada anterior (CP 3.1) */}
                              {stop.distanceFromPreviousKm != null && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Navigation className="h-3 w-3" />
                                  {stop.distanceFromPreviousKm.toLocaleString(
                                    "es-MX",
                                  )}{" "}
                                  km desde parada anterior
                                </p>
                              )}

                              {/* Times */}
                              {stop.estimatedArrival && !isVisited && (
                                <p className="text-xs text-muted-foreground">
                                  Llegada est.:{" "}
                                  {formatDateTime(
                                    stop.estimatedArrival.toISOString(),
                                  )}
                                </p>
                              )}
                              {stop.actualArrival && (
                                <p className="text-xs text-emerald-600 font-medium">
                                  ✓ Llegada:{" "}
                                  {formatDateTime(
                                    stop.actualArrival.toISOString(),
                                  )}
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
                                {markVisitedMutation.isPending ? (
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="mr-1 h-4 w-4" />
                                )}
                                Marcar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ),
                  };
                })}
              />
            </div>
          )}
              </>
            ),
          },
          {
            value: "cargo",
            label: (
              <span className="inline-flex items-center gap-1">
                Cargas
                {isLoadingCargos ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                {!isLoadingCargos && cargoCount > 0 ? (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {cargoCount}
                  </Badge>
                ) : null}
              </span>
            ),
            content: (
              <>
          {isLoadingCargos ? (
            <CargosSkeleton />
          ) : isErrorCargos ? (
            <ErrorCard
              message="No se pudieron cargar las cargas del viaje."
              onRetry={() => refetchCargos()}
            />
          ) : cargos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No hay cargas registradas para este viaje.
                </p>
                {(trip.status === TripStatus.DRAFT ||
                  trip.status === TripStatus.SCHEDULED) && (
                  <Button variant="outline" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Agregar Carga
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Resumen de cargas */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                    {totalDeclaredValue > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor declarado:{" "}
                        <span className="font-medium text-foreground">
                          {formatCurrency(totalDeclaredValue)}
                        </span>
                      </p>
                    )}
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {cargo.description}
                            </span>
                            <Badge
                              variant={getCargoStatusVariant(cargo.status)}
                              className="text-xs"
                            >
                              {CARGO_STATUS_LABELS[cargo.status] ||
                                cargo.status}
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
                            {cargo.aseguraCarga && (
                              <span>Seguro: {cargo.aseguraCarga}</span>
                            )}
                            {cargo.polizaCarga && (
                              <span className="font-mono">
                                Poliza: {cargo.polizaCarga}
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
                                const isCompleted = !!movement.completedAt;

                                return (
                                  <div
                                    key={movement.id || idx}
                                    className={cn(
                                      "flex items-center gap-2 text-xs",
                                      isCompleted
                                        ? "text-emerald-600"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {movement.movementType === "pickup" ? (
                                      <Package
                                        className={cn(
                                          "h-3 w-3",
                                          isCompleted
                                            ? "text-emerald-500"
                                            : "text-blue-500",
                                        )}
                                      />
                                    ) : (
                                      <Box
                                        className={cn(
                                          "h-3 w-3",
                                          isCompleted
                                            ? "text-emerald-500"
                                            : "text-orange-500",
                                        )}
                                      />
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
                                    {isCompleted && (
                                      <CheckCircle2 className="h-3 w-3 ml-1" />
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

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {cargo.declaredValue != null &&
                            cargo.declaredValue > 0 && (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  Valor declarado
                                </p>
                                <p className="font-semibold">
                                  {formatCurrency(cargo.declaredValue)}
                                </p>
                              </div>
                            )}
                          {trip.status === TripStatus.IN_PROGRESS &&
                            cargo.status !== CargoStatus.DELIVERED &&
                            cargo.status !== CargoStatus.CANCELLED && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  deliverCargoMutation.mutate({
                                    cargoId: cargo.id,
                                    data: { status: CargoStatus.DELIVERED },
                                  })
                                }
                                disabled={deliverCargoMutation.isPending}
                              >
                                {deliverCargoMutation.isPending ? (
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                )}
                                Entregar
                              </Button>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
              </>
            ),
          },
          {
            value: "costs",
            label: (
              <span className="inline-flex items-center gap-1">
                Costos
                {pendingExpenses > 0 ? (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {pendingExpenses}
                  </Badge>
                ) : null}
              </span>
            ),
            content: (
              <>
          {/* Resumen financiero */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Resumen Financiero
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Tarifa base</span>
                  <span className="font-medium">
                    {formatCurrency(trip.costs.baseRate)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total gastos</span>
                  <span className="font-medium text-destructive">
                    -{formatCurrency(totalExpenses)}
                  </span>
                </div>
                {trip.costs.baseRate > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Utilidad</span>
                    <span
                      className={cn(
                        "font-medium",
                        trip.costs.baseRate - totalExpenses >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-destructive",
                      )}
                    >
                      {formatCurrency(trip.costs.baseRate - totalExpenses)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3 text-lg font-semibold">
                  <span>Costo total</span>
                  <span className="text-primary">
                    {formatCurrency(trip.costs.totalCost)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gastos detallados */}
          {isLoadingExpenses ? (
            <ExpensesSkeleton />
          ) : isErrorExpenses ? (
            <ErrorCard
              message="No se pudieron cargar los gastos del viaje."
              onRetry={() => refetchExpenses()}
            />
          ) : expenses.length > 0 ? (
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {expense.description}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {EXPENSE_CATEGORY_LABELS[
                              expense.category as ExpenseCategoryType
                            ] || expense.category}
                          </Badge>
                          <Badge
                            variant={getExpenseStatusVariant(expense.status)}
                            className="text-xs"
                          >
                            {EXPENSE_STATUS_LABELS[expense.status] ||
                              expense.status}
                          </Badge>
                          {expense.isEstimated && (
                            <Badge variant="secondary" className="text-xs">
                              Estimado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {expense.vendorName && (
                            <span>{expense.vendorName}</span>
                          )}
                          {expense.expenseDate && (
                            <span>
                              •{" "}
                              {formatDateTime(
                                expense.expenseDate.toISOString(),
                              )}
                            </span>
                          )}
                          {expense.hasReceipt && (
                            <span className="flex items-center gap-1">
                              • <Receipt className="h-3 w-3" /> Con comprobante
                            </span>
                          )}
                        </div>
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
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <Receipt className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No hay gastos detallados registrados.
                </p>
                {trip.status !== TripStatus.COMPLETED &&
                  trip.status !== TripStatus.CANCELLED && (
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="mr-2 h-4 w-4" /> Agregar Gasto
                    </Button>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Resumen por categoría (del summary endpoint) */}
          {expensesSummary &&
            Object.keys(expensesSummary.byCategory).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Resumen por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(expensesSummary.byCategory).map(
                      ([category, amount]) => (
                        <div
                          key={category}
                          className="flex justify-between py-1 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {EXPENSE_CATEGORY_LABELS[
                              category as ExpenseCategoryType
                            ] || category}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(amount as number)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
              </>
            ),
          },
          {
            value: "history",
            label: "Historial",
            content: (
              <>
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
                <DetailTimeline
                  items={trip.statusHistory.map((entry) => {
                    const statusConfig = getTripStatusConfig(
                      entry.newStatus as TripStatusType,
                    );
                    const StatusIcon = statusConfig?.icon || FileText;

                    return {
                      id: entry.id,
                      icon: (
                        <StatusIcon
                          className={cn(
                            "h-4 w-4",
                            statusConfig?.textColor || "text-gray-500",
                          )}
                        />
                      ),
                      dotBgClassName:
                        statusConfig?.bgColor ||
                        "bg-gray-100 dark:bg-gray-800",
                      content: (
                        <div>
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
                            {formatDateTime(entry.changedAt.toISOString())}
                            {entry.changedByName &&
                              ` • ${entry.changedByName}`}
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
                      ),
                    };
                  })}
                />
              </CardContent>
            </Card>
          )}
              </>
            ),
          },
        ],
      }}
      metadata={{
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
        createdBy: trip.createdBy ?? undefined,
      }}
    />
  );
}
