/**
 * TripDetailPage
 * FSD: Pages Layer - Composition
 *
 * ACTUALIZADO: Integración con hooks de Cargas y Gastos (Enfoque B)
 * - useTripCargos: Obtiene cargas del viaje via endpoint separado
 * - useTripExpenses: Obtiene gastos del viaje via endpoint separado
 * - useTripExpensesSummary: Obtiene resumen de gastos
 * - Tabs: Resumen, Ruta, Seguimiento, Cargas, Costos, Facturación/Cobro

 *
 * Clean Architecture: Page compone componentes de Presentation + hooks de Application
 */

import { Suspense, useEffect, useMemo, useState, type ReactElement } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { DetailPageShell } from "@shared/ui/page-shells";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  AlertCircle,
  Truck,
  Receipt,
  Wallet,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// ── Hooks de Application Layer ─────────────────────────────────────────────
import {
  useTrip,
  useTripTimeline,
  useTripCargos,
  useTripExpenses,
  useTripExpensesSummary,
  useTripRevenueSplit,
  calculateDistance,
  calculateTripDuration,
  formatDuration,
} from "@features/trips";
import { useInvoice } from "@features/invoicing/application";

// ── Domain Types ───────────────────────────────────────────────────────────
import {
  type TripStatusType,
  type StopTypeValue,
  TripStatus,
  CargoStatus,
  canReassignTripFleet,
  getOrderedStops,
  hasOperationalCashCollected,
} from "@features/trips/domain";

import {
  isClientPortalRole,
  isDriverPortalRole,
  ROLES,
} from "@shared/constants/roles";
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
  TripDetailBillingTabLazy,
  TripDetailTabFallback,
} from "./TripDetailLazyTabs";
import { TripLinkedInvoiceDraftsSheet } from "../components/TripLinkedInvoiceDraftsSheet";
import { TripRevenueSplitSheet } from "../components/TripRevenueSplitSheet";
import { TripJourneyStrip } from "../components/trip-shell/TripJourneyStrip";
import { TripShellAlertsStack } from "../components/trip-shell/TripShellAlertsStack";
import { TripPhaseOperateSheets } from "../components/trip-shell/TripPhaseOperateSheets";
import { buildRegisterCollectionPath } from "@features/finance/application";
import { buildTripJourneyStripModel } from "../helpers/buildTripJourneyStripModel";
import {
  formatTripLateDelayChip,
  resolveTripLateDelayMs,
} from "../helpers/formatTripLateDelayChip";
import { formatTripRouteTitle } from "../helpers/formatTripRouteTitle";
import {
  resolveTrackingPrimaryAction,
  resolveTrackingPrimaryCtaLabel,
} from "../components/trip-tracking/trackingNextAction";
import {
  resolveTripAccessDeniedCopy,
  resolveTripBackHref,
  resolveTripWayfindingBackLabel,
} from "../utils/tripWayfinding";
import { TripDetailOperationTab } from "../components/trip-operation";
import { TripDetailRouteTab } from "../components/trip-route";
import { TripConfirmReserveButton } from "../components/trip-readiness/TripConfirmReserveButton";
import { TripNextStepBlock } from "../components/trip-readiness/TripNextStepBlock";
import { TripReadinessRail } from "../components/trip-readiness/TripReadinessRail";
import { listLinkedTripInvoiceDrafts } from "../helpers/listLinkedTripInvoiceDrafts";
import { resolveDraftRouteGap } from "../helpers/resolveDraftRouteGap";
import { resolveTripNextStepActions } from "../helpers/resolveTripNextStepActions";
import { resolveTripNextStepDescription } from "../helpers/resolveTripNextStepDescription";
import {
  hasFreightFamilyTripInvoiceScope,
  listEligibleTripInvoiceScopes,
  resolveTripInvoiceScopeDecision,
} from "../helpers/listEligibleTripInvoiceScopes";
import { computeTripReadiness } from "../hooks/useTripReadiness";
import { isTripRouteReadyForStartUi } from "../utils/tripStartRouteGating";
import { tripDetailCopy } from "../copy";
import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";
import { resolveDetailQueryErrorState } from "@shared/utils/resolveQueryErrorState";
import { getTripDetailAccess } from "./tripDetailAccess";
import { applyOpenAssignFleetSearchParams } from "./tripDetailAssignFleetParams";
import {
  parseTripDetailTab,
  resolveCargoCountForDefaultTab,
  resolveDefaultTripDetailTab,
  shouldFetchTripCargos,
  shouldFetchTripExpenses,
  shouldFetchTripExpensesSummary,
  shouldFetchTripTimeline,
  shouldShowShellOpenIncidentBanner,
} from "./tripDetailQueryGating";
import { buildTripRouteDetailView } from "./tripDetailRouteData";
import { buildPostCancelFiscalAlertLines } from "../helpers/buildPostCancelFiscalAlertLines";
import { resolveFiscalAttentionAlertSlot } from "../helpers/resolveFiscalAttentionAlertSlot";
import { resolveFiscalAttentionBannerMode } from "../helpers/resolveFiscalAttentionBannerMode";
import {
  canShowFiscalSubstituteCta,
  resolveFiscalAttentionCta,
} from "../helpers/resolveFiscalAttentionCta";

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
  const backHref = resolveTripBackHref(
    location.state?.from as string | undefined,
  );
  const backLabel = resolveTripWayfindingBackLabel(backHref);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isClientPortal = isClientPortalRole(role);
  const isDriverPortal = isDriverPortalRole(role);
  const isLeanTripPortal = isClientPortal || isDriverPortal;
  const tripId = id || "";
  /** `state.from` al abrir una factura desde este viaje (chevron de vuelta). */
  const tripDetailFromHref = `/trips/${tripId}`;
  const canUpdateTrip = hasPermission("trips", "update");
  const canReadExpenses = hasPermission("expenses", "read");
  const canCreateExpense = hasPermission("expenses", "create");
  const canUpdateExpense = hasPermission("expenses", "update");
  const canDeleteExpense = hasPermission("expenses", "delete");
  const canApproveTripExpenses = hasPermission("finance_approvals", "update");
  const canReadInvoices = hasPermission("invoices", "read");
  const canCreateInvoices = hasPermission("invoices", "create");
  const canSubstituteFiscal = canShowFiscalSubstituteCta({
    canAdminManagerFiscal:
      role === ROLES.ADMIN || role === ROLES.MANAGER,
  });
  const isDispatcher = role === ROLES.DISPATCHER;
  const isManager = role === ROLES.MANAGER;
  const canFetchExpenses = !isLeanTripPortal && canReadExpenses;

  // ══════════════════════════════════════════════════════════════════════════
  // QUERIES
  // ══════════════════════════════════════════════════════════════════════════

  const {
    data: trip,
    isLoading: isLoadingTrip,
    isError: isTripError,
    error: tripError,
    refetch: refetchTrip,
  } = useTrip(tripId);

  const needsFiscalAttentionSplitLegs =
    !isLeanTripPortal &&
    Boolean(trip?.requiresFiscalAttention) &&
    Boolean(trip?.invoicing.hasActiveSplit) &&
    trip?.operationalOutcome !== "false_trip";

  const {
    data: revenueSplitForFiscalCta,
    isFetched: revenueSplitForFiscalCtaFetched,
  } = useTripRevenueSplit(tripId, {
    enabled: Boolean(tripId) && needsFiscalAttentionSplitLegs,
  });

  /** Legacy flag mid-trip + flete en parcial: no empujar Sustituir/flota. */
  const principalInvoiceIdForPartial = trip?.invoicing.invoiceId ?? null;
  const { data: principalInvoiceForPartial } = useInvoice(
    principalInvoiceIdForPartial ?? "",
    {
      enabled: Boolean(
        !isLeanTripPortal &&
          trip?.requiresFiscalAttention &&
          principalInvoiceIdForPartial &&
          trip.operationalOutcome !== "false_trip" &&
          trip.status !== "cancelled",
      ),
    },
  );
  const freightHasPartialSubstitution = Boolean(
    principalInvoiceForPartial?.activeReplacement,
  );

  const tripQueryState = resolveDetailQueryErrorState({
    missingId: !tripId,
    isError: isTripError,
    error: tripError,
    hasData: Boolean(trip),
  });

  const bootstrapDefaultTab = trip
    ? resolveDefaultTripDetailTab({
        status: trip.status,
        routeReady: isTripRouteReadyForStartUi(trip.stops ?? []),
        cargoCount:
          trip.status === TripStatus.DRAFT ? undefined : trip.cargos?.length,
        isClientPortal,
      })
    : "overview";
  const bootstrapActiveTab = urlTab ?? bootstrapDefaultTab ?? "overview";
  const resolvedBootstrapTab =
    !canFetchExpenses && bootstrapActiveTab === "costs"
      ? "overview"
      : isLeanTripPortal && bootstrapActiveTab === "costs"
        ? "overview"
        : bootstrapActiveTab;

  const fetchCargos = shouldFetchTripCargos(
    resolvedBootstrapTab,
    tripId,
    trip?.status,
  );
  const fetchExpenses = shouldFetchTripExpenses(
    resolvedBootstrapTab,
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

  const cargoCountForDefault = trip
    ? resolveCargoCountForDefaultTab({
        status: trip.status,
        isLoadingLiveCargos: isLoadingCargos,
        liveCargoCount: cargos.length,
        embeddedCargoCount: trip.cargos?.length,
      })
    : undefined;

  const resolvedDefaultTab = trip
    ? resolveDefaultTripDetailTab({
        status: trip.status,
        routeReady: isTripRouteReadyForStartUi(trip.stops ?? []),
        cargoCount: cargoCountForDefault,
        isClientPortal,
      })
    : "overview";
  const isWaitingDefaultTab = resolvedDefaultTab === null && !urlTab;
  const defaultTab = resolvedDefaultTab ?? "overview";
  const activeTab = urlTab ?? defaultTab;
  const resolvedActiveTab =
    !canFetchExpenses && activeTab === "costs"
      ? "overview"
      : isLeanTripPortal && activeTab === "costs"
        ? "overview"
        : activeTab;

  const timelineEnabled = shouldFetchTripTimeline(
    resolvedActiveTab,
    tripId,
    trip?.status,
  );
  const { data: trackingTimeline } = useTripTimeline(tripId, {
    enabled: timelineEnabled,
  });
  const hasOpenTrackingIncident =
    timelineEnabled && trackingTimeline?.trip.hasOpenIncident === true;

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
    if (searchParams.get("tab") !== "costs") return;
    if (canFetchExpenses) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("tab");
        return next;
      },
      { replace: true },
    );
  }, [canFetchExpenses, searchParams, setSearchParams]);

  // Stops del viaje (vienen en el trip o se pueden obtener separados)
  const stops = trip?.stops ?? [];
  const orderedStops = getOrderedStops(stops);

  const routeDetail = useMemo(
    () =>
      trip
        ? buildTripRouteDetailView(
            trip,
            timelineEnabled ? trackingTimeline : undefined,
          )
        : null,
    [trip, timelineEnabled, trackingTimeline],
  );

  /** Estado operativo del chrome/CTAs: siempre el GET detail (no timeline cacheado). */
  const displayStatus: TripStatusType | undefined = trip?.status;

  // ══════════════════════════════════════════════════════════════════════════
  // LOCAL STATE
  // ══════════════════════════════════════════════════════════════════════════

  const [comparisonNowMs, setComparisonNowMs] = useState(() => Date.now());
  const [postCancelFiscal, setPostCancelFiscal] = useState<{
    title: string;
    lines: readonly string[];
  } | null>(null);
  const [revenueSplitSheetOpen, setRevenueSplitSheetOpen] = useState(false);
  const [invoiceScopeSheetOpen, setInvoiceScopeSheetOpen] = useState(false);
  const [linkedDraftsSheetOpen, setLinkedDraftsSheetOpen] = useState(false);
  const [phaseOperateOpen, setPhaseOperateOpen] = useState(false);
  /** D44 — edición local en tab Ruta (drafts / sheet parada). */
  const [routeEditing, setRouteEditing] = useState(false);
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

  /** Split legs para scopes Facturar + tab Facturación (F5). */
  const needsInvoiceScopeSplit =
    Boolean(trip) &&
    !isLeanTripPortal &&
    trip?.cfdiEmissionIntent !== "sin_cfdi_efectivo" &&
    trip?.operationalOutcome !== "false_trip" &&
    (Boolean(trip?.invoicing.hasActiveSplit) ||
      Boolean(canCreateInvoices && trip?.invoicing.canGenerateInvoice) ||
      (trip?.invoicing.splitLegsTotal ?? 0) > 0);

  const { data: revenueSplitForInvoiceScopes } = useTripRevenueSplit(tripId, {
    enabled: Boolean(tripId) && needsInvoiceScopeSplit,
  });

  const pendingSplitLegsForInvoice = useMemo(() => {
    if (revenueSplitForInvoiceScopes?.status !== "active") return [];
    return revenueSplitForInvoiceScopes.legs.filter((leg) => !leg.invoiceId);
  }, [revenueSplitForInvoiceScopes]);

  /** Scopes create elegibles (F3); misma verdad que menú / sheet. */
  const eligibleInvoiceScopes = useMemo(() => {
    if (!trip || isLeanTripPortal) return [];
    return listEligibleTripInvoiceScopes({
      tripId: trip.id,
      status: trip.status,
      operationalOutcome: trip.operationalOutcome,
      cfdiEmissionIntent: trip.cfdiEmissionIntent,
      canCreateInvoices,
      canGenerateInvoice: trip.invoicing.canGenerateInvoice,
      canGenerateFalseTripInvoice: trip.invoicing.canGenerateFalseTripInvoice,
      canGenerateAccessoryInvoice: trip.invoicing.canGenerateAccessoryInvoice,
      canGenerateSplitShareInvoice: trip.invoicing.canGenerateSplitShareInvoice,
      hasActiveSplit: trip.invoicing.hasActiveSplit,
      cartaPorteAttached: trip.invoicing.cartaPorteAttached,
      pendingSplitLegs: pendingSplitLegsForInvoice,
    });
  }, [
    trip,
    isLeanTripPortal,
    canCreateInvoices,
    pendingSplitLegsForInvoice,
  ]);

  const invoiceScopeDecision = useMemo(
    () => resolveTripInvoiceScopeDecision(eligibleInvoiceScopes),
    [eligibleInvoiceScopes],
  );

  /** D10: next-step Facturar solo con freight-family; accessory-only no eleva. */
  const canInvoiceNextStep =
    hasFreightFamilyTripInvoiceScope(eligibleInvoiceScopes);

  /** F9 / D16–D18 / F9b D18′: borradores ligados (señales locales del GET). */
  const linkedDraftInvoices = useMemo(() => {
    if (!trip) return [] as const;
    return listLinkedTripInvoiceDrafts(trip.invoicing);
  }, [trip]);

  const linkedDraftInvoiceIds = useMemo(
    () => linkedDraftInvoices.map((d) => d.id),
    [linkedDraftInvoices],
  );

  const nextStepPlan = useMemo(() => {
    if (!trip || isLeanTripPortal || !tripReadiness) return null;
    const routeReady = tripReadiness.items.some(
      (item) => item.id === "route" && item.done,
    );
    const cargoReady = tripReadiness.items.some(
      (item) => item.id === "cargo" && item.done,
    );
    return resolveTripNextStepActions({
      status: displayStatus ?? trip.status,
      routeReady,
      cargoReady,
      draftRouteGap: routeReady
        ? null
        : resolveDraftRouteGap(trip.stops ?? []),
      canUpdateTrip,
      canInvoice: canInvoiceNextStep,
      requiresFiscalAttention: Boolean(trip.requiresFiscalAttention),
      activeTab: resolvedActiveTab,
      linkedDraftInvoiceIds,
    });
  }, [
    trip,
    isLeanTripPortal,
    tripReadiness,
    displayStatus,
    canUpdateTrip,
    canInvoiceNextStep,
    resolvedActiveTab,
    linkedDraftInvoiceIds,
  ]);

  const tripAlerts = useMemo(() => {
    if (!trip) return undefined;

    /** Orden de push ≈ D32 (1 ops → 5 pendientes). Stack muestra ≤1 + «N más». */
    const cards: ReactElement[] = [];

    // F8 / D15: card standalone solo si no hay next-step (evitar doble checklist ATF).
    const showStandaloneReadinessRail =
      !nextStepPlan &&
      !isLeanTripPortal &&
      tripReadiness &&
      (displayStatus === TripStatus.DRAFT ||
        displayStatus === TripStatus.SCHEDULED) &&
      !(
        displayStatus === TripStatus.SCHEDULED &&
        resolvedActiveTab === "tracking"
      );
    if (showStandaloneReadinessRail) {
      cards.push(
        <TripReadinessRail
          key="readiness-rail"
          status={displayStatus}
          items={tripReadiness.items}
          clientName={trip.client?.legalName}
          originCity={trip.originCity}
          destinationCity={trip.destinationCity}
          emphasis="secondary"
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

    // PD1: ATF banners coexist with invoicing console (preStats); do not gate on console.
    if (!isLeanTripPortal && trip.cfdiEmissionIntent !== "sin_cfdi_efectivo") {
      const fiscalAlertSlot = resolveFiscalAttentionAlertSlot({
        mode: resolveFiscalAttentionBannerMode({
          operationalOutcome: trip.operationalOutcome,
          requiresFiscalAttention: trip.requiresFiscalAttention,
          status: trip.status,
          invoicing: trip.invoicing,
        }),
        freightHasPartialSubstitution,
      });

      if (fiscalAlertSlot === "falseTrip") {
        const cancelInvoiceId =
          trip.invoicing.primaryTransportInvoiceId ?? trip.invoicing.invoiceId;
        cards.push(
          <DetailAlertCard
            key="false-trip-cancel-cfdi"
            severity="critical"
            icon={<Receipt className="h-5 w-5" />}
            title={shell.alert.falseTripCancelCfdiTitle}
            action={
              cancelInvoiceId ? (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={`/invoices/${cancelInvoiceId}`}
                    state={{ from: tripDetailFromHref }}
                  >
                    {shell.alert.falseTripCancelCfdiCta}
                  </Link>
                </Button>
              ) : null
            }
          >
            <p>{shell.alert.falseTripCancelCfdiBody}</p>
          </DetailAlertCard>,
        );
      } else if (fiscalAlertSlot === "partialSubstitution") {
        const originalInvoiceId =
          principalInvoiceForPartial?.id ?? trip.invoicing.invoiceId;
        cards.push(
          <DetailAlertCard
            key="substitution-cancel-pending"
            severity="critical"
            icon={<Receipt className="h-5 w-5" />}
            title={shell.alert.substitutionCancelPendingTitle}
            action={
              originalInvoiceId ? (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={`/invoices/${originalInvoiceId}`}
                    state={{ from: tripDetailFromHref }}
                  >
                    {shell.alert.substitutionCancelPendingCta}
                  </Link>
                </Button>
              ) : null
            }
          >
            <p>{shell.alert.substitutionCancelPendingBody}</p>
          </DetailAlertCard>,
        );
      } else if (
        fiscalAlertSlot === "postCancel" ||
        fiscalAlertSlot === "midTrip"
      ) {
        const isPostCancel = fiscalAlertSlot === "postCancel";
        const fiscalCta = resolveFiscalAttentionCta({
          requiresFiscalAttention: trip.requiresFiscalAttention,
          hasActiveSplit: trip.invoicing.hasActiveSplit,
          principalInvoiceId: trip.invoicing.invoiceId,
          splitLegsReady: revenueSplitForFiscalCtaFetched,
          splitLegs: revenueSplitForFiscalCta?.legs ?? [],
        });

        let body: string = isPostCancel
          ? shell.alert.postCancelFiscalAttentionNoInvoiceBody
          : shell.alert.fiscalAttentionNoInvoiceBody;
        let cta: ReactElement | null = null;
        const escalateMidTrip =
          !isPostCancel && !canSubstituteFiscal && isDispatcher;
        const askManagerSat =
          !isPostCancel && !canSubstituteFiscal && !isDispatcher;

        if (escalateMidTrip) {
          body = shell.alert.fiscalAttentionEscalateBody;
        } else if (askManagerSat) {
          body = shell.alert.fiscalAttentionAskManagerBody;
          if (fiscalCta.kind === "primary" && fiscalCta.invoiceId) {
            cta = (
              <Link
                to={`/invoices/${fiscalCta.invoiceId}`}
                state={{ from: tripDetailFromHref }}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {shell.alert.fiscalAttentionOpenInvoiceCta}
              </Link>
            );
          } else if (
            fiscalCta.kind === "split" &&
            fiscalCta.bodyKey === "withInvoices"
          ) {
            const legs = fiscalCta.invoicedLegs;
            if (legs.length === 1) {
              cta = (
                <Link
                  to={`/invoices/${legs[0].invoiceId}`}
                  state={{ from: tripDetailFromHref }}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {shell.alert.fiscalAttentionOpenInvoiceCta}
                </Link>
              );
            } else if (legs.length > 1) {
              cta = (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {shell.alert.fiscalAttentionSplitMenuCta}
                      <ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    {legs.map((leg) => (
                      <DropdownMenuItem key={leg.invoiceId} asChild>
                        <Link
                          to={`/invoices/${leg.invoiceId}`}
                          state={{ from: tripDetailFromHref }}
                        >
                          {shell.alert.fiscalAttentionSplitLegCta(leg.label)}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
          }
        } else if (fiscalCta.kind === "primary") {
          body =
            fiscalCta.bodyKey === "withInvoice"
              ? isPostCancel
                ? shell.alert.postCancelFiscalAttentionBody
                : isManager
                  ? shell.alert.fiscalAttentionManagerBody
                  : shell.alert.fiscalAttentionBody
              : isPostCancel
                ? shell.alert.postCancelFiscalAttentionNoInvoiceBody
                : shell.alert.fiscalAttentionNoInvoiceBody;
          if (fiscalCta.invoiceId) {
            cta = (
              <Link
                to={`/invoices/${fiscalCta.invoiceId}`}
                state={{ from: tripDetailFromHref }}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {isPostCancel
                  ? shell.alert.postCancelFiscalAttentionCta
                  : shell.alert.fiscalAttentionCta}
              </Link>
            );
          }
        } else if (fiscalCta.kind === "split") {
          if (fiscalCta.bodyKey === "noInvoicesYet") {
            body = isPostCancel
              ? shell.alert.postCancelFiscalAttentionSplitNoInvoiceBody
              : shell.alert.fiscalAttentionSplitNoInvoiceBody;
          } else {
            body = isPostCancel
              ? shell.alert.postCancelFiscalAttentionSplitBody
              : isManager
                ? shell.alert.fiscalAttentionSplitManagerBody
                : shell.alert.fiscalAttentionSplitBody;
          }
          if (fiscalCta.bodyKey === "withInvoices") {
            const legs = fiscalCta.invoicedLegs;
            if (legs.length === 1) {
              cta = (
                <Link
                  to={`/invoices/${legs[0].invoiceId}`}
                  state={{ from: tripDetailFromHref }}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {isPostCancel
                    ? shell.alert.postCancelFiscalAttentionSplitCta
                    : shell.alert.fiscalAttentionSplitCta}
                </Link>
              );
            } else if (legs.length > 1) {
              cta = (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {isPostCancel
                        ? shell.alert.postCancelFiscalAttentionSplitMenuCta
                        : shell.alert.fiscalAttentionSplitMenuCta}
                      <ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    {legs.map((leg) => (
                      <DropdownMenuItem key={leg.invoiceId} asChild>
                        <Link
                          to={`/invoices/${leg.invoiceId}`}
                          state={{ from: tripDetailFromHref }}
                        >
                          {shell.alert.fiscalAttentionSplitLegCta(leg.label)}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
          }
        }

        cards.push(
          <DetailAlertCard
            key={isPostCancel ? "post-cancel-fiscal" : "fiscal-attention"}
            severity="warning"
            icon={<Receipt className="h-5 w-5" />}
            title={
              isPostCancel
                ? shell.alert.postCancelFiscalAttentionTitle
                : shell.alert.fiscalAttentionTitle
            }
          >
            <p>
              {body} {cta}
            </p>
          </DetailAlertCard>,
        );
      }
    }

    // D6: banner aunque haya readiness rail — en SCHEDULED el rail no muestra flota.
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
        const canAssignFleetFromAlert =
          !isLeanTripPortal &&
          canUpdateTrip &&
          canReassignTripFleet(trip.status);
        cards.push(
          <DetailAlertCard
            key="assignment-incomplete"
            severity="warning"
            icon={<AlertTriangle className="h-5 w-5" />}
            title={shell.alert.assignmentIncompleteTitle}
            items={missing}
            action={
              canAssignFleetFromAlert ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchParams(
                      (prev) => applyOpenAssignFleetSearchParams(prev),
                      { replace: true },
                    );
                  }}
                >
                  {tripDetailCopy.operation.action.assignFleet}
                </Button>
              ) : null
            }
          />,
        );
      }
    }

    // Q8 / D33: retraso de Salida/Llegada vive en la franja (no banner ETA).

    if (
      displayStatus === TripStatus.IN_PROGRESS &&
      (!trip.vehicle || !trip.driver)
    ) {
      // V4 P1: sin strip mid-trip — aviso de flota vive aquí / card Flota (F4).
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
        const canAssignFleetFromAlert =
          !isLeanTripPortal &&
          canUpdateTrip &&
          canReassignTripFleet(trip.status);
        cards.push(
          <DetailAlertCard
            key="operation-missing"
            severity="critical"
            icon={<AlertTriangle className="h-5 w-5" />}
            title={shell.alert.operationIncompleteTitle}
            items={missing}
            action={
              canAssignFleetFromAlert ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchParams(
                      (prev) => applyOpenAssignFleetSearchParams(prev),
                      { replace: true },
                    );
                  }}
                >
                  {tripDetailCopy.operation.action.assignFleet}
                </Button>
              ) : null
            }
          />,
        );
      }
    }

    if (
      hasOpenTrackingIncident &&
      shouldShowShellOpenIncidentBanner(resolvedActiveTab)
    ) {
      cards.push(
        <DetailAlertCard
          key="tracking-incident-open"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={shell.alert.openIncidentTitle}
        >
          <p>{shell.alert.openIncidentBody}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              setSearchParams(
                (prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("tab", "tracking");
                  return next;
                },
                { replace: true },
              );
            }}
          >
            {shell.alert.openIncidentCta}
          </Button>
        </DetailAlertCard>,
      );
    }

    // D14 / D30: modo Sin factura = chip en subtítulo; no banner informativo ATF.
    if (
      trip.cfdiEmissionIntent === "sin_cfdi_efectivo" &&
      hasOperationalCashCollected(trip)
    ) {
      cards.push(
        <DetailAlertCard
          key="sin-cfdi-cash-freeze"
          severity="warning"
          icon={<AlertCircle className="h-5 w-5" />}
          title={cfdiEmissionIntentCopy.governance.cashFreeze}
        >
          <p>{cfdiEmissionIntentCopy.governance.cashFreezeHint}</p>
        </DetailAlertCard>,
      );
    }

    if (cards.length === 0) return undefined;
    return <TripShellAlertsStack alerts={cards} />;
  }, [
    trip,
    displayStatus,
    hasOpenTrackingIncident,
    tripReadiness,
    nextStepPlan,
    setSearchParams,
    isLeanTripPortal,
    canUpdateTrip,
    canSubstituteFiscal,
    isDispatcher,
    isManager,
    freightHasPartialSubstitution,
    principalInvoiceForPartial,
    revenueSplitForFiscalCta,
    revenueSplitForFiscalCtaFetched,
    resolvedActiveTab,
    tripDetailFromHref,
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════

  if ((isLoadingTrip && !trip) || isWaitingDefaultTab) {
    return (
      <DetailPageShell
        isLoading
        header={{
          backHref,
          backLabel,
          icon: <Truck className="h-6 w-6" />,
          title: shell.title.fallback,
        }}
      />
    );
  }

  if (tripQueryState === "forbidden") {
    const accessDenied = resolveTripAccessDeniedCopy(
      isDriverPortal,
      isClientPortal,
    );
    return (
      <DetailPageShell
        isLoading={false}
        notFound
        notFoundConfig={{
          icon: <AlertCircle />,
          title: accessDenied.title,
          description: accessDenied.description,
          backHref: "/trips",
          backLabel: accessDenied.backLabel,
        }}
        header={{
          backHref,
          backLabel,
          icon: <Truck className="h-6 w-6" />,
          title: shell.title.fallback,
        }}
      />
    );
  }

  if (tripQueryState === "notFound") {
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
          backLabel,
          icon: <Truck className="h-6 w-6" />,
          title: shell.title.fallback,
        }}
      />
    );
  }

  if (
    tripQueryState === "serverError" ||
    tripQueryState === "unknownError" ||
    tripQueryState === "missingId"
  ) {
    return (
      <DetailPageShell
        isLoading={false}
        header={{
          backHref,
          backLabel,
          icon: <Truck className="h-6 w-6" />,
          title: shell.title.fallback,
        }}
      >
        <DetailAlertCard
          severity="critical"
          icon={<AlertTriangle className="h-4 w-4" />}
          title={shell.state.loadErrorTitle}
          items={[{ text: shell.state.loadErrorDescription }]}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void refetchTrip()}
        >
          {shell.state.retryLoad}
        </Button>
      </DetailPageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOT FOUND STATE (sin datos tras carga exitosa vacía)
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
          backLabel,
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
  const resolvedDisplayStatus: TripStatusType = trip.status;
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
  const pickupStops = orderedStops.filter((stop) => hasStopType(stop.stopType, "pickup"));

  const pendingExpenses = expensesSummary?.pendingCount ?? 0;
  const {
    canEditStructural,
    canEditBaseRate,
    canEditRouteType,
    canAppendCargo,
    canReplanPendingStops,
    canReassignFleet,
    canCreateExpenses,
    canUpdatePendingExpenses,
    canDeletePendingExpenses,
    canUpdateReturnedExpenses,
    canDeleteReturnedExpenses,
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

  const goToNextStepTab = (tab: "route" | "cargo" | "tracking") => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
  };

  const handleNextStepInvoice = () => {
    if (invoiceScopeDecision.kind === "navigate") {
      navigate(invoiceScopeDecision.href, {
        state: { from: tripDetailFromHref },
      });
      return;
    }
    if (invoiceScopeDecision.kind === "open_sheet") {
      setInvoiceScopeSheetOpen(true);
    }
  };

  const handleNextStepOpenDraft = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`, {
      state: { from: tripDetailFromHref },
    });
  };

  const handleNextStepViewInvoices = () => {
    /** D18′: N≥2 borradores → sheet de elección (no navigate-first; no scroll consola). */
    if (linkedDraftInvoices.length >= 2) {
      setLinkedDraftsSheetOpen(true);
    }
  };

  const handleNextStepOpenOperate = () => {
    setPhaseOperateOpen(true);
  };

  const goToTrackingTab = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", "tracking");
        return next;
      },
      { replace: true },
    );
  };

  const trackingPrimaryAction = nextStepPlan
    ? resolveTrackingPrimaryAction(
        resolvedDisplayStatus,
        orderedStops,
        cargos,
        { canMutateCargo: canUpdateTrip },
      )
    : null;
  const operatePrimaryLabel = trackingPrimaryAction?.title ?? null;
  const operateCtaLabel = trackingPrimaryAction
    ? resolveTrackingPrimaryCtaLabel(trackingPrimaryAction)
    : null;

  const nextStepLate =
    Boolean(nextStepPlan) &&
    (resolvedDisplayStatus === TripStatus.SCHEDULED ||
      resolvedDisplayStatus === TripStatus.IN_PROGRESS) &&
    ((resolvedDisplayStatus === TripStatus.SCHEDULED &&
      trip.scheduledDeparture.getTime() < comparisonNowMs &&
      !trip.actualDeparture) ||
      (Boolean(trip.scheduledArrival) &&
        trip.scheduledArrival!.getTime() < comparisonNowMs &&
        !trip.actualArrival));

  const lateDelayMs = nextStepLate
    ? resolveTripLateDelayMs({
        nowMs: comparisonNowMs,
        scheduledDepartureMs: trip.scheduledDeparture.getTime(),
        scheduledArrivalMs: trip.scheduledArrival?.getTime() ?? null,
        hasActualDeparture: Boolean(trip.actualDeparture),
        hasActualArrival: Boolean(trip.actualArrival),
      })
    : null;
  const lateDelayLabel =
    lateDelayMs != null ? formatTripLateDelayChip(lateDelayMs) : null;

  const handleSelectLinkedDraft = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`, {
      state: { from: tripDetailFromHref },
    });
  };

  const confirmReserveButton = (
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
      onReassignFleet={() => {
        setSearchParams(
          (prev) => applyOpenAssignFleetSearchParams(prev),
          { replace: true },
        );
      }}
      onActionComplete={(updated) => {
        const f = updated?.fiscalActionRequired;
        if (f) {
          setPostCancelFiscal({
            title: shell.alert.postCancelFiscalTitle,
            lines: buildPostCancelFiscalAlertLines(f),
          });
        }
      }}
    />
  );

  const nextStepElevateInvoice =
    canInvoiceNextStep && !trip.requiresFiscalAttention;

  const nextStepAlerts = nextStepPlan ? (
    <TripNextStepBlock
      plan={nextStepPlan}
      description={resolveTripNextStepDescription({
        phase: nextStepPlan.phase,
        fleetReady: tripReadiness?.fleetReady ?? true,
        elevateInvoice:
          (nextStepPlan.phase === "scheduled" ||
            nextStepPlan.phase === "in_progress") &&
          nextStepElevateInvoice,
        linkedDraftCount: linkedDraftInvoiceIds.length,
        splitLegsInvoiced: trip.invoicing.splitLegsInvoiced,
        splitLegsTotal: trip.invoicing.splitLegsTotal,
      })}
      confirmReserveSlot={
        nextStepPlan.primary.id === "confirm_reserve"
          ? confirmReserveButton
          : undefined
      }
      operatePrimaryLabel={operatePrimaryLabel}
      operateCtaLabel={operateCtaLabel}
      late={nextStepLate}
      lateDelayLabel={lateDelayLabel}
      primaryDemoted={phaseOperateOpen || routeEditing}
      onNavigateTab={goToNextStepTab}
      onInvoice={handleNextStepInvoice}
      onOpenOperate={handleNextStepOpenOperate}
      onOpenDraft={handleNextStepOpenDraft}
      onViewInvoices={handleNextStepViewInvoices}
      readinessStatus={
        resolvedDisplayStatus === TripStatus.DRAFT ||
        resolvedDisplayStatus === TripStatus.SCHEDULED
          ? resolvedDisplayStatus
          : undefined
      }
      readinessItems={tripReadiness?.items}
      onReadinessItemClick={(item) => {
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
    />
  ) : null;

  /** F1 ATF: franja → Qué sigue → ≤1 aviso. V4 P1: sin strip mid-trip. */
  const journeyStrip = !isLeanTripPortal ? (
    <TripJourneyStrip
      model={buildTripJourneyStripModel({
        trip,
        status: resolvedDisplayStatus,
        orderedStops,
        cargoCount,
        distanceKm: distance,
        durationLabel: duration ? formatDuration(duration) : null,
        nowMs: comparisonNowMs,
      })}
    />
  ) : null;

  const composedAboveTabs =
    journeyStrip || nextStepAlerts || tripAlerts ? (
      <div className="space-y-3">
        {journeyStrip}
        {nextStepAlerts}
        {tripAlerts}
      </div>
    ) : undefined;

  return (
    <>
      <DetailPageShell
      isLoading={false}
      header={{
        backHref,
        backLabel,
        icon: <Truck className="h-6 w-6" />,
        iconVariant:
          resolvedDisplayStatus === TripStatus.CANCELLED ? "muted" : "primary",
        title: (
          <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 truncate">
              {formatTripRouteTitle(orderedStops, {
                originCity: trip.originCity,
                originState: trip.originState,
                destinationCity: trip.destinationCity,
                destinationState: trip.destinationState,
              })}
            </span>
            <TripStatusBadge
              status={resolvedDisplayStatus}
              size="sm"
              showIcon
            />
            {trip.requiresFiscalAttention ? (
              <Badge
                variant="warning"
                tone="soft"
                className="text-xs"
                data-testid="trip-header-fiscal-attention-chip"
              >
                {shell.alert.fiscalAttentionChip}
              </Badge>
            ) : null}
            {trip.operationalOutcome === "false_trip" ? (
              <Badge variant="warning" tone="soft" className="text-xs">
                {shell.alert.falseTripChip}
              </Badge>
            ) : null}
            {nextStepLate &&
            resolvedDisplayStatus === TripStatus.IN_PROGRESS &&
            lateDelayLabel ? (
              <Badge
                variant="warning"
                tone="soft"
                className="text-xs"
                data-testid="trip-header-late-delay-chip"
              >
                {lateDelayLabel}
              </Badge>
            ) : null}
          </span>
        ),
        subtitle: (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">
              {trip.tripCode}
            </span>
            {!isLeanTripPortal && trip.client?.legalName ? (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{trip.client.legalName}</span>
              </>
            ) : null}
            {!isLeanTripPortal ? (
              <>
                <span aria-hidden>·</span>
                <Badge
                  variant={
                    trip.cfdiEmissionIntent === "sin_cfdi_efectivo"
                      ? "warning"
                      : "outline"
                  }
                  tone="soft"
                  className="text-xs"
                >
                  {trip.cfdiEmissionIntent === "sin_cfdi_efectivo"
                    ? cfdiEmissionIntentCopy.chip.sinCfdi
                    : cfdiEmissionIntentCopy.chip.conCfdi}
                </Badge>
              </>
            ) : null}
            {trip.settlementException?.status === "in_progress" ? (
              <Badge variant="warning" tone="soft" className="text-xs">
                Solicitud pendiente
              </Badge>
            ) : null}
          </div>
        ),
        actions: (
          <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
            {isClientPortal ? (
              canReadInvoices ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link
                    to={
                      trip.invoicing.invoiceId
                        ? `/invoices/${trip.invoicing.invoiceId}`
                        : "/finance/invoices"
                    }
                    state={
                      trip.invoicing.invoiceId
                        ? { from: tripDetailFromHref }
                        : undefined
                    }
                  >
                    <Receipt className="mr-1.5 h-4 w-4" />
                    {shell.action.viewInvoices}
                  </Link>
                </Button>
              ) : null
            ) : isDriverPortal ? null : (
              <>
                {/* D5: Confirmar / Despachar viven en Qué sigue — no en header. */}
                {trip.cfdiEmissionIntent === "sin_cfdi_efectivo" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid="trip-header-register-cash"
                  >
                    <Link
                      to={buildRegisterCollectionPath({
                        channel: "without_invoice",
                        tripId: trip.id,
                        clientId: trip.clientId,
                        from: tripDetailFromHref,
                      })}
                    >
                      <Wallet className="mr-1.5 h-4 w-4" />
                      {shell.action.registerCash}
                    </Link>
                  </Button>
                ) : (
                  <TripInvoiceActions
                    trip={trip}
                    presentation="headerMenu"
                    onOpenRevenueSplit={() => setRevenueSplitSheetOpen(true)}
                    scopeSheetOpen={invoiceScopeSheetOpen}
                    onScopeSheetOpenChange={setInvoiceScopeSheetOpen}
                  />
                )}
                <TripActions
                  variant="detailMenu"
                  tripId={trip.id}
                  tripCode={trip.tripCode}
                  status={resolvedDisplayStatus}
                  scheduledDeparture={trip.scheduledDeparture}
                  scheduledArrival={trip.scheduledArrival}
                  hasRealArrival={orderedStops.some(
                    (stop) => stop.actualArrival != null,
                  )}
                  hasDeliveredCargo={cargos.some(
                    (cargo) => cargo.status === CargoStatus.DELIVERED,
                  )}
                  onActionComplete={(updated) => {
                    const f = updated?.fiscalActionRequired;
                    if (f) {
                      setPostCancelFiscal({
                        title: shell.alert.postCancelFiscalTitle,
                        lines: buildPostCancelFiscalAlertLines(f),
                      });
                    }
                  }}
                />
              </>
            )}
          </div>
        ),
      }}
      alerts={composedAboveTabs}
      tabs={{
        defaultValue: "overview",
        value: resolvedActiveTab,
        onValueChange: (value) => {
          if (!canFetchExpenses && value === "costs") return;
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
                trip={trip}
                canEditStructural={canEditStructural}
                canEditRouteType={canEditRouteType}
                canReassignFleet={canReassignFleet}
                showClientLink={!isLeanTripPortal}
                showMileage={!isClientPortal}
                isClientPortalView={isClientPortal}
                isDriverPortalView={isDriverPortal}
                canSubstituteInvoice={canSubstituteFiscal}
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
                tripStatus={trip.status}
                orderedStops={routeDetail?.orderedStops ?? orderedStops}
                progress={routeDetail?.progress ?? 0}
                canEditStructural={canEditStructural}
                canReplanPendingStops={canReplanPendingStops}
                cargos={cargos}
                legacyRoute={{
                  originCity: trip.originCity,
                  originState: trip.originState,
                  destinationCity: trip.destinationCity,
                  destinationState: trip.destinationState,
                }}
                onEditingChange={setRouteEditing}
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
                  <span
                    className="ml-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-destructive"
                    role="status"
                    title={shell.tab.trackingIncident}
                    aria-label={shell.tab.trackingIncidentAria}
                  />
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
                  originBranchId={trip.originBranchId}
                  status={resolvedDisplayStatus}
                  cargos={cargos}
                  operationalOutcome={trip.operationalOutcome}
                  cfdiEmissionIntent={trip.cfdiEmissionIntent}
                  pendingSinCfdiRequest={
                    trip.settlementException?.status === "in_progress"
                  }
                  falseTripDeclaredBy={trip.falseTripDeclaredBy}
                  hasActiveSplit={trip.invoicing.hasActiveSplit}
                  requiresFiscalAttention={trip.requiresFiscalAttention}
                  contact={{
                    driverName: trip.driver?.fullName ?? null,
                    driverPhone: trip.driver?.phone ?? null,
                    vehicleLabel: trip.vehicle
                      ? [trip.vehicle.unitNumber, trip.vehicle.licensePlate]
                          .filter(Boolean)
                          .join(" · ")
                      : null,
                  }}
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
                  canAppendCargo={canAppendCargo}
                  cfdiEmissionIntent={trip.cfdiEmissionIntent}
                  hasActivePrimaryInvoice={
                    trip.invoicing.hasActivePrimaryInvoice
                  }
                  invoiceStatus={trip.invoicing.invoiceStatus}
                  vehicleId={trip.vehicleId}
                  onRetry={() => refetchCargos()}
                />
              </Suspense>
            ),
          },
          ...(canFetchExpenses
            ? [
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
                      {expenses.some(
                        (e) => e.approval?.flowStatus === "returned",
                      ) ? (
                        <span
                          className="ml-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-warning"
                          role="status"
                          aria-label={shell.tab.costsReturnedAria}
                        />
                      ) : null}
                    </span>
                  ),
                  content: (
                    <Suspense fallback={<TripDetailTabFallback />}>
                      <TripDetailCostsTabLazy
                        tripId={trip.id}
                        tripStatus={resolvedDisplayStatus}
                        baseRate={trip.costs.baseRate}
                        facturadoVigente={trip.facturadoVigente}
                        cobradoViaje={trip.cobradoViaje}
                        cfdiDocumentIntent={trip.cfdiDocumentIntent}
                        cfdiEmissionIntent={trip.cfdiEmissionIntent}
                        operationalCashCollectedAt={
                          trip.operationalCashCollectedAt
                        }
                        operationalCashAmount={trip.operationalCashAmount}
                        operationalCashNote={trip.operationalCashNote}
                        operationalCash={trip.operationalCash}
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
                        canUpdateReturnedExpenses={canUpdateReturnedExpenses}
                        canDeleteReturnedExpenses={canDeleteReturnedExpenses}
                        tripClosedAt={trip.actualArrival}
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
              ]
            : []),
          ...(!isLeanTripPortal
            ? [
                {
                  value: "billing" as const,
                  label: (
                    <span className="inline-flex items-center gap-1">
                      {trip.cfdiEmissionIntent === "sin_cfdi_efectivo"
                        ? shell.tab.billingSinCfdi
                        : shell.tab.billing}
                      {trip.requiresFiscalAttention ||
                      Boolean(postCancelFiscal) ||
                      trip.settlementException?.status === "in_progress" ? (
                        <span
                          className="ml-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-warning"
                          role="status"
                          aria-label={shell.tab.billingDotAria}
                        />
                      ) : null}
                    </span>
                  ),
                  content: (
                    <Suspense fallback={<TripDetailTabFallback />}>
                      <TripDetailBillingTabLazy
                        trip={trip}
                        canSubstituteInvoice={canSubstituteFiscal}
                        revenueSplit={revenueSplitForInvoiceScopes ?? null}
                        onOpenRevenueSplit={() =>
                          setRevenueSplitSheetOpen(true)
                        }
                      />
                    </Suspense>
                  ),
                },
              ]
            : []),
        ],
      }}
      metadata={{
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
        createdBy: isClientPortal
          ? undefined
          : trip.createdByName?.trim() || trip.createdBy || undefined,
        updatedBy: isClientPortal
          ? undefined
          : trip.updatedByName?.trim() || undefined,
      }}
      />
      {!isLeanTripPortal && trip ? (
        <TripRevenueSplitSheet
          trip={trip}
          open={revenueSplitSheetOpen}
          onOpenChange={setRevenueSplitSheetOpen}
        />
      ) : null}
      {!isLeanTripPortal && trip && linkedDraftInvoices.length >= 2 ? (
        <TripLinkedInvoiceDraftsSheet
          open={linkedDraftsSheetOpen}
          onOpenChange={setLinkedDraftsSheetOpen}
          drafts={linkedDraftInvoices}
          onSelectDraft={handleSelectLinkedDraft}
        />
      ) : null}
      {!isLeanTripPortal && trip ? (
        <TripPhaseOperateSheets
          tripId={trip.id}
          tripCode={trip.tripCode}
          vehicleId={trip.vehicleId}
          driverId={trip.driverId}
          tripStartMileage={trip.mileage.start}
          originBranchId={trip.originBranchId}
          status={resolvedDisplayStatus}
          cargos={cargos}
          cfdiEmissionIntent={trip.cfdiEmissionIntent}
          pendingSinCfdiRequest={
            trip.settlementException?.status === "in_progress"
          }
          requiresFiscalAttention={trip.requiresFiscalAttention}
          open={phaseOperateOpen}
          onOpenChange={setPhaseOperateOpen}
          onFallbackToTracking={goToTrackingTab}
        />
      ) : null}
    </>
  );
}
