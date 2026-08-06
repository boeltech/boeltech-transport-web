/**
 * DashboardPage
 *
 * Panel de control principal — layout configurable por widget.
 */

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";

import { isClientPortalRole, isDriverPortalRole } from "@shared/constants/roles";
import { useAuth } from "@/features/auth";
import { getGreeting } from "@/shared/lib/userHelpers";
import { useDashboard } from "../application/hooks/useDashboard";
import { useTripsByDay } from "../application/hooks/useTripsByDay";
import { useFinancialTrend } from "../application/hooks/useFinancialTrend";
import { useDashboardLayout } from "../application/hooks/useDashboardLayout";
import {
  getCurrentMonthExpenseRange,
  useExpensesByDimension,
  useFinanceSummary,
  useIncomeByMonth,
} from "@features/finance";
import type { FinancialTrendMonths } from "./components";
import { DashboardCustomizePanel } from "./components/DashboardCustomizePanel";
import { getWidgetRegistryEntry } from "./widgets/registry";
import type { DashboardWidgetContext, TripsDayRange } from "./widgets/types";
import { dashboardCopy } from "./copy/dashboardCopy";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isClientPortal = isClientPortalRole(user?.role);
  const isDriverPortal = isDriverPortalRole(user?.role);
  const hideDashboardCustomize = isClientPortal || isDriverPortal;
  const [searchParams] = useSearchParams();
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

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
  const { visibleWidgets, getSpanClass, canReadTrips, showFinance } = layoutApi;

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
  const { data: incomeByMonth, isLoading: incomeLoading } = useIncomeByMonth(
    { months: 12 },
    { enabled: showFinance },
  );
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

  const collectedTrendData = useMemo(
    () => incomeByMonth?.collected.map((value) => ({ value })) ?? [],
    [incomeByMonth],
  );

  const financeLoading = financeSummaryLoading || incomeLoading;

  const widgetCtx: DashboardWidgetContext = useMemo(
    () => ({
      data,
      isLoading,
      navigate,
      tripsByDay,
      tripsByDayLoading,
      tripsDays,
      setTripsDays,
      showFinance,
      financeLoading,
      collectedTrendData,
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
      navigate,
      tripsByDay,
      tripsByDayLoading,
      tripsDays,
      showFinance,
      financeLoading,
      collectedTrendData,
      financeSummary,
      vehicleExpenseRanking,
      vehicleExpenseRankingLoading,
      financialTrend,
      financialTrendLoading,
      financialTrendMonths,
      compareBranchIds,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting(user)}</h1>
          <p className="text-sm text-muted-foreground">
            {isClientPortal
              ? dashboardCopy.page.subtitleClient
              : isDriverPortal
                ? dashboardCopy.page.subtitleDriver
                : dashboardCopy.page.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReadTrips && !hideDashboardCustomize ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomizeOpen(true)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {dashboardCopy.customize.personalizeButton}
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {dashboardCopy.page.refresh}
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <AlertTitle>{dashboardCopy.page.error.title}</AlertTitle>
              <AlertDescription className="sr-only">
                {dashboardCopy.page.error.title}
              </AlertDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {dashboardCopy.page.error.retry}
            </Button>
          </div>
        </Alert>
      )}

      {canReadTrips ? (
        <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          {visibleWidgets.map((pref) => {
            const entry = getWidgetRegistryEntry(pref.id);
            if (!entry) return null;
            return (
              <div
                key={pref.id}
                className={getSpanClass(pref.id)}
              >
                {entry.render(widgetCtx)}
              </div>
            );
          })}
        </div>
      ) : null}

      <DashboardCustomizePanel
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        layoutApi={layoutApi}
      />
    </div>
  );
}

export default DashboardPage;
