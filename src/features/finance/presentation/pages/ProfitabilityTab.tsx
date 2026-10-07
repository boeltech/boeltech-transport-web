import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Download, TrendingUp } from "lucide-react";
import {
  DEFAULT_MARGIN_DIMENSION,
  DEFAULT_PROFITABILITY_SCOPE,
  PROFITABILITY_LOSS_FILTER,
  parseProfitabilityDimension,
  parseProfitabilityLossFilter,
  parseProfitabilityScope,
  resolveAnalysisPeriod,
  useFinanceListingFilters,
  useProfitabilityAggregate,
  useProfitabilityTrips,
  type FinanceDateRange,
  type MarginAnalysisDimension,
  type ResolvedAnalysisPeriod,
} from "@features/finance/application";
import type { ProfitabilityScope } from "@features/finance/domain";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { EmptyState } from "@shared/ui/feedback-states";
import { useToast } from "@shared/hooks";
import { formatDate, getTodayString } from "@shared/utils/dateUtils";
import {
  AnalysisPeriodCaption,
  AnalysisPeriodSelector,
  FinanceTabFiltersBar,
  ProfitabilityKpiCards,
  ProfitabilityMasterDetailTable,
  ProfitabilityScopeToolbar,
} from "../components";
import { financeCopy } from "../copy";
import {
  exportProfitabilityAggregateCsv,
  exportProfitabilityTripsCsv,
} from "../utils/financeExportHelpers";
import { DETAIL_TRIPS_LIMIT } from "../utils/profitabilityExpandTripsFilters";
import { showsMarginForScope } from "../utils/profitabilityScopeHelpers";

const copy = financeCopy.profitability;

function ProfitabilityEmptyState({
  scope,
  period,
  onWidenPeriod,
}: {
  scope: ProfitabilityScope;
  period: ResolvedAnalysisPeriod;
  onWidenPeriod: () => void;
}) {
  const isDefaultPeriod = period.choice === "last_12";
  const operational = scope === "operational" || scope === "with_in_progress";

  let title: string;
  let description: string;
  if (scope === "pipeline") {
    title = copy.empty.pipelineTitle;
    description = copy.empty.pipelineDescription;
  } else if (scope === "cancelled") {
    title = copy.empty.cancelledTitle;
    description = copy.empty.cancelledDescription;
  } else if (scope === "all") {
    title = copy.empty.allTitle;
    description = copy.empty.allDescription;
  } else if (isDefaultPeriod) {
    title = copy.empty.absoluteTitle;
    description = copy.empty.absoluteDescription;
  } else {
    title = copy.empty.periodTitle(
      formatDate(period.from ?? ""),
      formatDate(period.to ?? ""),
    );
    description = copy.empty.periodDescription;
  }

  return (
    <div className="space-y-3">
      <EmptyState
        icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
        title={title}
        description={description}
      />
      <div className="flex flex-wrap justify-center gap-2">
        {!isDefaultPeriod ? (
          <Button type="button" size="sm" variant="outline" onClick={onWidenPeriod}>
            {copy.empty.widenPeriod}
          </Button>
        ) : null}
        {operational ? (
          <Button type="button" size="sm" variant="ghost" asChild>
            <Link to="/finance/analysis?view=performance">
              {copy.empty.viewPerformance}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ProfitabilityTab() {
  const { toast } = useToast();
  const [today] = useState(getTodayString);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const filters = useFinanceListingFilters<
    "scope" | "dimension" | "status" | "from" | "to"
  >({
    filters: {
      scope: {},
      dimension: {},
      status: {},
      from: {},
      to: {},
    },
    defaultFilterValues: {
      scope: "",
      dimension: "",
      status: "",
    },
    resetPageOnFilterChange: false,
    chipLabels: {
      scope: copy.filters.chipScope,
      dimension: copy.filters.chipDimension,
      status: copy.filters.chipLossFilter,
    },
  });

  const scope = parseProfitabilityScope(filters.filters.scope);
  const dimension = parseProfitabilityDimension(filters.filters.dimension);
  const lossOnly =
    showsMarginForScope(scope) && parseProfitabilityLossFilter(filters.filters.status);
  const period = useMemo(
    () =>
      resolveAnalysisPeriod(
        { from: filters.filters.from, to: filters.filters.to },
        today,
      ),
    [filters.filters.from, filters.filters.to, today],
  );
  const { from, to } = period;

  const handleScopeChange = useCallback(
    (value: ProfitabilityScope) => {
      filters.setFilters({
        scope: value === DEFAULT_PROFITABILITY_SCOPE ? "" : value,
        ...(showsMarginForScope(value) ? {} : { status: "" }),
      });
      setExpandedKey(null);
    },
    [filters],
  );

  const handleDimensionChange = useCallback(
    (value: MarginAnalysisDimension) => {
      filters.setFilter("dimension", value === DEFAULT_MARGIN_DIMENSION ? "" : value);
      setExpandedKey(null);
    },
    [filters],
  );

  const handlePeriodChange = useCallback(
    (range: FinanceDateRange) => {
      filters.setFilters({ from: range.from, to: range.to });
      setExpandedKey(null);
    },
    [filters],
  );

  const handleLossOnlyChange = useCallback(
    (next: boolean) => {
      filters.setFilter("status", next ? PROFITABILITY_LOSS_FILTER : "");
    },
    [filters],
  );

  const handleClearFilters = useCallback(() => {
    filters.clearAll();
    setExpandedKey(null);
  }, [filters]);

  const tripFilters = useMemo(
    () => ({
      limit: DETAIL_TRIPS_LIMIT,
      page: 1,
      scope,
      from,
      to,
      sortBy: "grossMarginPct" as const,
      sortOrder: "desc" as const,
    }),
    [from, scope, to],
  );

  const { data: trips, isLoading: tripsLoading } = useProfitabilityTrips(
    tripFilters,
  );

  const aggregateFilters = useMemo(
    () => ({
      dimension,
      scope,
      from,
      to,
      sortBy: "blendedMargin" as const,
      sortOrder: "desc" as const,
    }),
    [dimension, from, scope, to],
  );

  const { data: aggregate, isLoading: aggregateLoading } =
    useProfitabilityAggregate(aggregateFilters);

  const dimensionLabel = copy.filters.dimensions[dimension];

  const handleExportGrouped = () => {
    exportProfitabilityAggregateCsv(aggregate ?? [], { dimension, scope, from, to });
    toast({
      title: financeCopy.exports.toasts.exportedTitle,
      description: financeCopy.exports.toasts.profitabilityGrouped(dimensionLabel),
    });
  };

  const handleExportTrips = () => {
    const rows = trips?.data ?? [];
    exportProfitabilityTripsCsv(rows);
    const total = trips?.pagination.total ?? rows.length;
    toast({
      title: financeCopy.exports.toasts.exportedTitle,
      description:
        total > rows.length
          ? financeCopy.exports.toasts.profitabilityTruncated(rows.length, total)
          : financeCopy.exports.toasts.profitability,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
          <AnalysisPeriodSelector
            period={period}
            onRangeChange={handlePeriodChange}
            today={today}
            idPrefix="profitability-period"
          />
          <ProfitabilityScopeToolbar scope={scope} onScopeChange={handleScopeChange} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="self-start lg:self-auto"
              disabled={!aggregate?.length && !trips?.data.length}
            >
              <Download className="mr-2 h-4 w-4" />
              {copy.exportMenu.trigger}
              <ChevronDown className="ml-1.5 h-3.5 w-3.5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={!aggregate?.length}
              onSelect={handleExportGrouped}
            >
              {copy.exportMenu.grouped(dimensionLabel)}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!trips?.data.length}
              onSelect={handleExportTrips}
            >
              {copy.exportMenu.trips(DETAIL_TRIPS_LIMIT)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <FinanceTabFiltersBar
        chips={filters.activeChips}
        hasFilters={filters.hasFilters}
        onClearFilters={handleClearFilters}
      />

      <div className="space-y-2">
        <AnalysisPeriodCaption period={period} today={today} />
        <ProfitabilityKpiCards
          scope={scope}
          trips={trips}
          isLoading={tripsLoading}
          lossOnly={lossOnly}
          onLossOnlyChange={handleLossOnlyChange}
        />
      </div>

      <ProfitabilityMasterDetailTable
        scope={scope}
        dimension={dimension}
        onDimensionChange={handleDimensionChange}
        from={from}
        to={to}
        lossOnly={lossOnly}
        aggregate={aggregate}
        aggregateLoading={aggregateLoading}
        emptyState={
          <ProfitabilityEmptyState
            scope={scope}
            period={period}
            onWidenPeriod={() => handlePeriodChange({ from: "", to: "" })}
          />
        }
        expandedKey={expandedKey}
        onExpandedKeyChange={setExpandedKey}
      />
    </div>
  );
}
