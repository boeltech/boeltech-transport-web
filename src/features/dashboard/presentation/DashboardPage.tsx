/**
 * DashboardPage
 *
 * Panel de control principal — banda matutina (F1) + cluster Aurora (F-layout)
 * + layout configurable. Pulido Conform: ranking Operate D1, ATF D3, errores H3.
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
} from "@shared/constants/roles";
import { useAuth } from "@/features/auth";
import { usePermissions } from "@shared/permissions";
import { useApprovalsPendingCountsByType } from "@features/approvals/application";
import { getGreeting } from "@/shared/lib/userHelpers";
import { useIncomingFrom } from "@shared/utils/listQueueFrom";
import { resolveDashboardOutgoingFrom } from "@shared/utils/reportsWayfinding";
import { getTodayString } from "@shared/utils/dateUtils";
import { formatDashboardTodayLabel } from "./utils/dashboardChartHelpers";
import { resolveDashboardJobAction } from "./utils/resolveDashboardJobAction";
import { useDashboard } from "../application/hooks/useDashboard";
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
import { DashboardCustomizePanel } from "./components/DashboardCustomizePanel";
import { DashboardMorningBrief } from "./components/DashboardMorningBrief";
import { DashboardOrientationAlert } from "./components/DashboardOrientationAlert";
import {
  DASHBOARD_ALERTS_WIDGET_DOM_ID,
  shouldShowMorningBrief,
} from "../domain/morningBrief";
import { getWidgetRegistryEntry } from "./widgets/registry";
import type { DashboardWidgetContext, TripsDayRange } from "./widgets/types";
import { dashboardCopy } from "./copy/dashboardCopy";

import { Button } from "@/shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { HubPageShell } from "@shared/ui/page-shells";
import { ReportsReturnLink } from "@shared/ui/reports-return/ReportsReturnLink";

function focusAlertsPanel() {
  const el = document.getElementById(DASHBOARD_ALERTS_WIDGET_DOM_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.focus({ preventScroll: true });
}

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

  const showMorningBrief = shouldShowMorningBrief({
    role: user?.role,
    canReadTrips,
    showFinance,
  });

  // «Por autorizar» (cola Me toca): sin finance_approvals.read no monta fila ni dispara el hook.
  const { hasPermission } = usePermissions();
  const canReadApprovals = hasPermission("finance_approvals", "read");
  const showPendingApprovalsStat = showMorningBrief && canReadApprovals;
  const { data: pendingApprovalCounts, isLoading: pendingApprovalsLoading } =
    useApprovalsPendingCountsByType({
      queue: "mine",
      enabled: showPendingApprovalsStat,
    });

  /** Aurora chrome: cluster → unidades gasto → chart (orden fijo del wireframe). */
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
      // H3: el error de página es dueño del retry — widgets no duplican unavailable.
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
      isError,
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
    isPortal,
    showPendingApprovals: showPendingApprovalsStat,
    pendingApprovalsTotal: pendingApprovalCounts?.total,
    pendingApprovalsCounts: pendingApprovalCounts,
    alertCount: data?.alerts?.length ?? 0,
    todayOpsDay: getTodayString(),
    onFocusAlerts: focusAlertsPanel,
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
    ...(canReadTrips && !hideDashboardCustomize
      ? [
          {
            id: "customize",
            label: customizeLabel,
            onClick: () => setCustomizeOpen(true),
            variant: "outline" as const,
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

  return (
    <>
      <ReportsReturnLink />
      <HubPageShell
        title={
          showMorningBrief
            ? dashboardCopy.page.titleShort
            : getGreeting(user)
        }
        description={
          showMorningBrief ? undefined : formatDashboardTodayLabel()
        }
        primaryActions={primaryActions}
        secondaryActions={secondaryActions}
      >
        {!activationGuideVisible ? (
          <DashboardOrientationAlert
            role={user?.role}
            canReadTrips={canReadTrips}
          />
        ) : null}

        <DashboardActivationChecklist
          onGuideVisibleChange={setActivationGuideVisible}
        />

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
            {showMorningBrief ? (
              <div className="h-full min-h-0 min-w-0 lg:col-span-4">
                <DashboardMorningBrief
                  user={user}
                  pendingApprovals={pendingApprovalCounts?.total}
                  pendingApprovalsCounts={pendingApprovalCounts}
                  showPendingApprovalsStat={showPendingApprovalsStat}
                  isPendingApprovalsLoading={pendingApprovalsLoading}
                  collectedYesterday={data?.stats.collectedYesterday}
                  showCollectedStat={showFinance}
                  alertCount={data?.alerts?.length ?? 0}
                  tripsToday={data?.tripsToday}
                  isLoading={isLoading}
                  navigate={navigate}
                  fromHref={fromHref}
                />
              </div>
            ) : null}

            {auroraClusterPref || pinnedExpenseRankingPref ? (
              <div
                className={`flex h-full min-h-0 min-w-0 flex-col gap-6 ${
                  showMorningBrief ? "lg:col-span-8" : "lg:col-span-12"
                }`}
              >
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
              const isAlerts = pref.id === "alerts";
              return (
                <div
                  key={pref.id}
                  id={isAlerts ? DASHBOARD_ALERTS_WIDGET_DOM_ID : undefined}
                  tabIndex={isAlerts ? -1 : undefined}
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
