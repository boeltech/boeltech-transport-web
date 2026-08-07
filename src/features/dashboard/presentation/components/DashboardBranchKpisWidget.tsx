import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { NavigateFunction } from "react-router-dom";
import { Building2, GitCompareArrows, Info } from "lucide-react";
import { useBranches } from "@features/branches";
import { useBranchKpis } from "../../application/hooks/useBranchKpis";
import { useBranchKpisTrend } from "../../application/hooks/useBranchKpisTrend";
import {
  DEFAULT_BRANCH_KPIS_PERIOD,
  type BranchKpisPeriodValue,
  type BranchKpisRow,
  type BranchKpisTrendMonths,
} from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import { BranchKpisPeriodSelect } from "./BranchKpisPeriodSelect";
import { BranchKpisTrendChart } from "./BranchKpisTrendChart";
import { ChartCard } from "@shared/ui/data-display/ChartCard";
import { BoeltechBarChart } from "@shared/ui/data-display/charts";
import { EmptyState } from "@shared/ui/feedback-states";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import { type ChartSeries } from "@shared/ui/data-display/charts/chartTokens";

const copy = dashboardCopy.branchKpis;
const UNASSIGNED = "unassigned" as const;
type SelectionToken = string | typeof UNASSIGNED;

const COMPARISON_SERIES: ChartSeries[] = [
  { dataKey: "completed", label: copy.chart.completed, token: "chart-1" },
  { dataKey: "vehicles", label: copy.chart.vehicles, token: "chart-2" },
  { dataKey: "margin", label: copy.chart.margin, token: "chart-3" },
];

function rowToken(row: BranchKpisRow): SelectionToken {
  return row.branchId ?? UNASSIGNED;
}

function buildTripsHref(token: SelectionToken): string {
  if (token === UNASSIGNED) {
    return "/trips?originBranchId=unassigned";
  }
  return `/trips?originBranchId=${encodeURIComponent(token)}`;
}

function defaultCompareSelection(
  activeBranches: { id: string }[],
  initialCompareBranchIds?: string[],
): SelectionToken[] {
  if (initialCompareBranchIds?.length) {
    return initialCompareBranchIds.slice(0, 3);
  }
  if (activeBranches.length >= 2) {
    return activeBranches.slice(0, 2).map((b) => b.id);
  }
  if (activeBranches.length === 1) {
    return [activeBranches[0].id];
  }
  return [];
}

interface DashboardBranchKpisWidgetProps {
  showFinance: boolean;
  navigate: NavigateFunction;
  initialCompareBranchIds?: string[];
}

export function DashboardBranchKpisWidget({
  showFinance,
  navigate,
  initialCompareBranchIds,
}: DashboardBranchKpisWidgetProps) {
  const { data: branchesData, isLoading: branchesLoading } = useBranches({
    filters: { isActive: true },
    limit: 100,
  });

  const activeBranches = useMemo(
    () => branchesData?.data ?? [],
    [branchesData?.data],
  );

  const [selectedOverride, setSelectedOverride] = useState<
    SelectionToken[] | null
  >(null);
  const [period, setPeriod] = useState<BranchKpisPeriodValue>(
    DEFAULT_BRANCH_KPIS_PERIOD,
  );
  const [trendMonths, setTrendMonths] = useState<BranchKpisTrendMonths>(6);

  const defaultSelected = useMemo(
    () => defaultCompareSelection(activeBranches, initialCompareBranchIds),
    [activeBranches, initialCompareBranchIds],
  );

  const selected = selectedOverride ?? defaultSelected;
  const initialized = !branchesLoading;

  const branchIds = selected.filter((id): id is string => id !== UNASSIGNED);
  const includeUnassigned = selected.includes(UNASSIGNED);

  const { data, isLoading, isFetching } = useBranchKpis({
    branchIds: selected.length > 0 ? branchIds : undefined,
    includeUnassigned: selected.length > 0 ? includeUnassigned : undefined,
    period,
    enabled: initialized,
  });

  const {
    data: trendData,
    isLoading: trendLoading,
    isFetching: trendFetching,
  } = useBranchKpisTrend({
    months: trendMonths,
    branchIds: selected.length > 0 ? branchIds : undefined,
    includeUnassigned: selected.length > 0 ? includeUnassigned : undefined,
    enabled: initialized && selected.length > 0,
  });

  const rows = data?.rows;
  const displayRows = useMemo(() => {
    if (!rows?.length) return [];
    if (selected.length === 0) return rows;
    const selectedSet = new Set(selected);
    return rows.filter((row) => selectedSet.has(rowToken(row)));
  }, [rows, selected]);

  const chartData = useMemo(
    () =>
      displayRows.map((row) => ({
        label: row.branchName,
        completed: row.trips.completed,
        vehicles: row.fleet.vehiclesTotal,
        margin: showFinance ? (row.financialMonth?.actualMargin ?? 0) : 0,
      })),
    [displayRows, showFinance],
  );

  const chartSeries = useMemo(
    () =>
      showFinance
        ? COMPARISON_SERIES
        : COMPARISON_SERIES.filter((s) => s.dataKey !== "margin"),
    [showFinance],
  );

  const toggleSelection = (token: SelectionToken, checked: boolean) => {
    setSelectedOverride((prev) => {
      const current = prev ?? defaultSelected;
      if (checked) {
        if (current.includes(token) || current.length >= 3) return current;
        return [...current, token];
      }
      return current.filter((id) => id !== token);
    });
  };

  if (!branchesLoading && activeBranches.length === 0 && selected.length === 0) {
    return (
      <ChartCard
        title={copy.title}
        description={copy.description}
        isLoading={false}
      >
        <EmptyState
          icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
          title={copy.noBranches.title}
          description={copy.noBranches.description}
          cta={{
            label: copy.noBranches.cta,
            onClick: () => navigate("/branches"),
            variant: "outline",
          }}
        />
      </ChartCard>
    );
  }

  return (
    <div className="space-y-4">
    <ChartCard
      title={copy.title}
      description={copy.description}
      isLoading={isLoading || isFetching || branchesLoading}
      footer={
        data?.period?.label
          ? copy.periodLabel(data.period.label)
          : undefined
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.compareLabel}
            </p>
            <div className="flex flex-wrap gap-3">
              {activeBranches.map((branch) => (
                <label
                  key={branch.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={selected.includes(branch.id)}
                    disabled={
                      !selected.includes(branch.id) && selected.length >= 3
                    }
                    onCheckedChange={(checked) =>
                      toggleSelection(branch.id, checked === true)
                    }
                  />
                  <span>{branch.name}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selected.includes(UNASSIGNED)}
                  disabled={
                    !selected.includes(UNASSIGNED) && selected.length >= 3
                  }
                  onCheckedChange={(checked) =>
                    toggleSelection(UNASSIGNED, checked === true)
                  }
                />
                <span className="inline-flex items-center gap-1">
                  {copy.unassignedOption}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {copy.unassignedTooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">{copy.maxBranchesHint}</p>
          </div>
          <BranchKpisPeriodSelect value={period} onChange={setPeriod} />
        </div>

        {activeBranches.length === 1 ? (
          <p className="text-sm text-muted-foreground">{copy.singleBranchHint}</p>
        ) : null}

        {isLoading || isFetching ? (
          <p className="text-sm text-muted-foreground">Cargando KPIs…</p>
        ) : displayRows.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<GitCompareArrows className="h-8 w-8 text-muted-foreground" />}
            title={copy.chart.empty}
            description={copy.maxBranchesHint}
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.table.branch}</TableHead>
                    <TableHead className="text-right">{copy.table.tripsMonth}</TableHead>
                    <TableHead className="text-right">{copy.table.inProgress}</TableHead>
                    <TableHead className="text-right">{copy.table.completed}</TableHead>
                    <TableHead className="text-right">{copy.table.vehicles}</TableHead>
                    <TableHead className="text-right">{copy.table.drivers}</TableHead>
                    {showFinance ? (
                      <TableHead className="text-right">{copy.table.margin}</TableHead>
                    ) : null}
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((row) => (
                    <TableRow key={rowToken(row)}>
                      <TableCell className="font-medium">
                        {row.branchName}
                        {row.branchCode ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {row.branchCode}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.trips.total}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.trips.inProgress}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.trips.completed}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.fleet.vehiclesTotal}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.drivers.total}
                      </TableCell>
                      {showFinance ? (
                        <TableCell className="text-right tabular-nums">
                          {formatMxCurrencyWhole(
                            row.financialMonth?.actualMargin ?? 0,
                          )}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-right">
                        <Button variant="link" size="sm" asChild>
                          <Link to={buildTripsHref(rowToken(row))}>
                            {copy.table.viewTrips}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <BoeltechBarChart
              data={chartData}
              series={chartSeries}
              valueFormatter={(value, dataKey) =>
                dataKey === "margin"
                  ? formatMxCurrencyWhole(Number(value))
                  : String(value)
              }
            />
          </>
        )}
      </div>
    </ChartCard>

    <BranchKpisTrendChart
      trend={trendData}
      isLoading={trendLoading || trendFetching}
      months={trendMonths}
      onMonthsChange={setTrendMonths}
    />
    </div>
  );
}
