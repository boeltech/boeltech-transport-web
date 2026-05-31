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
import { useParams, useSearchParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { Badge } from "@shared/ui/badge";
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
  calculateStopsProgress,
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
  shouldFetchTripTimelineForShell,
} from "./tripDetailQueryGating";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveTripDetailTab(searchParams.get("tab"));
  const { hasPermission } = usePermissions();
  const tripId = id || "";
  const canUpdateTrip = hasPermission("trips", "update");

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
    enabled: shouldFetchTripTimelineForShell(activeTab, tripId, trip?.status),
  });
  const hasOpenTrackingIncident =
    trackingTimeline?.trip.hasOpenIncident === true;

  const fetchCargos = shouldFetchTripCargos(activeTab, tripId);
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

    if (trip.status === TripStatus.SCHEDULED) {
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
      trip.status === TripStatus.IN_PROGRESS &&
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
  }, [trip, comparisonNowMs, hasOpenTrackingIncident]);

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
          backHref: "/trips",
          icon: <Truck className="h-6 w-6" />,
          title: shell.title.fallback,
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

  const cargoCount = fetchCargos
    ? cargos.length
    : (trip.cargos?.length ?? 0);
  const totalCargoWeight = fetchCargos
    ? cargos.reduce((sum, c) => sum + (c.weight || 0), 0)
    : (trip.cargos?.reduce((sum, c) => sum + (c.weight || 0), 0) ?? 0);
  const pickupStops = orderedStops.filter((stop) => hasStopType(stop.stopType, "pickup"));

  const pendingExpenses = expensesSummary?.pendingCount ?? 0;
  const { canEditStructural, canEditBaseRate, canManageExpenses: canManageExpensesOnTrip } =
    getTripDetailAccess(trip?.status, canUpdateTrip);

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
        statusBadge: (
          <div className="flex flex-wrap items-center gap-2">
            <TripStatusBadge status={trip.status} size="sm" showIcon={true} />
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
              status={trip.status}
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
                    lines.push(shell.alert.postCancelFiscalCfdiUuid(f.cfdiUuid));
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
      stats={[
        {
          title: shell.stat.distance,
          value:
            distance != null && distance > 0
              ? `${distance.toLocaleString("es-MX")} km`
              : "—",
          tone: "primary",
          icon: <Navigation className="h-5 w-5" />,
        },
        {
          title: shell.stat.duration,
          value: duration ? formatDuration(duration) : "—",
          tone: "info",
          icon: <Clock className="h-5 w-5" />,
        },
        {
          title: shell.stat.cargo,
          value: cargoCount,
          tone: "warning",
          icon: <Package className="h-5 w-5" />,
          description:
            totalCargoWeight > 0
              ? shell.stat.cargoWeightTotal(totalCargoWeight)
              : undefined,
        },
        {
          title: shell.stat.baseRate,
          value: trip.costs.baseRate > 0 ? formatCurrency(trip.costs.baseRate) : "—",
          tone: "success",
          icon: <DollarSign className="h-5 w-5" />,
        },
      ]}
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
                trip={trip}
                duration={duration}
                distance={distance}
                canEditStructural={canEditStructural}
              />
            ),
          },
          {
            value: "route",
            label: shell.format.routeTab(orderedStops.length),
            content: (
              <TripDetailRouteTab
                trip={trip}
                tripStatus={trip.status}
                orderedStops={orderedStops}
                progress={progress}
                canEditStructural={canEditStructural}
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
                {trip.status === TripStatus.IN_PROGRESS ? (
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
                  tripStartMileage={trip.mileage.start}
                  status={trip.status}
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
                  tripStatus={trip.status}
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
                  tripId={tripId}
                  tripStatus={trip.status}
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
