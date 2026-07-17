import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Loader2 } from "lucide-react";
import { useBranchKpis } from "@features/dashboard/application/hooks/useBranchKpis";
import { useBranchKpisTrend } from "@features/dashboard/application/hooks/useBranchKpisTrend";
import { BranchKpisPeriodSelect } from "@features/dashboard/presentation/components/BranchKpisPeriodSelect";
import { BranchKpisTrendChart } from "@features/dashboard/presentation/components/BranchKpisTrendChart";
import {
  DEFAULT_BRANCH_KPIS_PERIOD,
  type BranchKpisPeriodValue,
  type BranchKpisTrendMonths,
} from "@features/dashboard/domain/types";
import { canAccessFinanceSummaryRoute } from "@shared/permissions";
import { useAuth } from "@/features/auth";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import { branchesCopy } from "../copy/branchesCopy";

const copy = branchesCopy.detail.kpis;

interface BranchOperationalKpiCardProps {
  branchId: string;
}

export function BranchOperationalKpiCard({ branchId }: BranchOperationalKpiCardProps) {
  const { user } = useAuth();
  const showFinance = canAccessFinanceSummaryRoute(user?.role);
  const [period, setPeriod] = useState<BranchKpisPeriodValue>(
    DEFAULT_BRANCH_KPIS_PERIOD,
  );
  const [trendMonths, setTrendMonths] = useState<BranchKpisTrendMonths>(6);

  const { data, isLoading, isError } = useBranchKpis({
    branchIds: [branchId],
    period,
    enabled: Boolean(branchId),
  });

  const {
    data: trendData,
    isLoading: trendLoading,
    isFetching: trendFetching,
  } = useBranchKpisTrend({
    months: trendMonths,
    branchIds: [branchId],
    enabled: Boolean(branchId),
  });

  const row = data?.rows.find((item) => item.branchId === branchId);

  return (
    <div className="md:col-span-2 space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            {copy.title}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <BranchKpisPeriodSelect value={period} onChange={setPeriod} />
            <Button variant="outline" size="sm" asChild>
              <Link
                to={`/dashboard?compareBranches=${encodeURIComponent(branchId)}`}
              >
                {copy.compareCta}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy.loading}
            </div>
          ) : isError || !row ? (
            <p className="text-sm text-muted-foreground">{copy.error}</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {copy.periodLabel(data?.period.label ?? "Mes actual")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow
                  label={copy.metrics.tripsMonth}
                  value={String(row.trips.total)}
                />
                <InfoRow
                  label={copy.metrics.inProgress}
                  value={String(row.trips.inProgress)}
                />
                <InfoRow
                  label={copy.metrics.completed}
                  value={String(row.trips.completed)}
                />
                <InfoRow
                  label={copy.metrics.vehicles}
                  value={String(row.fleet.vehiclesTotal)}
                />
                <InfoRow
                  label={copy.metrics.drivers}
                  value={String(row.drivers.total)}
                />
                {showFinance ? (
                  <InfoRow
                    label={copy.metrics.margin}
                    value={formatMxCurrencyWhole(
                      row.financialMonth?.actualMargin ?? 0,
                    )}
                  />
                ) : null}
              </div>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link
                  to={`/trips?originBranchId=${encodeURIComponent(branchId)}`}
                >
                  {copy.viewTrips}
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <BranchKpisTrendChart
        trend={trendData}
        isLoading={trendLoading || trendFetching}
        months={trendMonths}
        onMonthsChange={setTrendMonths}
        title={copy.trend.title}
        description={copy.trend.description}
        emptyTitle={copy.trend.empty}
        height={200}
        compact
      />
    </div>
  );
}
