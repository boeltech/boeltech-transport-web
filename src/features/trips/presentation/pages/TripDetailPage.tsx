/**
 * TripDetailPage
 * FSD: Pages Layer - Composition
 *
 * ACTUALIZADO: Integración con hooks de Cargas y Gastos (Enfoque B)
 * - useTripCargos: Obtiene cargas del viaje via endpoint separado
 * - useTripExpenses: Obtiene gastos del viaje via endpoint separado
 * - useTripExpensesSummary: Obtiene resumen de gastos
 * - Tabs: Operación, Ruta, Seguimiento, Cargas, Costos, Historial
 *
 * Clean Architecture: Page compone componentes de Presentation + hooks de Application
 */

import { Suspense, useEffect, useMemo, useState, type ReactElement } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  DetailTimeline,
  DetailAlertCard,
} from "@shared/ui/data-display";
import {
  AlertCircle,
  Truck,
  Clock,
  DollarSign,
  Package,
  Navigation,
  FileText,
  History,
  Receipt,
  Loader2,
  AlertTriangle,
  Calendar,
} from "lucide-react";

// ── Hooks de Application Layer ─────────────────────────────────────────────
import {
  useTrip,
  useTripTimeline,
  useTripCargos,
  useTripExpenses,
  useTripExpensesSummary,
  calculateDistance,
  calculateTripDuration,
  formatDuration,
  formatMileage,
  formatCurrency,
  formatTripRouteSubtitle,
} from "@features/trips";

// ── Domain Types ───────────────────────────────────────────────────────────
import {
  type TripStatusType,
  type StopTypeValue,
  TripStatus,
  TRIP_STATUS_LABELS,
  getOrderedStops,
} from "@features/trips/domain";

import { usePermissions } from "@shared/permissions";
import {
  getTripStatusConfig,
  TripActions,
  TripInvoiceActions,
  TripStatusBadge,
} from "@features/trips/presentation";
import {
  TripTrackingTabLazy,
  TripDetailCargoTabLazy,
  TripDetailCostsTabLazy,
  TripDetailTabFallback,
} from "./TripDetailLazyTabs";
import { TripFiscalSection } from "../components/TripFiscalSection";
import { TripDetailOperationTab } from "../components/trip-operation";
import { TripDetailRouteTab } from "../components/trip-route";
import { tripDetailCopy } from "../copy";
import { formatDateTime } from "@shared/utils/dateUtils";
import { getTripDetailAccess } from "./tripDetailAccess";
import {
  resolveTripDetailTab,
  shouldFetchTripCargos,
  shouldFetchTripExpenses,
  shouldFetchTripExpensesSummary,
  shouldFetchTripTimeline,
} from "./tripDetailQueryGating";
import { buildTripRouteDetailView } from "./tripDetailRouteData";

const shell = tripDetailCopy.shell;
const history = tripDetailCopy.history;

// ============================================================================
// HELPERS
// ============================================================================

function hasStopType(
  stopType: StopTypeValue | StopTypeValue[] | string | string[],
  target: StopTypeValue,
): boolean {
  const types = Array.isArray(stopType) ? stopType : [stopType];
  return types.includes(target);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveTripDetailTab(searchParams.get("tab"));
  /** Origen real (bandeja de aprobaciones, factura…) o el listado de viajes. */
  const backHref = (location.state?.from as string | undefined) ?? "/trips";
  const { hasPermission } = usePermissions();
  const tripId = id || "";
  const canUpdateTrip = hasPermission("trips", "update");
  const canApproveTripExpenses = hasPermission("finance_approvals", "update");

  // ══════════════════════════════════════════════════════════════════════════
  // QUERIES
  // ══════════════════════════════════════════════════════════════════════════

  // Query principal del viaje
  const {
    data: trip,
    isLoading: isLoadingTrip,
    refetch: refetchTrip,
  } = useTrip(tripId);

  const { data: trackingTimeline } = useTripTimeline(tripId, {
    enabled: shouldFetchTripTimeline(activeTab, tripId, trip?.status),
  });
  const hasOpenTrackingIncident =
    trackingTimeline?.trip.hasOpenIncident === true;

  const fetchCargos = shouldFetchTripCargos(activeTab, tripId, trip?.status);
  const fetchExpenses = shouldFetchTripExpenses(activeTab, tripId);

  const {
    data: cargos = [],
    isLoading: isLoadingCargos,
    isError: isErrorCargos,
    refetch: refetchCargos,
  } = useTripCargos(tripId, {
    enabled: fetchCargos,
  });

  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    isError: isErrorExpenses,
    refetch: refetchExpenses,
  } = useTripExpenses(tripId, {
    enabled: fetchExpenses,
  });

  const { data: expensesSummary } = useTripExpensesSummary(tripId, {
    enabled: shouldFetchTripExpensesSummary(activeTab, tripId),
  });

  // Stops del viaje (vienen en el trip o se pueden obtener separados)
  const stops = trip?.stops ?? [];
  const orderedStops = getOrderedStops(stops);

  const routeDetail = useMemo(
    () => (trip ? buildTripRouteDetailView(trip, trackingTimeline) : null),
    [trip, trackingTimeline],
  );

  /** Estado operativo: timeline de seguimiento cuando existe; detalle como respaldo. */
  const displayStatus: TripStatusType | undefined =
    routeDetail?.trip.status ?? trip?.status;

  // ══════════════════════════════════════════════════════════════════════════
  // LOCAL STATE
  // ══════════════════════════════════════════════════════════════════════════

  const [comparisonNowMs, setComparisonNowMs] = useState(() => Date.now());
  const [postCancelFiscal, setPostCancelFiscal] = useState<{
    title: string;
    lines: readonly string[];
  } | null>(null);

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
          title={shell.alert.fiscalAttentionTitle}
          items={[
            {
              text: shell.alert.fiscalAttentionBody,
            },
          ]}
        />,
      );
    }

    if (displayStatus === TripStatus.DRAFT) {
      cards.push(
        <DetailAlertCard
          key="draft-reserve"
          severity="info"
          icon={<FileText className="h-5 w-5" />}
          title={shell.alert.draftReserveTitle}
        >
          <p>{shell.alert.draftReserveBody}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {canUpdateTrip ? (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                {shell.alert.draftConfirmCta}: menú Operación
              </span>
            ) : null}
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to={`/trips/${trip.id}/edit?step=2`}>
                {shell.alert.draftCompleteRouteCta}
              </Link>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to={`/trips/${trip.id}/edit?step=3`}>
                {shell.alert.draftCompleteCargoCta}
              </Link>
            </Button>
          </div>
        </DetailAlertCard>,
      );
    }

    if (displayStatus === TripStatus.SCHEDULED) {
      const missing: { label?: string; text: string }[] = [];
      if (!trip.vehicle) {
        missing.push({
          label: shell.alert.assignmentVehicleLabel,
          text: shell.alert.assignmentVehicleMissing,
        });
      }
      if (!trip.driver) {
        missing.push({
          label: shell.alert.assignmentDriverLabel,
          text: shell.alert.assignmentDriverMissing,
        });
      }
      if (missing.length > 0) {
        cards.push(
          <DetailAlertCard
            key="assignment-incomplete"
            severity="warning"
            icon={<AlertTriangle className="h-5 w-5" />}
            title={shell.alert.assignmentIncompleteTitle}
            items={missing}
          />,
        );
      }
    }

    if (
      (displayStatus === TripStatus.SCHEDULED ||
        displayStatus === TripStatus.IN_PROGRESS) &&
      trip.scheduledArrival &&
      !(routeDetail?.trip.actualArrival ?? trip.actualArrival) &&
      trip.scheduledArrival.getTime() < comparisonNowMs
    ) {
      cards.push(
        <DetailAlertCard
          key="eta-passed"
          severity="warning"
          icon={<Clock className="h-5 w-5" />}
          title={shell.alert.etaPassedTitle}
          items={[
            {
              label: shell.alert.etaPassedLabel,
              text: formatDateTime(trip.scheduledArrival.toISOString()),
            },
          ]}
        />,
      );
    }

    if (
      displayStatus === TripStatus.IN_PROGRESS &&
      (!trip.vehicle || !trip.driver)
    ) {
      const missing: { label?: string; text: string }[] = [];
      if (!trip.vehicle) {
        missing.push({
          label: shell.alert.assignmentVehicleLabel,
          text: shell.alert.operationVehicleMissing,
        });
      }
      if (!trip.driver) {
        missing.push({
          label: shell.alert.assignmentDriverLabel,
          text: shell.alert.operationDriverMissing,
        });
      }
      if (missing.length > 0) {
        cards.push(
          <DetailAlertCard
            key="operation-missing"
            severity="critical"
            icon={<AlertTriangle className="h-5 w-5" />}
            title={shell.alert.operationIncompleteTitle}
            items={missing}
          />,
        );
      }
    }

    if (hasOpenTrackingIncident) {
      cards.push(
        <DetailAlertCard
          key="tracking-incident-open"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={shell.alert.openIncidentTitle}
          items={[
            {
              text: shell.alert.openIncidentBody,
            },
          ]}
        />,
      );
    }

    if (cards.length === 0) return undefined;
    return <div className="space-y-3">{cards}</div>;
  }, [
    trip,
    displayStatus,
    routeDetail?.trip,
    comparisonNowMs,
    hasOpenTrackingIncident,
    canUpdateTrip,
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoadingTrip) {
    return (
      <DetailPageShell
        isLoading
        header={{
          backHref,
          icon: <Truck className="h-6 w-6" />,
          title: shell.title.fallback,
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
          title: shell.state.notFoundTitle,
          description: shell.state.notFoundDescription,
          backHref: "/trips",
          backLabel: shell.state.backToList,
        }}
        header={{
          backHref,
          icon: <Truck className="h-6 w-6" />,
          title: shell.title.fallback,
        }}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALCULATED VALUES
  // ══════════════════════════════════════════════════════════════════════════

  /** Tras cargar `trip`, el estado operativo siempre está definido. */
  const resolvedDisplayStatus: TripStatusType =
    routeDetail?.trip.status ?? trip.status;

  const tripForMetrics = routeDetail?.trip ?? trip;
  const distance = calculateDistance(tripForMetrics.mileage);
  const duration = calculateTripDuration(tripForMetrics);

  const cargoCount = fetchCargos
    ? cargos.length
    : (trip.cargos?.length ?? 0);
  const totalCargoWeight = fetchCargos
    ? cargos.reduce((sum, c) => sum + (c.weight || 0), 0)
    : (trip.cargos?.reduce((sum, c) => sum + (c.weight || 0), 0) ?? 0);
  const pickupStops = orderedStops.filter((stop) => hasStopType(stop.stopType, "pickup"));

  const pendingExpenses = expensesSummary?.pendingCount ?? 0;
  const { canEditStructural, canEditBaseRate, canManageExpenses: canManageExpensesOnTrip } =
    getTripDetailAccess(resolvedDisplayStatus, canUpdateTrip);

  return (
    <>
      <DetailPageShell
      isLoading={false}
      header={{
        backHref,
        icon: <Truck className="h-6 w-6" />,
        iconVariant:
          resolvedDisplayStatus === TripStatus.CANCELLED ? "muted" : "primary",
        title: trip.tripCode,
        subtitle: formatTripRouteSubtitle(orderedStops, {
          originCity: trip.originCity,
          originState: trip.originState,
          destinationCity: trip.destinationCity,
          destinationState: trip.destinationState,
        }),
        statusBadge: (
          <div className="flex flex-wrap items-center gap-2">
            <TripStatusBadge status={resolvedDisplayStatus} size="sm" showIcon={true} />
            {hasOpenTrackingIncident ? (
              <Badge variant="destructive" className="text-xs">
                {shell.tab.openIncident}
              </Badge>
            ) : null}
          </div>
        ),
        actions: (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <TripInvoiceActions trip={trip} presentation="headerMenu" />
            <TripActions
              variant="detailMenu"
              tripId={trip.id}
              tripCode={trip.tripCode}
              status={resolvedDisplayStatus}
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
                    lines.push(shell.alert.postCancelFiscalInvoiceRef(f.cfdiUuid));
                  }
                  lines.push(
                    shell.alert.postCancelFiscalInvoiceStatus(f.invoiceStatus),
                  );
                  setPostCancelFiscal({
                    title: shell.alert.postCancelFiscalTitle,
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
      stats={(() => {
        const status = resolvedDisplayStatus;
        const rateValue =
          trip.costs.baseRate > 0
            ? formatCurrency(trip.costs.baseRate)
            : shell.stat.noRate;
        const distanceValue =
          distance != null && distance > 0
            ? `${distance.toLocaleString("es-MX")} km`
            : "—";
        const durationValue = duration ? formatDuration(duration) : "—";
        const departureValue = trip.scheduledDeparture
          ? formatDateTime(trip.scheduledDeparture.toISOString())
          : "—";
        const arrivalValue = trip.scheduledArrival
          ? formatDateTime(trip.scheduledArrival.toISOString())
          : "—";
        const vehicleValue = trip.vehicle?.unitNumber ?? "—";
        const driverValue = trip.driver?.fullName ?? "—";

        if (status === TripStatus.DRAFT) {
          return [
            {
              title: shell.stat.departure,
              value: departureValue,
              tone: "info" as const,
              icon: <Calendar className="h-5 w-5" />,
            },
            {
              title: shell.stat.vehicle,
              value: vehicleValue,
              tone: "primary" as const,
              icon: <Truck className="h-5 w-5" />,
            },
            {
              title: shell.stat.driver,
              value: driverValue,
              tone: "warning" as const,
              icon: <Navigation className="h-5 w-5" />,
            },
            {
              title: shell.stat.baseRate,
              value: rateValue,
              tone: "success" as const,
              icon: <DollarSign className="h-5 w-5" />,
            },
          ];
        }

        if (status === TripStatus.SCHEDULED) {
          return [
            {
              title: shell.stat.departure,
              value: departureValue,
              tone: "info" as const,
              icon: <Calendar className="h-5 w-5" />,
            },
            {
              title: shell.stat.arrival,
              value: arrivalValue,
              tone: "primary" as const,
              icon: <Clock className="h-5 w-5" />,
            },
            {
              title: shell.stat.vehicle,
              value: vehicleValue,
              tone: "warning" as const,
              icon: <Truck className="h-5 w-5" />,
            },
            {
              title: shell.stat.driver,
              value: driverValue,
              tone: "success" as const,
              icon: <Navigation className="h-5 w-5" />,
            },
          ];
        }

        if (status === TripStatus.IN_PROGRESS) {
          return [
            {
              title: shell.stat.duration,
              value: durationValue,
              tone: "info" as const,
              icon: <Clock className="h-5 w-5" />,
            },
            {
              title: shell.stat.distance,
              value: distanceValue,
              tone: "primary" as const,
              icon: <Navigation className="h-5 w-5" />,
            },
            {
              title: shell.stat.cargo,
              value: cargoCount,
              tone: "warning" as const,
              icon: <Package className="h-5 w-5" />,
              description:
                totalCargoWeight > 0
                  ? shell.stat.cargoWeightTotal(totalCargoWeight)
                  : undefined,
            },
            {
              title: shell.stat.arrival,
              value: arrivalValue,
              tone: "success" as const,
              icon: <Calendar className="h-5 w-5" />,
            },
          ];
        }

        return [
          {
            title: shell.stat.distance,
            value: distanceValue,
            tone: "primary" as const,
            icon: <Navigation className="h-5 w-5" />,
          },
          {
            title: shell.stat.duration,
            value: durationValue,
            tone: "info" as const,
            icon: <Clock className="h-5 w-5" />,
          },
          {
            title: shell.stat.cargo,
            value: cargoCount,
            tone: "warning" as const,
            icon: <Package className="h-5 w-5" />,
            description:
              totalCargoWeight > 0
                ? shell.stat.cargoWeightTotal(totalCargoWeight)
                : undefined,
          },
          {
            title: shell.stat.baseRate,
            value: rateValue,
            tone: "success" as const,
            icon: <DollarSign className="h-5 w-5" />,
          },
        ];
      })()}
      tabs={{
        defaultValue: "overview",
        value: activeTab,
        onValueChange: (value) => {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              if (value === "overview") {
                next.delete("tab");
              } else {
                next.set("tab", value);
              }
              return next;
            },
            { replace: true },
          );
        },
        items: [
          {
            value: "overview",
            label: shell.tab.operation,
            content: (
              <TripDetailOperationTab
                trip={tripForMetrics}
                canEditStructural={canEditStructural}
              />
            ),
          },
          {
            value: "route",
            label: shell.format.routeTab(orderedStops.length),
            content: (
              <TripDetailRouteTab
                trip={routeDetail?.trip ?? trip}
                tripStatus={routeDetail?.trip.status ?? trip.status}
                orderedStops={routeDetail?.orderedStops ?? orderedStops}
                progress={routeDetail?.progress ?? 0}
                canEditStructural={canEditStructural}
                cargos={cargos}
                legacyRoute={{
                  originCity: trip.originCity,
                  originState: trip.originState,
                  destinationCity: trip.destinationCity,
                  destinationState: trip.destinationState,
                }}
              />
            ),
          },
          {
            value: "tracking",
            label: (
              <span className="inline-flex items-center gap-1">
                {shell.tab.tracking}
                {resolvedDisplayStatus === TripStatus.IN_PROGRESS ? (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {shell.tab.trackingLive}
                  </Badge>
                ) : null}
                {hasOpenTrackingIncident ? (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {shell.tab.trackingIncident}
                  </Badge>
                ) : null}
              </span>
            ),
            content: (
              <Suspense fallback={<TripDetailTabFallback />}>
                <TripTrackingTabLazy
                  tripId={trip.id}
                  tripCode={trip.tripCode}
                  vehicleId={trip.vehicleId}
                  driverId={trip.driverId}
                  tripStartMileage={trip.mileage.start}
                  status={resolvedDisplayStatus}
                  cargos={cargos}
                  onCargosChanged={() => refetchCargos()}
                />
              </Suspense>
            ),
          },
          {
            value: "cargo",
            label: (
              <span className="inline-flex items-center gap-1">
                {shell.tab.cargo}
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
              <Suspense fallback={<TripDetailTabFallback />}>
                <TripDetailCargoTabLazy
                  tripId={trip.id}
                  tripStatus={resolvedDisplayStatus}
                  cargos={cargos}
                  orderedStops={orderedStops}
                  pickupStops={pickupStops}
                  isLoading={isLoadingCargos}
                  isError={isErrorCargos}
                  canEditStructural={canEditStructural}
                  onRetry={() => refetchCargos()}
                  onCargosChanged={() => refetchCargos()}
                />
              </Suspense>
            ),
          },
          {
            value: "costs",
            label: (
              <span className="inline-flex items-center gap-1">
                {shell.tab.costs}
                {pendingExpenses > 0 ? (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {pendingExpenses}
                  </Badge>
                ) : null}
              </span>
            ),
            content: (
              <Suspense fallback={<TripDetailTabFallback />}>
                <TripDetailCostsTabLazy
                  tripId={trip.id}
                  tripStatus={resolvedDisplayStatus}
                  baseRate={trip.costs.baseRate}
                  cfdiDocumentIntent={trip.cfdiDocumentIntent}
                  clientId={trip.client?.id}
                  vehicleId={trip.vehicle?.id}
                  stops={orderedStops}
                  expenses={expenses}
                  expensesSummary={expensesSummary}
                  isLoading={isLoadingExpenses}
                  isError={isErrorExpenses}
                  onRetry={() => refetchExpenses()}
                  canEditBaseRate={canEditBaseRate}
                  canManageExpenses={canManageExpensesOnTrip}
                  canApproveExpenses={canApproveTripExpenses}
                  pendingExpenseCount={pendingExpenses}
                  tripCode={trip.tripCode}
                />
              </Suspense>
            ),
          },
          {
            value: "history",
            label: shell.tab.history,
            content: (
              <>
          {!trip.statusHistory || trip.statusHistory.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {history.state.empty}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" /> {history.section.statusHistory}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetailTimeline
                  items={trip.statusHistory.map((entry) => {
                    const statusConfig = getTripStatusConfig(
                      entry.newStatus as TripStatusType,
                    );
                    const StatusIcon = statusConfig?.icon || FileText;
                    const previousStatusLabel = entry.previousStatus
                      ? TRIP_STATUS_LABELS[
                          entry.previousStatus as TripStatusType
                        ] || entry.previousStatus
                      : null;

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
                            {previousStatusLabel ? (
                              <span className="text-xs text-muted-foreground">
                                {history.label.fromStatus(previousStatusLabel)}
                              </span>
                            ) : null}
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
                              {history.format.mileageLine(
                                formatMileage(entry.mileage),
                              )}
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
        updatedBy: trip.updatedByName?.trim() || undefined,
      }}
      />
    </>
  );
}
