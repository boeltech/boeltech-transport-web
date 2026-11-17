/**
 * DashboardPage — F1 encabezado + Lo que te toca; F2 Viajes de hoy + Disponibles ahora.
 * Widgets legacy / Personalizar completo → F3.
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
import { resolveDashboardOutgoingFrom } from "@shared/utils/reportsWayfinding";
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
import { DashboardCustomizePanel } from "./components/DashboardCustomizePanel";
import { DashboardFleetAvailabilityZone } from "./components/DashboardFleetAvailabilityZone";
import { DashboardOpsDayZone } from "./components/DashboardOpsDayZone";
import { getWidgetRegistryEntry } from "./widgets/registry";
import type { DashboardWidgetContext, TripsDayRange } from "./widgets/types";
import { dashboardCopy } from "./copy/dashboardCopy";
import {
  buildDayLine,
  formatAttentionEyebrow,
} from "../domain/attentionQueue";

import { Button } from "@/shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { HubPageShell } from "@shared/ui/page-shells";
import { ReportsReturnLink } from "@shared/ui/reports-return/ReportsReturnLink";

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fromHref = resolveDashboardOutgoingFrom(useIncomingFrom());
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
  } = layoutApi;
  const hiddenWidgetsCount = Math.max(
    0,
    customizableWidgets.length - visibleWidgets.length,
  );

  const { hasPermission } = usePermissions();
  const canCreateTrip = hasPermission("trips", "create");

  const { rows: attentionRows, snapshot: attention, isLoading: attentionLoading } =
    useDashboardAttention({ showFinance });

  const auroraClusterPref = visibleWidgets.find(
    (pref) => pref.id === "metric_trends",
  );
  const pinnedExpenseRankingPref = auroraClusterPref
    ? visibleWidgets.find((pref) => pref.id === "vehicle_expense_ranking")
    : undefined;
  const pinnedChartPref = auroraClusterPref
    ? visibleWidgets.find((pref) => pref.id === "financial_comparison")
    : undefined;
  const pinnedChromeIds = new Set(
    [
      auroraClusterPref?.id,
      pinnedExpenseRankingPref?.id,
      pinnedChartPref?.id,
    ].filter((id): id is NonNullable<typeof id> => id != null),
  );
  const gridWidgets = visibleWidgets.filter(
    (pref) => !pinnedChromeIds.has(pref.id),
  );

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [tripsDays, setTripsDays] = useState<TripsDayRange>(30);
  const [financialTrendMonths, setFinancialTrendMonths] =
    useState<FinancialTrendMonths>(12);
  const currentMonthExpenseRange = useMemo(
    () => getCurrentMonthExpenseRange(),
    [],
  );

  const { data: tripsByDay, isLoading: tripsByDayLoading } = useTripsByDay(
    tripsDays,
    { enabled: canReadTrips },
  );
  const { data: financialTrend, isLoading: financialTrendLoading } =
    useFinancialTrend(financialTrendMonths, { enabled: showFinance });

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
    { enabled: showFinance },
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
  const firstName = user?.firstName?.trim() || null;
  const greetingTitle =
    isStaff && activationGuideVisible && firstName
      ? dashboardCopy.attention.helloGreeting(firstName)
      : isStaff
        ? getGreeting(user)
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

  // Portales: keep OrientationAlert-style bridges via orientation prop (sin ATF alert).
  const portalOrientation = isClientPortal
    ? {
        text: dashboardCopy.page.subtitleClient,
        link: {
          label: dashboardCopy.page.tripsBridgeClientLink,
          href: "/trips",
        },
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
            {/* Checklist siempre montado (dismiss/localStorage); si visible, ocupa la zona. */}
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
                  />
                </div>
                {showOpsDayZones ? (
                  <div className="min-w-0 lg:col-span-4">
                    <DashboardFleetAvailabilityZone />
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {showOpsDayZones ? <DashboardOpsDayZone role={user?.role} /> : null}

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

        {canReadTrips ? (
          <div className="grid min-w-0 gap-6 lg:grid-cols-12 lg:items-stretch">
            {auroraClusterPref || pinnedExpenseRankingPref ? (
              <div className="flex h-full min-h-0 min-w-0 flex-col gap-6 lg:col-span-12">
                {auroraClusterPref
                  ? getWidgetRegistryEntry("metric_trends")?.render(widgetCtx)
                  : null}
                {pinnedExpenseRankingPref
                  ? getWidgetRegistryEntry("vehicle_expense_ranking")?.render(
                      widgetCtx,
                    )
                  : null}
              </div>
            ) : null}

            {pinnedChartPref ? (
              <div className="h-full min-h-0 min-w-0 lg:col-span-12">
                {getWidgetRegistryEntry("financial_comparison")?.render(
                  widgetCtx,
                )}
              </div>
            ) : null}

            {gridWidgets.map((pref) => {
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
