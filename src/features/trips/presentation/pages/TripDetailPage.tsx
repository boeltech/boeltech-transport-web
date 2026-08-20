/**
 * TripDetailPage
 * FSD: Pages Layer - Composition
 *
 * ACTUALIZADO: Integración con hooks de Cargas y Gastos (Enfoque B)
 * - useTripCargos: Obtiene cargas del viaje via endpoint separado
 * - useTripExpenses: Obtiene gastos del viaje via endpoint separado
 * - useTripExpensesSummary: Obtiene resumen de gastos
 * - Tabs: Operación, Ruta, Seguimiento, Cargas, Costos (historial bajo Operación)

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
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  AlertCircle,
  Truck,
  Clock,
  Package,
  Navigation,
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
  formatTripRouteSubtitle,
} from "@features/trips";

// ── Domain Types ───────────────────────────────────────────────────────────
import {
  type TripStatusType,
  type StopTypeValue,
  TripStatus,
  CargoStatus,
  getOrderedStops,
} from "@features/trips/domain";

import { isClientPortalRole, isDriverPortalRole } from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import {
  TripActions,
  TripInvoiceActions,
  TripStatusBadge,
} from "@features/trips/presentation";
import { useVehicle } from "@features/vehicles";
import {
  TripTrackingTabLazy,
  TripDetailCargoTabLazy,
  TripDetailCostsTabLazy,
  TripDetailTabFallback,
} from "./TripDetailLazyTabs";
import { TripFiscalSection, shouldShowTripFiscalBand } from "../components/TripFiscalSection";
import { TripDetailOperationTab } from "../components/trip-operation";
import { TripDetailRouteTab } from "../components/trip-route";
import { TripConfirmReserveButton } from "../components/trip-readiness/TripConfirmReserveButton";
import { TripReadinessRail } from "../components/trip-readiness/TripReadinessRail";
import { computeTripReadiness } from "../hooks/useTripReadiness";
import { isTripRouteReadyForStartUi } from "../utils/tripStartRouteGating";
import { tripDetailCopy } from "../copy";
import { formatDateTime } from "@shared/utils/dateUtils";
import { getTripDetailAccess } from "./tripDetailAccess";
import {
  parseTripDetailTab,
  resolveDefaultTripDetailTab,
  shouldFetchTripCargos,
  shouldFetchTripExpenses,
  shouldFetchTripExpensesSummary,
  shouldFetchTripTimeline,
} from "./tripDetailQueryGating";
import { buildTripRouteDetailView } from "./tripDetailRouteData";

const shell = tripDetailCopy.shell;

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
  const urlTab = parseTripDetailTab(searchParams.get("tab"));
  /** Origen real (bandeja de aprobaciones, factura…) o el listado de viajes. */
  const backHref = (location.state?.from as string | undefined) ?? "/trips";
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isClientPortal = isClientPortalRole(role);
  const isDriverPortal = isDriverPortalRole(role);
  const isLeanTripPortal = isClientPortal || isDriverPortal;
  const tripId = id || "";
  const canUpdateTrip = hasPermission("trips", "update");
  const canCreateExpense = hasPermission("expenses", "create");
  const canUpdateExpense = hasPermission("expenses", "update");
  const canDeleteExpense = hasPermission("expenses", "delete");
  const canApproveTripExpenses = hasPermission("finance_approvals", "update");
  const canReadInvoices = hasPermission("invoices", "read");
  const canFetchExpenses = !isLeanTripPortal;

  // ══════════════════════════════════════════════════════════════════════════
  // QUERIES
  // ══════════════════════════════════════════════════════════════════════════

  const {
    data: trip,
    isLoading: isLoadingTrip,
    refetch: refetchTrip,
  } = useTrip(tripId);

  const defaultTab = trip
    ? resolveDefaultTripDetailTab({
        status: trip.status,
        routeReady: isTripRouteReadyForStartUi(trip.stops ?? []),
        cargoCount: trip.cargos?.length,
        hasPendingCobro:
          trip.invoicing.canGenerateInvoice ||
          trip.invoicing.canGenerateFalseTripInvoice ||
          trip.requiresFiscalAttention,
        canShowCosts: !isLeanTripPortal,
      })
    : "overview";
  const activeTab = urlTab ?? defaultTab;
  const resolvedActiveTab =
    isLeanTripPortal && activeTab === "costs" ? "overview" : activeTab;

  const { data: trackingTimeline } = useTripTimeline(tripId, {
    enabled: shouldFetchTripTimeline(
      resolvedActiveTab,
      tripId,
      trip?.status,
    ),
  });
  const hasOpenTrackingIncident =
    trackingTimeline?.trip.hasOpenIncident === true;

  const fetchCargos = shouldFetchTripCargos(
    resolvedActiveTab,
    tripId,
    trip?.status,
  );
  const fetchExpenses = shouldFetchTripExpenses(
    resolvedActiveTab,
    tripId,
    canFetchExpenses,
  );

  const {
    data: cargos = [],
    isLoading: isLoadingCargos,
    isError: isErrorCargos,
    refetch: refetchCargos,
  } = useTripCargos(tripId, {
    enabled:
      fetchCargos ||
      trip?.status === TripStatus.DRAFT ||
      trip?.status === TripStatus.SCHEDULED,
  });

  const { data: vehicle } = useVehicle(trip?.vehicleId ?? "", {
    enabled:
      Boolean(trip?.vehicleId) &&
      trip?.status === TripStatus.DRAFT &&
      !isLeanTripPortal,
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
    enabled: shouldFetchTripExpensesSummary(
      resolvedActiveTab,
      tripId,
      canFetchExpenses,
    ),
  });

  useEffect(() => {
    if (!isLeanTripPortal || searchParams.get("tab") !== "costs") return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("tab");
        return next;
      },
      { replace: true },
    );
  }, [isLeanTripPortal, searchParams, setSearchParams]);

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

  const satConfigAutotransporteCode =
    vehicle?.cartaPorte.satConfigAutotransporteCode;

  const tripReadiness = useMemo(() => {
    if (!trip) return null;
    return computeTripReadiness(
      { ...trip, startMileage: trip.mileage.start },
      {
        cargoCount: cargos.length,
        satConfigAutotransporteCode,
      },
    );
  }, [trip, cargos.length, satConfigAutotransporteCode]);

  const tripAlerts = useMemo(() => {
    if (!trip) return undefined;

    const cards: ReactElement[] = [];

    const showReadinessRail =
      !isLeanTripPortal &&
      tripReadiness &&
      (displayStatus === TripStatus.DRAFT ||
        displayStatus === TripStatus.SCHEDULED);
    if (showReadinessRail) {
      cards.push(
        <TripReadinessRail
          key="readiness-rail"
          status={displayStatus}
          items={tripReadiness.items}
          clientName={trip.client?.legalName}
          originCity={trip.originCity}
          destinationCity={trip.destinationCity}
          onGoToTracking={
            displayStatus === TripStatus.SCHEDULED
              ? () => {
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev);
                      next.set("tab", "tracking");
                      return next;
                    },
                    { replace: true },
                  );
                }
              : undefined
          }
          onItemClick={(item) => {
            if (!item.tab) return;
            setSearchParams(
              (prev) => {
                const next = new URLSearchParams(prev);
                next.set("tab", item.tab!);
                return next;
              },
              { replace: true },
            );
          }}
        />,
      );
    }

    if (!isLeanTripPortal && trip.operationalOutcome === "false_trip") {
      if (trip.requiresFiscalAttention && trip.invoicing.invoiceId) {
        cards.push(
          <DetailAlertCard
            key="false-trip-cancel-cfdi"
            severity="critical"
            icon={<Receipt className="h-5 w-5" />}
            title={shell.alert.falseTripCancelCfdiTitle}
          >
            <p>{shell.alert.falseTripCancelCfdiBody}</p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link to={`/invoices/${trip.invoicing.invoiceId}`}>
                {shell.alert.falseTripCancelCfdiCta}
              </Link>
            </Button>
          </DetailAlertCard>,
        );
      }
    } else if (!isLeanTripPortal && trip.requiresFiscalAttention) {
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

    if (
      displayStatus === TripStatus.SCHEDULED &&
      !showReadinessRail
    ) {
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
    tripReadiness,
    setSearchParams,
    isLeanTripPortal,
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

  const usesLiveCargos =
    fetchCargos ||
    trip.status === TripStatus.DRAFT ||
    trip.status === TripStatus.SCHEDULED;
  const cargoCount = usesLiveCargos
    ? cargos.length
    : (trip.cargos?.length ?? 0);
  const totalCargoWeight = usesLiveCargos
    ? cargos.reduce((sum, c) => sum + (c.weight || 0), 0)
    : (trip.cargos?.reduce((sum, c) => sum + (c.weight || 0), 0) ?? 0);
  const pickupStops = orderedStops.filter((stop) => hasStopType(stop.stopType, "pickup"));

  const pendingExpenses = expensesSummary?.pendingCount ?? 0;
  const {
    canEditStructural,
    canEditBaseRate,
    canCreateExpenses,
    canUpdatePendingExpenses,
    canDeletePendingExpenses,
    canManageExpenses: canManageExpensesOnTrip,
    expenseWindowOpen,
    expenseWindowClosed,
    expenseWindowClosesAt,
  } = getTripDetailAccess(resolvedDisplayStatus, {
    canUpdateTrip,
    canCreateExpense,
    canUpdateExpense,
    canDeleteExpense,
    closedAt: trip.actualArrival,
    role,
  });

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
            {trip.operationalOutcome === "false_trip" ? (
              <Badge variant="warning" tone="soft" className="text-xs">
                {shell.alert.falseTripChip}
              </Badge>
            ) : null}
            {hasOpenTrackingIncident ? (
              <Badge variant="destructive" className="text-xs">
                {shell.tab.openIncident}
              </Badge>
            ) : null}
          </div>
        ),
        actions: (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isClientPortal ? (
              canReadInvoices ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link
                    to={
                      trip.invoicing.invoiceId
                        ? `/invoices/${trip.invoicing.invoiceId}`
                        : "/finance?tab=invoices"
                    }
                  >
                    <Receipt className="mr-1.5 h-4 w-4" />
                    {shell.action.viewInvoices}
                  </Link>
                </Button>
              ) : null
            ) : isDriverPortal ? null : (
              <>
                <TripConfirmReserveButton
                  tripId={trip.id}
                  tripCode={trip.tripCode}
                  status={resolvedDisplayStatus}
                  clientId={trip.clientId}
                  prospectiveAmount={trip.costs.baseRate}
                  cfdiDocumentIntent={trip.cfdiDocumentIntent}
                  scheduledArrival={trip.scheduledArrival}
                  fleetReady={tripReadiness?.fleetReady ?? true}
                  startMileage={trip.mileage.start}
                  suggestedStartMileage={vehicle?.currentMileage}
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
                      lines.push(
                        shell.alert.postCancelFiscalInvoiceStatus(
                          f.invoiceStatus,
                        ),
                      );
                      setPostCancelFiscal({
                        title: shell.alert.postCancelFiscalTitle,
                        lines,
                      });
                    }
                  }}
                />
                <TripInvoiceActions trip={trip} presentation="headerMenu" />
                <TripActions
                  variant="detailMenu"
                  tripId={trip.id}
                  tripCode={trip.tripCode}
                  status={resolvedDisplayStatus}
                  hasRealArrival={orderedStops.some(
                    (stop) => stop.actualArrival != null,
                  )}
                  hasDeliveredCargo={cargos.some(
                    (cargo) => cargo.status === CargoStatus.DELIVERED,
                  )}
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
                      lines.push(
                        shell.alert.postCancelFiscalInvoiceStatus(
                          f.invoiceStatus,
                        ),
                      );
                      setPostCancelFiscal({
                        title: shell.alert.postCancelFiscalTitle,
                        lines,
                      });
                    }
                  }}
                />
              </>
            )}
          </div>
        ),
      }}
      alerts={tripAlerts}
      preStats={
        isLeanTripPortal ||
        !shouldShowTripFiscalBand(trip, Boolean(postCancelFiscal))
          ? undefined
          : (
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
        )
      }
      stats={(() => {
        const status = resolvedDisplayStatus;
        if (status === TripStatus.DRAFT || status === TripStatus.SCHEDULED) {
          return undefined;
        }
        const distanceValue =
          distance != null && distance > 0
            ? `${distance.toLocaleString("es-MX")} km`
            : "—";
        const durationValue = duration ? formatDuration(duration) : "—";

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
        ];
      })()}
      tabs={{
        defaultValue: "overview",
        value: resolvedActiveTab,
        onValueChange: (value) => {
          if (isLeanTripPortal && value === "costs") return;
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              if (value === defaultTab) {
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
            label: isClientPortal
              ? shell.tab.operationClient
              : isDriverPortal
                ? shell.tab.operationDriver
                : shell.tab.operation,
            content: (
              <TripDetailOperationTab
                trip={tripForMetrics}
                canEditStructural={canEditStructural}
                showClientLink={!isLeanTripPortal}
                showMileage={!isClientPortal}
                statusHistory={trip.statusHistory}
              />
            ),
          },
          {
            value: "route",
            label: shell.format.routeTab(orderedStops.length),
            forceMount: true,
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
                  falseTripDeclaredBy={trip.falseTripDeclaredBy}
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
          ...(isLeanTripPortal
            ? []
            : [
                {
                  value: "costs" as const,
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
                        canCreateExpenses={canCreateExpenses}
                        canUpdatePendingExpenses={canUpdatePendingExpenses}
                        canDeletePendingExpenses={canDeletePendingExpenses}
                        canManageExpenses={canManageExpensesOnTrip}
                        expenseWindowOpen={expenseWindowOpen}
                        expenseWindowClosed={expenseWindowClosed}
                        expenseWindowClosesAt={expenseWindowClosesAt}
                        canApproveExpenses={canApproveTripExpenses}
                        pendingExpenseCount={pendingExpenses}
                        tripCode={trip.tripCode}
                        operationalOutcome={trip.operationalOutcome}
                        invoiceStatus={trip.invoicing.invoiceStatus}
                      />
                    </Suspense>
                  ),
                },
              ]),
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
