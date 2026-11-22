/**
 * DashboardPage — F1–F3: encabezado, Lo que te toca, Viajes/Disponibles,
 * K10, Cobrado esta semana, Personalizar v2, extras debajo.
 */

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";

import {
  isClientPortalRole,
  isDriverPortalRole,
  ROLES,
} from "@shared/constants/roles";
import { useAuth } from "@/features/auth";
import { usePermissions } from "@shared/permissions";
import { getGreeting } from "@/shared/lib/userHelpers";
import { useIncomingFrom } from "@shared/utils/listQueueFrom";
import {
  buildDashboardOutgoingNavState,
  resolveDashboardOutgoingFrom,
} from "@shared/utils/reportsWayfinding";
import { resolveDashboardJobAction } from "./utils/resolveDashboardJobAction";
import { useDashboard } from "../application/hooks/useDashboard";
import { useDashboardAttention } from "../application/hooks/useDashboardAttention";
import { useTripsByDay } from "../application/hooks/useTripsByDay";
import { useFinancialTrend } from "../application/hooks/useFinancialTrend";
import { useDashboardLayout } from "../application/hooks/useDashboardLayout";
import {
  getCurrentMonthExpenseRange,
  useExpensesByDimension,
  useFinanceSummary,
} from "@features/finance";
import type { FinancialTrendMonths } from "./components";
import { DashboardActivationChecklist } from "./components/DashboardActivationChecklist";
import { DashboardAttentionZone } from "./components/DashboardAttentionZone";
import { DashboardCollectionsWeekZone } from "./components/DashboardCollectionsWeekZone";
import { DashboardCustomizePanel } from "./components/DashboardCustomizePanel";
import { DashboardFleetAvailabilityZone } from "./components/DashboardFleetAvailabilityZone";
import { DashboardOpsDayZone } from "./components/DashboardOpsDayZone";
import { getWidgetRegistryEntry, getWidgetTitle } from "./widgets/registry";
import type { DashboardWidgetContext, TripsDayRange } from "./widgets/types";
import { dashboardCopy } from "./copy/dashboardCopy";
import {
  buildDayLine,
  formatAttentionEyebrow,
} from "../domain/attentionQueue";
import type { WidgetId } from "../domain/layout";

import { Button } from "@/shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { HubPageShell } from "@shared/ui/page-shells";
import { ReportsReturnLink } from "@shared/ui/reports-return/ReportsReturnLink";

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fromHref = resolveDashboardOutgoingFrom(useIncomingFrom());
  const outgoingNavState = buildDashboardOutgoingNavState(fromHref);
  const isClientPortal = isClientPortalRole(user?.role);
  const isDriverPortal = isDriverPortalRole(user?.role);
  const isPortal = isClientPortal || isDriverPortal;
  const hideDashboardCustomize = isPortal;
  const [searchParams] = useSearchParams();
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();
  const [activationGuideVisible, setActivationGuideVisible] = useState(false);

  const compareBranchIds = useMemo(() => {
    const raw = searchParams.get("compareBranches");
    if (!raw?.trim()) return undefined;
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 3);
  }, [searchParams]);

  const layoutApi = useDashboardLayout({ persistMode: "user" });
  const {
    visibleWidgets,
    customizableWidgets,
    getSpanClass,
    canReadTrips,
    showFinance,
    setVisible,
  } = layoutApi;
  const offExtraWidgets = customizableWidgets.filter((w) => !w.visible);
  const hiddenWidgetsCount = offExtraWidgets.length;

  const { hasPermission } = usePermissions();
  const canCreateTrip = hasPermission("trips", "create");

  const { rows: attentionRows, snapshot: attention, isLoading: attentionLoading } =
    useDashboardAttention({ showFinance });

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [tripsDays, setTripsDays] = useState<TripsDayRange>(30);
  const [financialTrendMonths, setFinancialTrendMonths] =
    useState<FinancialTrendMonths>(12);
  const currentMonthExpenseRange = useMemo(
    () => getCurrentMonthExpenseRange(),
    [],
  );

  const extrasNeedTripsByDay = visibleWidgets.some((w) => w.id === "trips_by_day");

  const { data: tripsByDay, isLoading: tripsByDayLoading } = useTripsByDay(
    tripsDays,
    { enabled: canReadTrips && extrasNeedTripsByDay },
  );
  const { data: financialTrend, isLoading: financialTrendLoading } =
    useFinancialTrend(financialTrendMonths, {
      /* K10 scorecard (barras + comparación) + extras Análisis */
      enabled: showFinance,
    });

  const { data: financeSummary, isLoading: financeSummaryLoading } =
    useFinanceSummary({
      enabled: showFinance,
    });
  const {
    data: vehicleExpenseRanking,
    isLoading: vehicleExpenseRankingLoading,
  } = useExpensesByDimension(
    {
      dimension: "vehicle",
      ...currentMonthExpenseRange,
      sortBy: "total",
      sortOrder: "desc",
    },
    {
      enabled:
        showFinance &&
        visibleWidgets.some((w) => w.id === "vehicle_expense_ranking"),
    },
  );

  const financeLoading = financeSummaryLoading;

  const widgetCtx: DashboardWidgetContext = useMemo(
    () => ({
      data,
      isLoading,
      isError: false,
      onRetry: () => {
        void refetch();
      },
      navigate,
      fromHref,
      tripsByDay,
      tripsByDayLoading,
      tripsDays,
      setTripsDays,
      showFinance,
      financeLoading,
      financeSummary,
      vehicleExpenseRanking,
      vehicleExpenseRankingLoading,
      financialTrend,
      financialTrendLoading,
      financialTrendMonths,
      setFinancialTrendMonths,
      compareBranchIds,
    }),
    [
      data,
      isLoading,
      refetch,
      navigate,
      fromHref,
      tripsByDay,
      tripsByDayLoading,
      tripsDays,
      showFinance,
      financeLoading,
      financeSummary,
      vehicleExpenseRanking,
      vehicleExpenseRankingLoading,
      financialTrend,
      financialTrendLoading,
      financialTrendMonths,
      compareBranchIds,
    ],
  );

  const customizeLabel =
    hiddenWidgetsCount > 0
      ? `${dashboardCopy.customize.personalizeButton} · ${dashboardCopy.customize.hiddenWidgetsCount(hiddenWidgetsCount)}`
      : dashboardCopy.customize.personalizeButton;

  const jobAction = resolveDashboardJobAction({
    role: user?.role,
    canReadTrips,
    canCreateTrip,
    isPortal,
    firstPending: attention.firstPending,
  });

  const primaryActions = jobAction
    ? [
        {
          id: jobAction.id,
          label: jobAction.label,
          href: jobAction.href,
          state: jobAction.href ? outgoingNavState : undefined,
          onClick: jobAction.onClick,
          variant: "default" as const,
        },
      ]
    : undefined;

  const secondaryActions = [
    ...(!hideDashboardCustomize
      ? [
          {
            id: "customize",
            label: customizeLabel,
            onClick: () => setCustomizeOpen(true),
            variant: "ghost" as const,
            icon: <SlidersHorizontal className="mr-2 h-4 w-4" />,
          },
        ]
      : []),
    {
      id: "refresh",
      label: dashboardCopy.page.refresh,
      onClick: () => {
        void refetch();
      },
      variant: "outline" as const,
      icon: isFetching ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      ),
    },
  ];

  const isStaff = !isPortal;
  /** I4/I5: ops zones — trips.read, no portal, no contador (PRD). */
  const showOpsDayZones =
    isStaff && canReadTrips && user?.role !== ROLES.ACCOUNTANT;
  /** K10 zona fija cuando showFinance (gerente/admin/contador). */
  const showK10 = isStaff && showFinance && canReadTrips;
  /** Cobrado esta semana — solo contador. */
  const showCollectionsWeek =
    isStaff && showFinance && user?.role === ROLES.ACCOUNTANT;

  const firstName = user?.firstName?.trim() || null;
  const greetingTitle =
    isStaff && activationGuideVisible && firstName
      ? dashboardCopy.attention.helloGreeting(firstName)
      : getGreeting(user);

  const dayLine = isStaff
    ? buildDayLine({
        pendingCount: attention.pendingCount,
        topDetail: attention.topDetail,
        allClear:
          attention.pendingCount === 0
            ? user?.role === ROLES.ACCOUNTANT
              ? {
                  mode: "fiscal",
                  fiscalReady: attention.fiscalReady,
                }
              : canReadTrips
                ? {
                    mode: "ops",
                    tripsToday: attention.opsDay?.tripsToday,
                    inProgress: attention.opsDay?.inProgress,
                  }
                : { mode: "generic" }
            : undefined,
      })
    : undefined;

  // Portales: bridges vía orientation (sin OrientationAlert ATF).
  const portalOrientation = isClientPortal
    ? {
        text: dashboardCopy.page.subtitleClient,
        link: {
          label: dashboardCopy.page.tripsBridgeClientLink,
          href: "/trips",
        },
        // H-U11-N02: segundo puente a Mis facturas (HubOrientation.additionalLinks).
        additionalLinks: [
          {
            label: dashboardCopy.page.invoicesBridgeClientLink,
            href: "/finance/invoices",
          },
        ],
      }
    : isDriverPortal
      ? {
          text: dashboardCopy.page.subtitleDriver,
          link: {
            label: dashboardCopy.page.tripsBridgeDriverLink,
            href: "/trips",
          },
        }
      : undefined;

  function enableExtra(id: WidgetId) {
    setVisible(id, true);
  }

  return (
    <>
      <ReportsReturnLink />
      <HubPageShell
        eyebrow={isStaff ? formatAttentionEyebrow() : undefined}
        title={greetingTitle}
        description={isStaff ? dayLine : undefined}
        orientation={portalOrientation}
        primaryActions={isStaff ? primaryActions : undefined}
        secondaryActions={isStaff ? secondaryActions : undefined}
      >
        {isStaff ? (
          <>
            <section
              className={
                activationGuideVisible
                  ? "flex min-w-0 flex-col gap-2"
                  : undefined
              }
              aria-labelledby={
                activationGuideVisible ? "attention-zone-title" : undefined
              }
            >
              {activationGuideVisible ? (
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <h2
                    id="attention-zone-title"
                    className="text-base font-semibold leading-6 text-foreground"
                  >
                    {dashboardCopy.attention.title}
                  </h2>
                </div>
              ) : null}
              <DashboardActivationChecklist
                onGuideVisibleChange={setActivationGuideVisible}
              />
            </section>
            {!activationGuideVisible ? (
              <div className="grid min-w-0 gap-6 lg:grid-cols-12 lg:items-start">
                <div
                  className={
                    showOpsDayZones
                      ? "min-w-0 lg:col-span-8"
                      : "min-w-0 lg:col-span-12"
                  }
                >
                  <DashboardAttentionZone
                    role={user?.role}
                    rows={attentionRows}
                    isLoading={attentionLoading}
                    navState={outgoingNavState}
                  />
                </div>
                {showOpsDayZones ? (
                  <div className="min-w-0 lg:col-span-4">
                    <DashboardFleetAvailabilityZone navState={outgoingNavState} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {showOpsDayZones ? (
          <DashboardOpsDayZone role={user?.role} navState={outgoingNavState} />
        ) : null}

        {showK10 ? (
          <div className="min-w-0">
            {getWidgetRegistryEntry("metric_trends")?.render(widgetCtx)}
          </div>
        ) : null}

        {showCollectionsWeek ? (
          <DashboardCollectionsWeekZone navState={outgoingNavState} />
        ) : null}

        {isError ? (
          <DetailAlertCard
            severity="critical"
            icon={<AlertCircle className="h-4 w-4" />}
            title={dashboardCopy.page.error.title}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetch();
                }}
              >
                {dashboardCopy.page.error.retry}
              </Button>
            }
          />
        ) : null}

        {canReadTrips && visibleWidgets.length > 0 ? (
          <div className="grid min-w-0 gap-6 lg:grid-cols-12 lg:items-stretch">
            {visibleWidgets.map((pref) => {
              const entry = getWidgetRegistryEntry(pref.id);
              if (!entry) return null;
              return (
                <div
                  key={pref.id}
                  className={`${getSpanClass(pref.id)} h-full min-h-0 min-w-0 outline-none`}
                >
                  {entry.render(widgetCtx)}
                </div>
              );
            })}
          </div>
        ) : null}

        {!hideDashboardCustomize && offExtraWidgets.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <span>{dashboardCopy.customize.footerPrompt}</span>
            {offExtraWidgets.map((pref) => (
              <button
                key={pref.id}
                type="button"
                className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[12px] font-medium text-foreground hover:bg-muted"
                onClick={() => enableExtra(pref.id)}
              >
                {getWidgetTitle(pref.id)}
              </button>
            ))}
          </div>
        ) : null}
      </HubPageShell>

      <DashboardCustomizePanel
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        layoutApi={layoutApi}
      />
    </>
  );
}

export default DashboardPage;
