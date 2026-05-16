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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import {
  InfoRow,
  DetailTimeline,
  DetailAlertCard,
} from "@shared/ui/data-display";
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
  Check,
  Package,
  Navigation,
  FileText,
  History,
  Receipt,
  PieChart,
  Phone,
  Box,
  RefreshCw,
  Plus,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Layers,
} from "lucide-react";

// ── Hooks de Application Layer ─────────────────────────────────────────────
import {
  useTrip,
  useMarkStopVisited,
  useUpdateTrip,
  useUpdateCargo,
  // Nuevos hooks para cargas y gastos
  useTripCargos,
  useTripExpenses,
  useTripExpensesSummary,
  // Helpers
  calculateDistance,
  calculateTripDuration,
  canEditTrip,
  formatDuration,
  formatMileage,
  formatCurrency,
  formatTripRouteSubtitle,
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
  TripQuickEditSheet,
  TripStatusBadge,
} from "@features/trips/presentation";
import { TripStopAddressSingleLine } from "../components/TripStopAddressLines";
import { TripFiscalSection } from "../components/TripFiscalSection";
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

function hasStopType(
  stopType: StopTypeValue | StopTypeValue[] | string | string[],
  target: StopTypeValue,
): boolean {
  const types = Array.isArray(stopType) ? stopType : [stopType];
  return types.includes(target);
}

function formatTimeOrDash(date?: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
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

  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [comparisonNowMs, setComparisonNowMs] = useState(() => Date.now());
  const [postCancelFiscal, setPostCancelFiscal] = useState<{
    title: string;
    lines: readonly string[];
  } | null>(null);

  const updateTripMutation = useUpdateTrip({
    onSuccess: () => {
      toast({ title: "Viaje actualizado", variant: "success" });
      setQuickEditOpen(false);
      refetchTrip();
      refetchCargos();
      refetchExpenses();
    },
    onError: (e: Error) =>
      toast({ title: "Error al guardar", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    const id = window.setInterval(() => {
      setComparisonNowMs(Date.now());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const tripAlerts = useMemo(() => {
    if (!trip) return undefined;

    const cards: ReactElement[] = [];

    if (trip.requiresFiscalAttention) {
      cards.push(
        <DetailAlertCard
          key="fiscal-attention"
          severity="critical"
          icon={<Receipt className="h-5 w-5" />}
          title="Atención fiscal requerida"
          items={[
            {
              text: "Este viaje requiere revisión fiscal. Consulte la sección Fiscal, la factura ligada o los pendientes SAT antes de continuar la operación.",
            },
          ]}
        />,
      );
    }

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

  const costsCategoryEntries =
    expensesSummary && Object.keys(expensesSummary.byCategory).length > 0
      ? (Object.entries(expensesSummary.byCategory) as [string, number][])
      : null;
  const costsCategoryMaxAmount =
    costsCategoryEntries?.reduce((max, [, amount]) => Math.max(max, amount), 0) ?? 0;

  const cargoStatusCounts = new Map<CargoStatusType, number>();
  for (const c of cargos) {
    cargoStatusCounts.set(c.status, (cargoStatusCounts.get(c.status) ?? 0) + 1);
  }
  const cargoStatusBreakdown = Array.from(cargoStatusCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const cargoStatusMaxCount = cargoStatusBreakdown.reduce((m, [, n]) => Math.max(m, n), 0);

  return (
    <>
      <DetailPageShell
      isLoading={false}
      header={{
        backHref: "/trips",
        icon: <Truck className="h-6 w-6" />,
        iconVariant:
          trip.status === TripStatus.CANCELLED ? "muted" : "primary",
        title: trip.tripCode,
        subtitle: formatTripRouteSubtitle(orderedStops, {
          originCity: trip.originCity,
          originState: trip.originState,
          destinationCity: trip.destinationCity,
          destinationState: trip.destinationState,
        }),
        statusBadge: <TripStatusBadge status={trip.status} size="sm" showIcon={true} />,
        actions: (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <TripInvoiceActions trip={trip} presentation="headerMenu" />
            <TripActions
              variant="detailMenu"
              tripId={trip.id}
              tripCode={trip.tripCode}
              status={trip.status}
              onQuickEdit={
                canEditTrip(trip.status) ? () => setQuickEditOpen(true) : undefined
              }
              onActionComplete={(updated) => {
                refetchTrip();
                refetchCargos();
                refetchExpenses();
                const f = updated?.fiscalActionRequired;
                if (f) {
                  const lines: string[] = [];
                  if (f.suggestedActions?.length) {
                    lines.push(...f.suggestedActions);
                  }
                  if (f.cfdiUuid) {
                    lines.push(`UUID CFDI: ${f.cfdiUuid}`);
                  }
                  lines.push(`Estado factura: ${f.invoiceStatus}`);
                  setPostCancelFiscal({
                    title: "Acción fiscal pendiente tras la cancelación",
                    lines,
                  });
                }
              }}
            />
          </div>
        ),
      }}
      alerts={tripAlerts}
      preStats={
        <TripFiscalSection
          trip={trip}
          postCancelFiscal={
            postCancelFiscal
              ? {
                  title: postCancelFiscal.title,
                  lines: postCancelFiscal.lines,
                  onDismiss: () => setPostCancelFiscal(null),
                }
              : undefined
          }
        />
      }
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
            label: "Operación",
            content: (
              <>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0 text-primary" />
                          Programación y tiempos
                        </CardTitle>
                        <CardDescription>
                          Salidas, llegadas estimadas y duración del trayecto.
                        </CardDescription>
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

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Truck className="h-4 w-4 shrink-0 text-primary" />
                          Unidad y conductor
                        </CardTitle>
                        <CardDescription>
                          Vehículo, conductor y equipo de apoyo asignados.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {trip.vehicle ? (
                          <>
                            <InfoRow variant="inline" label="Unidad" value={trip.vehicle.unitNumber} />
                            <InfoRow variant="inline" label="Placa" value={trip.vehicle.licensePlate} />
                          </>
                        ) : (
                          <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                            Sin vehículo asignado
                          </div>
                        )}

                        <Separator className="my-3" />

                        {trip.driver ? (
                          <InfoRow variant="inline" label="Conductor" value={trip.driver.fullName} />
                        ) : (
                          <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                            Sin conductor asignado
                          </div>
                        )}

                        {trip.internalStaff && trip.internalStaff.length > 0 && (
                          <>
                            <Separator className="my-3" />
                            <div className="space-y-2">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                Equipo de apoyo (interno)
                              </p>
                              {trip.internalStaff.map((member) => (
                                <div
                                  key={member.id}
                                  className="rounded-lg border bg-muted/20 px-3 py-2 text-xs"
                                >
                                  <p className="font-medium">{member.employeeFullName}</p>
                                  {member.isPaymentResponsible && (
                                    <p className="text-muted-foreground">Responsable de pago</p>
                                  )}
                                  {member.paymentNotes && (
                                    <p className="text-muted-foreground italic mt-1">{member.paymentNotes}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Gauge className="h-4 w-4 shrink-0 text-primary" />
                          Kilometraje
                        </CardTitle>
                        <CardDescription>
                          Lecturas de odómetro y distancia recorrida o estimada.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <InfoRow variant="inline" label="Inicial" value={formatMileage(trip.mileage.start)} />
                        <InfoRow variant="inline" label="Final" value={formatMileage(trip.mileage.end)} />
                        <Separator className="my-3" />
                        <InfoRow variant="inline" label="Distancia" value={formatMileage(distance)} />
                      </CardContent>
                    </Card>
                  </div>

                  {trip.notes ? (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Notas</CardTitle>
                        <CardDescription>Observaciones registradas para este viaje.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg border bg-muted/20 p-4">
                          {trip.notes}
                        </p>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
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
                <div className="space-y-6">
                  {orderedStops.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Navigation className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="mt-4 text-sm font-medium">Sin paradas en la ruta</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          No hay paradas registradas para este viaje.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="min-w-0 space-y-6">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Navigation className="h-4 w-4 shrink-0 text-primary" />
                              Paradas del recorrido
                            </CardTitle>
                            <CardDescription>
                              Orden, tipo de parada y detalle por ubicación. Marca como visitada cuando aplique.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            {orderedStops.map((stop, index) => {
                              const config = getStopDisplayConfig(stop.stopType);
                              const StopIcon = config.icon;
                              const isVisited = !!stop.actualArrival;
                              const canMarkVisited =
                                trip.status === TripStatus.IN_PROGRESS && !isVisited;

                              return (
                                <div
                                  key={stop.id}
                                  className="flex min-h-[120px] overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/40"
                                >
                                  <div className="w-14 shrink-0 border-r bg-muted/30 flex items-center justify-center">
                                    <span className="text-lg font-semibold text-muted-foreground">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-semibold leading-snug truncate">
                                            {stop.locationName || config.label}
                                          </p>
                                          <Badge variant="outline" className="text-xs font-normal">
                                            <span className="inline-flex items-center gap-1">
                                              <StopIcon className={cn("h-3 w-3", config.color)} />
                                              {config.label}
                                            </span>
                                          </Badge>
                                        </div>

                                        <TripStopAddressSingleLine
                                          stop={stop}
                                          className="min-w-0 break-words"
                                        />
                                        {stop.reference?.trim() ? (
                                          <p className="text-xs text-muted-foreground">
                                            Referencia: {stop.reference.trim()}
                                          </p>
                                        ) : null}

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                          <span className="inline-flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            Llegada:{" "}
                                            {formatTimeOrDash(
                                              stop.actualArrival ?? stop.estimatedArrival,
                                            )}
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            Salida:{" "}
                                            {formatTimeOrDash(stop.estimatedDeparture)}
                                          </span>
                                        </div>

                                        {stop.notes ? (
                                          <p className="text-sm text-muted-foreground italic">
                                            Nota: {stop.notes}
                                          </p>
                                        ) : null}

                                        {stop.rfcRemitenteDestinatario ? (
                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <FileText className="h-3.5 w-3.5" />
                                            {stop.rfcRemitenteDestinatario}
                                            {stop.nombreRemitenteDestinatario
                                              ? ` — ${stop.nombreRemitenteDestinatario}`
                                              : ""}
                                          </p>
                                        ) : null}

                                        {stop.contactName ? (
                                          <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                                            <User className="h-3.5 w-3.5" />
                                            {stop.contactName}
                                            {stop.contactPhone ? (
                                              <span className="inline-flex items-center gap-1">
                                                <Phone className="h-3.5 w-3.5" />
                                                {stop.contactPhone}
                                              </span>
                                            ) : null}
                                          </p>
                                        ) : null}

                                        {stop.cargoActionDescription ? (
                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Package className="h-3.5 w-3.5" />
                                            {stop.cargoActionDescription}
                                          </p>
                                        ) : null}

                                        {stop.distanceFromPreviousKm != null ? (
                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Navigation className="h-3.5 w-3.5" />
                                            {stop.distanceFromPreviousKm.toLocaleString("es-MX")} km desde parada anterior
                                          </p>
                                        ) : null}
                                      </div>

                                      <div className="flex flex-col items-end gap-2 shrink-0">
                                        <Badge variant="secondary" className="font-normal">
                                          {isVisited ? "Visitada" : "Pendiente"}
                                        </Badge>
                                        {canMarkVisited ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full sm:w-auto"
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
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-6 xl:sticky xl:top-24 self-start">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Clock className="h-4 w-4 shrink-0 text-primary" />
                              Tiempos de llegada
                            </CardTitle>
                            <CardDescription>
                              Hora estimada o real por parada en orden de ruta.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            {orderedStops.map((stop, index) => (
                              <div
                                key={`${stop.id}-arrival`}
                                className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex items-center gap-2">
                                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm truncate">
                                    {stop.locationName || `Parada ${index + 1}`}
                                  </span>
                                </div>
                                <span className="shrink-0 text-sm font-medium tabular-nums">
                                  {formatTimeOrDash(stop.actualArrival ?? stop.estimatedArrival)}
                                </span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                              Estadísticas de ruta
                            </CardTitle>
                            <CardDescription>
                              Progreso y conteo por tipo de parada.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-0">
                            <InfoRow variant="inline" label="Progreso" value={`${progress}%`} />
                            <Separator />
                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                                <p className="text-2xl font-semibold tabular-nums">
                                  {orderedStops.length}
                                </p>
                                <p className="text-xs text-muted-foreground">Total paradas</p>
                              </div>
                              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                                <p className="text-2xl font-semibold tabular-nums">
                                  {orderedStops.filter((s) => !!s.actualArrival).length}
                                </p>
                                <p className="text-xs text-muted-foreground">Completadas</p>
                              </div>
                            </div>
                            <div className="space-y-1 rounded-lg border bg-muted/20 px-3 py-3 text-sm">
                              <InfoRow
                                variant="inline"
                                label="Cargas"
                                value={orderedStops.filter((s) => hasStopType(s.stopType, "pickup")).length}
                              />
                              <InfoRow
                                variant="inline"
                                label="Descargas"
                                value={orderedStops.filter((s) => hasStopType(s.stopType, "delivery")).length}
                              />
                              <InfoRow
                                variant="inline"
                                label="Escalas"
                                value={orderedStops.filter((s) => hasStopType(s.stopType, "checkpoint")).length}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
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
                <div className="space-y-6">
                  {isLoadingCargos ? (
                    <CargosSkeleton />
                  ) : isErrorCargos ? (
                    <ErrorCard
                      message="No se pudieron cargar las cargas del viaje."
                      onRetry={() => refetchCargos()}
                    />
                  ) : cargos.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="mt-4 text-sm font-medium">Sin cargas registradas</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Aún no hay mercancía asociada a este viaje.
                        </p>
                        {(trip.status === TripStatus.DRAFT ||
                          trip.status === TripStatus.SCHEDULED) && (
                          <Button variant="outline" className="mt-5">
                            <Plus className="mr-2 h-4 w-4" /> Agregar carga
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div
                      className={cn(
                        "grid gap-6",
                        cargoStatusBreakdown.length > 0 ? "lg:grid-cols-3" : "",
                      )}
                    >
                      <div
                        className={cn(
                          "min-w-0 space-y-6",
                          cargoStatusBreakdown.length > 0 ? "lg:col-span-2" : "",
                        )}
                      >
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Package className="h-4 w-4 shrink-0 text-primary" />
                              Resumen de cargas
                            </CardTitle>
                            <CardDescription>
                              Totales consolidados de piezas, peso y valor declarado.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Total cargas
                                </p>
                                <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">
                                  {cargoCount}
                                </p>
                              </div>
                              <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Peso total
                                </p>
                                <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">
                                  {totalCargoWeight > 0
                                    ? `${totalCargoWeight.toLocaleString("es-MX")} kg`
                                    : "—"}
                                </p>
                              </div>
                              <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Valor declarado
                                </p>
                                <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">
                                  {totalDeclaredValue > 0
                                    ? formatCurrency(totalDeclaredValue)
                                    : "—"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Box className="h-4 w-4 shrink-0" />
                                  Cargas del viaje
                                </CardTitle>
                                <CardDescription className="mt-1.5">
                                  Detalle por mercancía, movimientos y estado.
                                </CardDescription>
                              </div>
                              <Badge variant="secondary" className="w-fit shrink-0 text-xs">
                                {cargoCount} {cargoCount === 1 ? "carga" : "cargas"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              {cargos.map((cargo) => (
                                <div
                                  key={cargo.id}
                                  className="rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
                                >
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1 space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium leading-snug">
                                          {cargo.description}
                                        </span>
                                        <Badge
                                          variant={getCargoStatusVariant(cargo.status)}
                                          className="text-xs font-normal"
                                        >
                                          {CARGO_STATUS_LABELS[cargo.status] || cargo.status}
                                        </Badge>
                                      </div>

                                      {cargo.client ? (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                                          {cargo.client.legalName}
                                        </p>
                                      ) : null}

                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                        {cargo.weight ? (
                                          <span>Peso: {cargo.weight} kg</span>
                                        ) : null}
                                        {cargo.units ? (
                                          <span>
                                            {(cargo.weight ? "· " : "")}Unidades: {cargo.units}
                                          </span>
                                        ) : null}
                                        {cargo.volume ? (
                                          <span>
                                            {(cargo.weight || cargo.units ? "· " : "")}
                                            Volumen: {cargo.volume} m³
                                          </span>
                                        ) : null}
                                        {cargo.declaredValue ? (
                                          <span>
                                            {(cargo.weight || cargo.units || cargo.volume
                                              ? "· "
                                              : "")}
                                            Valor: {formatCurrency(cargo.declaredValue)}
                                          </span>
                                        ) : null}
                                        {cargo.aseguraCarga ? (
                                          <span>
                                            {(cargo.weight ||
                                            cargo.units ||
                                            cargo.volume ||
                                            cargo.declaredValue
                                              ? "· "
                                              : "")}
                                            Seguro: {cargo.aseguraCarga}
                                          </span>
                                        ) : null}
                                        {cargo.polizaCarga ? (
                                          <span className="font-mono">
                                            {(cargo.weight ||
                                            cargo.units ||
                                            cargo.volume ||
                                            cargo.declaredValue ||
                                            cargo.aseguraCarga
                                              ? "· "
                                              : "")}
                                            Póliza: {cargo.polizaCarga}
                                          </span>
                                        ) : null}
                                      </div>

                                      {cargo.movements && cargo.movements.length > 0 ? (
                                        <div className="mt-1 space-y-1 rounded-md border bg-muted/25 px-3 py-2">
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
                                                  "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs",
                                                  isCompleted
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-muted-foreground",
                                                )}
                                              >
                                                {movement.movementType === "pickup" ? (
                                                  <Package
                                                    className={cn(
                                                      "h-3 w-3 shrink-0",
                                                      isCompleted
                                                        ? "text-emerald-500"
                                                        : "text-blue-500",
                                                    )}
                                                  />
                                                ) : (
                                                  <Box
                                                    className={cn(
                                                      "h-3 w-3 shrink-0",
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
                                                {stopForMovement ? (
                                                  <span>
                                                    en {stopForMovement.city}
                                                    {stopForMovement.locationName
                                                      ? ` (${stopForMovement.locationName})`
                                                      : ""}
                                                  </span>
                                                ) : null}
                                                {movement.weight ? (
                                                  <span>· {movement.weight} kg</span>
                                                ) : null}
                                                {isCompleted ? (
                                                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                                                ) : null}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : null}

                                      {cargo.notes ? (
                                        <p className="text-xs text-muted-foreground italic">
                                          {cargo.notes}
                                        </p>
                                      ) : null}
                                    </div>

                                    <div className="flex flex-col gap-2 sm:items-end lg:shrink-0 lg:pl-4">
                                      {cargo.declaredValue != null && cargo.declaredValue > 0 ? (
                                        <div className="text-left sm:text-right">
                                          <p className="text-xs text-muted-foreground">
                                            Valor declarado
                                          </p>
                                          <p className="text-base font-semibold tabular-nums">
                                            {formatCurrency(cargo.declaredValue)}
                                          </p>
                                        </div>
                                      ) : null}
                                      {trip.status === TripStatus.IN_PROGRESS &&
                                      cargo.status !== CargoStatus.DELIVERED &&
                                      cargo.status !== CargoStatus.CANCELLED ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full sm:w-auto"
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
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {cargoStatusBreakdown.length > 0 ? (
                        <div className="min-w-0 lg:col-span-1">
                          <Card className="lg:sticky lg:top-24">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                                Por estado
                              </CardTitle>
                              <CardDescription>
                                Cantidad de cargas según su estado operativo.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {cargoStatusBreakdown.map(([status, count]) => {
                                const pct =
                                  cargoStatusMaxCount > 0
                                    ? Math.round((count / cargoStatusMaxCount) * 100)
                                    : 0;
                                return (
                                  <div key={status} className="space-y-1.5">
                                    <div className="flex items-baseline justify-between gap-2 text-sm">
                                      <span className="min-w-0 truncate text-muted-foreground">
                                        {CARGO_STATUS_LABELS[status] || status}
                                      </span>
                                      <span className="shrink-0 font-medium tabular-nums">
                                        {count}
                                      </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                      <div
                                        className="h-full rounded-full bg-primary/75 transition-[width]"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </CardContent>
                          </Card>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
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
                <div
                  className={cn(
                    "grid gap-6",
                    costsCategoryEntries ? "lg:grid-cols-3" : "",
                  )}
                >
                  <div
                    className={cn(
                      "min-w-0 space-y-6",
                      costsCategoryEntries ? "lg:col-span-2" : "",
                    )}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <DollarSign className="h-4 w-4 shrink-0 text-primary" />
                          Resumen financiero
                        </CardTitle>
                        <CardDescription>
                          Tarifa del viaje frente a gastos registrados y costo total.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div
                          className={cn(
                            "grid gap-3",
                            trip.costs.baseRate > 0
                              ? "sm:grid-cols-3"
                              : "sm:grid-cols-2",
                          )}
                        >
                          <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Tarifa base
                            </p>
                            <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">
                              {formatCurrency(trip.costs.baseRate)}
                            </p>
                          </div>
                          <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Total gastos
                            </p>
                            <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-destructive">
                              -{formatCurrency(totalExpenses)}
                            </p>
                          </div>
                          {trip.costs.baseRate > 0 ? (
                            <div className="rounded-lg border bg-muted/30 p-4">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Utilidad (estimada)
                              </p>
                              <p
                                className={cn(
                                  "mt-2 text-xl font-semibold tabular-nums tracking-tight",
                                  trip.costs.baseRate - totalExpenses >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-destructive",
                                )}
                              >
                                {formatCurrency(trip.costs.baseRate - totalExpenses)}
                              </p>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-1 rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Costo total del viaje
                          </span>
                          <span className="text-2xl font-bold tabular-nums text-primary">
                            {formatCurrency(trip.costs.totalCost)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {isLoadingExpenses ? (
                      <ExpensesSkeleton />
                    ) : isErrorExpenses ? (
                      <ErrorCard
                        message="No se pudieron cargar los gastos del viaje."
                        onRetry={() => refetchExpenses()}
                      />
                    ) : expenses.length > 0 ? (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                <Receipt className="h-4 w-4 shrink-0" />
                                Gastos del viaje
                              </CardTitle>
                              <CardDescription className="mt-1.5">
                                Listado de cargos asociados al viaje.
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="w-fit shrink-0 text-xs">
                              {expenseCount} {expenseCount === 1 ? "gasto" : "gastos"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            {expenses.map((expense) => (
                              <div
                                key={expense.id}
                                className="rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-medium leading-snug">
                                        {expense.description}
                                      </span>
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {EXPENSE_CATEGORY_LABELS[
                                          expense.category as ExpenseCategoryType
                                        ] || expense.category}
                                      </Badge>
                                      <Badge
                                        variant={getExpenseStatusVariant(expense.status)}
                                        className="text-xs font-normal"
                                      >
                                        {EXPENSE_STATUS_LABELS[expense.status] ||
                                          expense.status}
                                      </Badge>
                                      {expense.isEstimated ? (
                                        <Badge variant="secondary" className="text-xs font-normal">
                                          Estimado
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                      {expense.vendorName ? (
                                        <span>{expense.vendorName}</span>
                                      ) : null}
                                      {expense.expenseDate ? (
                                        <span>
                                          {expense.vendorName ? "· " : null}
                                          {formatDateTime(expense.expenseDate.toISOString())}
                                        </span>
                                      ) : null}
                                      {expense.hasReceipt ? (
                                        <span className="inline-flex items-center gap-1">
                                          {(expense.vendorName || expense.expenseDate) ? "· " : null}
                                          <Receipt className="h-3 w-3" />
                                          Comprobante
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                  <span className="text-right text-base font-semibold tabular-nums sm:shrink-0 sm:pl-4">
                                    {formatCurrency(expense.amount)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-3">
                            <span className="text-sm font-medium">Total gastos registrados</span>
                            <span className="text-lg font-semibold tabular-nums">
                              {formatCurrency(totalExpenses)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="py-10 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Receipt className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="mt-4 text-sm font-medium">Sin gastos registrados</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Aún no hay gastos detallados para este viaje.
                          </p>
                          {trip.status !== TripStatus.COMPLETED &&
                          trip.status !== TripStatus.CANCELLED ? (
                            <Button variant="outline" size="sm" className="mt-5">
                              <Plus className="mr-2 h-4 w-4" /> Agregar gasto
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {costsCategoryEntries ? (
                    <div className="min-w-0 lg:col-span-1">
                      <Card className="lg:sticky lg:top-24">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <PieChart className="h-4 w-4 shrink-0 text-muted-foreground" />
                            Por categoría
                          </CardTitle>
                          <CardDescription>
                            Distribución según categorías del resumen.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {costsCategoryEntries.map(([category, amount]) => {
                            const pct =
                              costsCategoryMaxAmount > 0
                                ? Math.round((amount / costsCategoryMaxAmount) * 100)
                                : 0;
                            return (
                              <div key={category} className="space-y-1.5">
                                <div className="flex items-baseline justify-between gap-2 text-sm">
                                  <span className="min-w-0 truncate text-muted-foreground">
                                    {EXPENSE_CATEGORY_LABELS[
                                      category as ExpenseCategoryType
                                    ] || category}
                                  </span>
                                  <span className="shrink-0 font-medium tabular-nums">
                                    {formatCurrency(amount)}
                                  </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary/75 transition-[width]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    </div>
                  ) : null}
                </div>
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
        createdBy: trip.createdByName?.trim() || trip.createdBy || undefined,
      }}
      />
      <TripQuickEditSheet
        trip={trip}
        open={quickEditOpen}
        isSaving={updateTripMutation.isPending}
        onOpenChange={setQuickEditOpen}
        onSubmit={(payload) => updateTripMutation.mutateAsync({ id: trip.id, data: payload })}
      />
    </>
  );
}
