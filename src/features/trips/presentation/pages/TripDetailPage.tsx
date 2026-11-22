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
import type { DetailPageShellHeader } from "@shared/ui/page-shells";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  MODULE_LIST_PATH_LABELS,
  resolveDetailCrumbs,
} from "@shared/utils/masterWayfinding";
import { useIncomingWayfinding } from "@shared/utils/listQueueFrom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  AlertCircle,
  Receipt,
  Wallet,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";

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
import { canUpsertTripRevenueSplit } from "../components/trip-fiscal/tripFiscalHelpers";
import { TripJourneyStrip } from "../components/trip-shell/TripJourneyStrip";
import { TripShellAlertsStack } from "../components/trip-shell/TripShellAlertsStack";
import { TripPhaseOperateSheets } from "../components/trip-shell/TripPhaseOperateSheets";
import { RegisterTrackingNoteSheet } from "../components/trip-tracking/RegisterTrackingNoteSheet";
import { PlanReturnSheet } from "../components/trip-tracking/PlanReturnSheet";
import { tripHasInferredReturnStop } from "../components/trip-tracking/planReturnHelpers";
import { buildRegisterCollectionPath } from "@features/finance/application";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import { buildTripJourneyStripModel } from "../helpers/buildTripJourneyStripModel";
import {
  formatTripLateDelayChip,
  resolveTripLateDelayMs,
} from "../helpers/formatTripLateDelayChip";
import {
  useTripListRouteCitiesOnly,
  useTripListRouteLabel,
} from "../hooks/useTripListRouteLabel";
import { canDeclareFalseTrip } from "../components/trip-tracking/canDeclareFalseTrip";
import {
  resolveTrackingPrimaryAction,
  resolveTrackingPrimaryCtaLabel,
} from "../components/trip-tracking/trackingNextAction";
import {
  resolveTripAccessDeniedCopy,
  resolveTripBackHref,
  resolveTripWayfindingBackLabel,
  tripInvoiceNavState,
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
import { isFleetFiscalAttentionMutation } from "../helpers/fiscalAttentionMutationCopy";
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

const TRIPS_LIST_PATH = "/trips";
const TRIPS_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[TRIPS_LIST_PATH] ?? "Viajes";

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const incoming = useIncomingWayfinding();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = parseTripDetailTab(searchParams.get("tab"));
  /** Origen real (bandeja de aprobaciones, factura…) o el listado de viajes. */
  const backHref = resolveTripBackHref(
    incoming?.from ?? (location.state?.from as string | undefined),
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

  const tripNavHeader = (
    title: DetailPageShellHeader["title"],
    currentLabel: string,
    extras: {
      subtitle?: DetailPageShellHeader["subtitle"];
      statusBadge?: DetailPageShellHeader["statusBadge"];
      actions?: DetailPageShellHeader["actions"];
    } = {},
  ): DetailPageShellHeader => {
    if (isLeanTripPortal) {
      return {
        variant: "portal",
        backHref,
        backLabel,
        title,
        ...extras,
      };
    }
    return {
      crumbs: resolveDetailCrumbs({
        from: incoming?.from,
        fromLabel: incoming?.fromLabel,
        module: { listPath: TRIPS_LIST_PATH, label: TRIPS_MODULE_LABEL },
        current: { label: currentLabel, mono: true },
      }),
      title,
      ...extras,
    };
  };
  const canUpdateTrip = hasPermission("trips", "update");
  const canExecuteTrip = hasPermission("trips", "execute");
  const canReadTrip = hasPermission("trips", "read");
  const canReadExpenses = hasPermission("expenses", "read");
  const canCreateExpense = hasPermission("expenses", "create");
  const canUpdateExpense = hasPermission("expenses", "update");
  const canDeleteExpense = hasPermission("expenses", "delete");
  const canApproveTripExpenses = hasPermission("finance_approvals", "update");
  const canReadInvoices = hasPermission("invoices", "read");
  const canCreateInvoices = hasPermission("invoices", "create");
  /** Q-R3 — casilla tarifa del Sheet Planear retorno. */
  const canReadFinance = hasPermission("finance", "read");
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

  /** RP-2: H1 ciudad-only F11 B; tooltip ciudad+estado. */
  const routeSummaryForTitle = useMemo(
    () => ({
      originCity: trip?.originCity ?? "",
      originState: trip?.originState ?? "",
      destinationCity: trip?.destinationCity ?? "",
      destinationState: trip?.destinationState ?? "",
    }),
    [
      trip?.originCity,
      trip?.originState,
      trip?.destinationCity,
      trip?.destinationState,
    ],
  );
  const routeTitleCities = useTripListRouteCitiesOnly(routeSummaryForTitle);
  const routeTitleTooltip = useTripListRouteLabel(routeSummaryForTitle);

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
  /** F3b: abre dialog Cancelar viaje de TripActions desde Qué sigue. */
  const [openCancelSignal, setOpenCancelSignal] = useState(0);
  /** F3d-4: Nota desde Qué sigue (chrome), sin montar el tab Seguimiento. */
  const [chromeNoteSheetOpen, setChromeNoteSheetOpen] = useState(false);
  /** F4b — Sheet Planear retorno (Seguimiento; no deep-link a Ruta). */
  const [planReturnSheetOpen, setPlanReturnSheetOpen] = useState(false);
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

  /** D-HF2/D-HF3: Repartir flete en «Más» (no hermano de Facturar). */
  const revenueSplitMenuConfig = useMemo(() => {
    if (!trip || isLeanTripPortal) return null;
    if (trip.cfdiEmissionIntent === "sin_cfdi_efectivo") return null;
    if (trip.operationalOutcome === "false_trip") return null;
    if (!canReadTrip) return null;

    const hasDraftSplit = revenueSplitForInvoiceScopes?.status === "draft";
    const upsertEligibility = canUpsertTripRevenueSplit(trip);
    const isTripCancelled = trip.status === TripStatus.CANCELLED;
    const canShow =
      trip.invoicing.hasActiveSplit ||
      hasDraftSplit ||
      (!isTripCancelled &&
        (upsertEligibility.allowed || upsertEligibility.blockReason != null));
    if (!canShow) return null;

    const canOperatePatio = canUpdateTrip || canExecuteTrip;
    if (!canOperatePatio && !trip.invoicing.hasActiveSplit) return null;

    const invoiceActionsCopy = tripFiscalCopy.invoiceActions;
    const label = trip.invoicing.hasActiveSplit
      ? invoiceActionsCopy.viewRevenueSplitMenu
      : hasDraftSplit
        ? invoiceActionsCopy.continueRevenueSplit
        : invoiceActionsCopy.openRevenueSplit;
    const disabled =
      !trip.invoicing.hasActiveSplit &&
      !hasDraftSplit &&
      !upsertEligibility.allowed;

    return {
      label,
      disabled,
      disabledTitle: disabled
        ? (upsertEligibility.blockReason ?? undefined)
        : undefined,
    };
  }, [
    trip,
    isLeanTripPortal,
    canReadTrip,
    canUpdateTrip,
    canExecuteTrip,
    revenueSplitForInvoiceScopes?.status,
  ]);

  const revenueSplitMenuItem = revenueSplitMenuConfig
    ? {
        ...revenueSplitMenuConfig,
        onSelect: () => setRevenueSplitSheetOpen(true),
      }
    : null;

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

  const declareFalseTripEligible = useMemo(() => {
    if (!trip) return false;
    return (
      canDeclareFalseTrip({
        tripStatus: displayStatus ?? trip.status,
        stops: orderedStops,
        cargos,
        hasActiveRevenueSplit: trip.invoicing.hasActiveSplit,
        cfdiEmissionIntent: trip.cfdiEmissionIntent,
        operationalOutcome: trip.operationalOutcome,
      }) && !trip.invoicing.hasActiveSplit
    );
  }, [trip, displayStatus, orderedStops, cargos]);

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
      originNoCargoPendingOutcome: trip.originNoCargoPendingOutcome,
      returnReplanRequired: trip.returnReplanRequired,
      canDeclareFalseTrip: declareFalseTripEligible,
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
    declareFalseTripEligible,
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
            borderStyle="full"
            icon={<Receipt className="h-5 w-5" />}
            title={shell.alert.falseTripCancelCfdiTitle}
            action={
              cancelInvoiceId ? (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={`/invoices/${cancelInvoiceId}`}
                    state={tripInvoiceNavState(
                      trip.id,
                      trip.tripCode,
                      tripDetailFromHref,
                    )}
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
            borderStyle="full"
            icon={<Receipt className="h-5 w-5" />}
            title={shell.alert.substitutionCancelPendingTitle}
            action={
              originalInvoiceId ? (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={`/invoices/${originalInvoiceId}`}
                    state={tripInvoiceNavState(
                      trip.id,
                      trip.tripCode,
                      tripDetailFromHref,
                    )}
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
        const fleetMutation = isFleetFiscalAttentionMutation(
          trip.fiscalAttention?.mutationKind,
        );

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
              <Button variant="outline" size="sm" asChild>
                <Link
                  to={`/invoices/${fiscalCta.invoiceId}`}
                  state={tripInvoiceNavState(
                    trip.id,
                    trip.tripCode,
                    tripDetailFromHref,
                  )}
                >
                  {shell.alert.fiscalAttentionOpenInvoiceCta}
                </Link>
              </Button>
            );
          } else if (
            fiscalCta.kind === "split" &&
            fiscalCta.bodyKey === "withInvoices"
          ) {
            const legs = fiscalCta.invoicedLegs;
            if (legs.length === 1) {
              cta = (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={`/invoices/${legs[0].invoiceId}`}
                    state={tripInvoiceNavState(
                      trip.id,
                      trip.tripCode,
                      tripDetailFromHref,
                    )}
                  >
                    {shell.alert.fiscalAttentionOpenInvoiceCta}
                  </Link>
                </Button>
              );
            } else if (legs.length > 1) {
              cta = (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {shell.alert.fiscalAttentionSplitMenuCta}
                      <ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {legs.map((leg) => (
                      <DropdownMenuItem key={leg.invoiceId} asChild>
                        <Link
                          to={`/invoices/${leg.invoiceId}`}
                          state={tripInvoiceNavState(
                            trip.id,
                            trip.tripCode,
                            tripDetailFromHref,
                          )}
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
                  : fleetMutation
                    ? shell.alert.fiscalAttentionBodyFleet
                    : shell.alert.fiscalAttentionBody
              : isPostCancel
                ? shell.alert.postCancelFiscalAttentionNoInvoiceBody
                : shell.alert.fiscalAttentionNoInvoiceBody;
          if (fiscalCta.invoiceId) {
            cta = (
              <Button variant="outline" size="sm" asChild>
                <Link
                  to={`/invoices/${fiscalCta.invoiceId}`}
                  state={tripInvoiceNavState(
                    trip.id,
                    trip.tripCode,
                    tripDetailFromHref,
                  )}
                >
                  {isPostCancel
                    ? shell.alert.postCancelFiscalAttentionCta
                    : shell.alert.fiscalAttentionCta}
                </Link>
              </Button>
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
                : fleetMutation
                  ? shell.alert.fiscalAttentionSplitBodyFleet
                  : shell.alert.fiscalAttentionSplitBody;
          }
          if (fiscalCta.bodyKey === "withInvoices") {
            const legs = fiscalCta.invoicedLegs;
            if (legs.length === 1) {
              cta = (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={`/invoices/${legs[0].invoiceId}`}
                    state={tripInvoiceNavState(
                      trip.id,
                      trip.tripCode,
                      tripDetailFromHref,
                    )}
                  >
                    {isPostCancel
                      ? shell.alert.postCancelFiscalAttentionSplitCta
                      : shell.alert.fiscalAttentionSplitCta}
                  </Link>
                </Button>
              );
            } else if (legs.length > 1) {
              cta = (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {isPostCancel
                        ? shell.alert.postCancelFiscalAttentionSplitMenuCta
                        : shell.alert.fiscalAttentionSplitMenuCta}
                      <ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {legs.map((leg) => (
                      <DropdownMenuItem key={leg.invoiceId} asChild>
                        <Link
                          to={`/invoices/${leg.invoiceId}`}
                          state={tripInvoiceNavState(
                            trip.id,
                            trip.tripCode,
                            tripDetailFromHref,
                          )}
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
            borderStyle="full"
            icon={<Receipt className="h-5 w-5" />}
            title={
              isPostCancel
                ? shell.alert.postCancelFiscalAttentionTitle
                : shell.alert.fiscalAttentionTitle
            }
            action={cta}
          >
            <p>{body}</p>
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
            borderStyle="full"
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
            borderStyle="full"
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
          borderStyle="full"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={shell.alert.openIncidentTitle}
          action={
            <Button
              variant="outline"
              size="sm"
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
          }
        >
          <p>{shell.alert.openIncidentBody}</p>
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
          borderStyle="full"
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
        header={tripNavHeader(shell.title.fallback, shell.title.fallback)}
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
        header={tripNavHeader(shell.title.fallback, shell.title.fallback)}
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
        header={tripNavHeader(shell.title.fallback, shell.title.fallback)}
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
        header={tripNavHeader(shell.title.fallback, shell.title.fallback)}
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
        header={tripNavHeader(shell.title.fallback, shell.title.fallback)}
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
        state: tripInvoiceNavState(
          trip.id,
          trip.tripCode,
          tripDetailFromHref,
        ),
      });
      return;
    }
    if (invoiceScopeDecision.kind === "open_sheet") {
      setInvoiceScopeSheetOpen(true);
    }
  };

  const handleNextStepOpenDraft = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`, {
      state: tripInvoiceNavState(trip.id, trip.tripCode, tripDetailFromHref),
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

  const handleNextStepRegisterNote = () => {
    setChromeNoteSheetOpen(true);
  };

  const handleNextStepDeclareFalseTrip = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", "tracking");
        next.set("intent", "declare_false");
        return next;
      },
      { replace: true },
    );
  };

  const handleNextStepCancelTrip = () => {
    setOpenCancelSignal((n) => n + 1);
  };

  const handlePlanReturn = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", "tracking");
        next.delete("intent");
        return next;
      },
      { replace: true },
    );
    setPlanReturnSheetOpen(true);
  };

  const handlePlanReturnEditInRoute = () => {
    setPlanReturnSheetOpen(false);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", "route");
        next.delete("intent");
        return next;
      },
      { replace: true },
    );
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
        {
          canMutateCargo: canUpdateTrip,
          originNoCargoPendingOutcome: trip?.originNoCargoPendingOutcome,
          returnReplanRequired: trip?.returnReplanRequired,
        },
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
      state: tripInvoiceNavState(trip.id, trip.tripCode, tripDetailFromHref),
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
      onRegisterNote={handleNextStepRegisterNote}
      onDeclareFalseTrip={handleNextStepDeclareFalseTrip}
      onCancelTrip={handleNextStepCancelTrip}
      onPlanReturn={handlePlanReturn}
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
      header={tripNavHeader(
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-full truncate" tabIndex={0}>
                {routeTitleCities}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm text-xs">
              {routeTitleTooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>,
        trip.tripCode,
        {
        statusBadge: (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <TripStatusBadge
              status={resolvedDisplayStatus}
              size="sm"
              showIcon={false}
            />
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
            {trip.operationalOutcome === "false_trip" ? (
              <Badge variant="warning" tone="soft" className="text-xs">
                {shell.alert.falseTripChip}
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
                <Link
                  to={`/clients/${trip.client.id}`}
                  state={{
                    from: tripDetailFromHref,
                    fromLabel: trip.tripCode,
                  }}
                  className="truncate text-primary hover:underline"
                >
                  {trip.client.legalName}
                </Link>
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
            {!isLeanTripPortal &&
            tripHasInferredReturnStop(cargos, orderedStops) ? (
              <>
                <span aria-hidden>·</span>
                <Badge
                  variant="outline"
                  className="text-xs"
                  data-testid="trip-header-with-return-badge"
                >
                  {shell.badge.withReturn}
                </Badge>
              </>
            ) : null}
            {trip.requiresFiscalAttention ? (
              <>
                <span aria-hidden>·</span>
                <Badge
                  variant="warning"
                  tone="soft"
                  className="text-xs"
                  data-testid="trip-header-fiscal-attention-chip"
                >
                  {shell.alert.fiscalAttentionChip}
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
                        ? tripInvoiceNavState(
                            trip.id,
                            trip.tripCode,
                            tripDetailFromHref,
                          )
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
                  openCancelSignal={openCancelSignal}
                  revenueSplitMenuItem={revenueSplitMenuItem}
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
        },
      )}
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
            label: shell.format.routeTab(),
            count: orderedStops.length > 0 ? orderedStops.length : undefined,
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
                returnReplanRequired={trip.returnReplanRequired}
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
            label: shell.tab.tracking,
            signal: hasOpenTrackingIncident
              ? "blocked"
              : resolvedDisplayStatus === TripStatus.IN_PROGRESS
                ? "live"
                : undefined,
            signalLabel: hasOpenTrackingIncident
              ? shell.tab.trackingIncidentAria
              : shell.tab.trackingLive,
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
                  falseTripDeclaredBy={trip.falseTripDeclaredByName}
                  hasActiveSplit={trip.invoicing.hasActiveSplit}
                  requiresFiscalAttention={trip.requiresFiscalAttention}
                  originNoCargoPendingOutcome={
                    trip.originNoCargoPendingOutcome
                  }
                  returnReplanRequired={trip.returnReplanRequired}
                  onPlanReturn={handlePlanReturn}
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
            label: shell.tab.cargo,
            count:
              !isLoadingCargos && cargoCount > 0 ? cargoCount : undefined,
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
                  label: shell.tab.costs,
                  count: pendingExpenses > 0 ? pendingExpenses : undefined,
                  signal: expenses.some(
                    (e) => e.approval?.flowStatus === "returned",
                  )
                    ? ("attention" as const)
                    : undefined,
                  signalLabel: shell.tab.costsReturnedAria,
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
                  label:
                    trip.cfdiEmissionIntent === "sin_cfdi_efectivo"
                      ? shell.tab.billingSinCfdi
                      : shell.tab.billing,
                  signal:
                    trip.requiresFiscalAttention ||
                    Boolean(postCancelFiscal) ||
                    trip.settlementException?.status === "in_progress" ||
                    linkedDraftInvoiceIds.length > 0
                      ? ("attention" as const)
                      : undefined,
                  signalLabel: shell.tab.billingDotAria,
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
          originNoCargoPendingOutcome={trip.originNoCargoPendingOutcome}
          returnReplanRequired={trip.returnReplanRequired}
          open={phaseOperateOpen}
          onOpenChange={setPhaseOperateOpen}
          onFallbackToTracking={goToTrackingTab}
        />
      ) : null}
      {!isLeanTripPortal && trip ? (
        <RegisterTrackingNoteSheet
          tripId={trip.id}
          open={chromeNoteSheetOpen}
          onOpenChange={setChromeNoteSheetOpen}
        />
      ) : null}
      {!isLeanTripPortal && trip ? (
        <PlanReturnSheet
          trip={trip}
          cargos={cargos}
          orderedStops={orderedStops}
          canAdjustRate={canReadFinance && canEditBaseRate}
          vehicleLabel={
            trip.vehicle
              ? [trip.vehicle.unitNumber, trip.vehicle.licensePlate]
                  .filter(Boolean)
                  .join(" · ")
              : null
          }
          open={planReturnSheetOpen}
          onOpenChange={setPlanReturnSheetOpen}
          onEditInRoute={handlePlanReturnEditInRoute}
          onSuccess={() => {
            void refetchTrip();
          }}
        />
      ) : null}
    </>
  );
}
