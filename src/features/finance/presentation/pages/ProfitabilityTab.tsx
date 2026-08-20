import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import {
  parseProfitabilityDimension,
  parseProfitabilityScope,
  parseProfitabilityStatus,
  useFinanceListingFilters,
  useProfitabilityAggregate,
  useProfitabilityTrips,
} from "@features/finance/application";
import type {
  ProfitabilityDimension,
  ProfitabilityScope,
} from "@features/finance/domain";
import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";
import {
  FinanceTabFiltersBar,
  ProfitabilityCharts,
  ProfitabilityKpiCards,
  ProfitabilityMasterDetailTable,
  ProfitabilityScopeToolbar,
} from "../components";
import { financeCopy } from "../copy";
import { exportProfitabilityTripsCsv } from "../utils/financeExportHelpers";

interface ProfitabilityTabProps {
  queriesEnabled: boolean;
}

const DEFAULT_SCOPE: ProfitabilityScope = "operational";
const DEFAULT_DIMENSION: ProfitabilityDimension = "client";

export function ProfitabilityTab({ queriesEnabled }: ProfitabilityTabProps) {
  const { toast } = useToast();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [chartsOpen, setChartsOpen] = useState(false);

  const filters = useFinanceListingFilters<"scope" | "dimension" | "status">({
    filters: {
      scope: {},
      dimension: {},
      status: {},
    },
    defaultFilterValues: {
      scope: "",
      dimension: "",
      status: "",
    },
    resetPageOnFilterChange: false,
    chipLabels: {
      scope: financeCopy.profitability.filters.chipScope,
      dimension: financeCopy.profitability.filters.chipDimension,
      status: financeCopy.profitability.filters.chipStatus,
    },
  });

  const scope = parseProfitabilityScope(filters.filters.scope);
  const dimension = parseProfitabilityDimension(filters.filters.dimension);
  const profitabilityStatusFilter = parseProfitabilityStatus(
    filters.filters.status,
  );
  const status = profitabilityStatusFilter ?? "all";

  const handleScopeChange = useCallback(
    (value: ProfitabilityScope) => {
      filters.setFilter("scope", value === DEFAULT_SCOPE ? "" : value);
      setExpandedKey(null);
    },
    [filters],
  );

  const handleDimensionChange = useCallback(
    (value: ProfitabilityDimension) => {
      filters.setFilter("dimension", value === DEFAULT_DIMENSION ? "" : value);
      setExpandedKey(null);
    },
    [filters],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      filters.setFilter("status", value === "all" ? "" : value);
      setExpandedKey(null);
    },
    [filters],
  );

  const handleClearFilters = useCallback(() => {
    filters.clearAll();
    setExpandedKey(null);
  }, [filters]);

  const tripFilters = useMemo(
    () => ({
      limit: 100,
      page: 1,
      scope,
      profitabilityStatus: profitabilityStatusFilter
        ? [profitabilityStatusFilter]
        : undefined,
      sortBy: "grossMarginPct" as const,
      sortOrder: "desc" as const,
    }),
    [profitabilityStatusFilter, scope],
  );

  const { data: trips, isLoading: tripsLoading } = useProfitabilityTrips(
    tripFilters,
    { enabled: queriesEnabled },
  );

  const aggregateFilters = useMemo(
    () => ({
      dimension,
      scope,
      sortBy: "blendedMarginPct" as const,
      sortOrder: "desc" as const,
    }),
    [dimension, scope],
  );

  const { data: aggregate, isLoading: aggregateLoading } =
    useProfitabilityAggregate(aggregateFilters, { enabled: queriesEnabled });

  const { data: monthAggregate, isLoading: monthAggregateLoading } =
    useProfitabilityAggregate(
      {
        dimension: "month",
        scope,
        sortBy: "totalRevenue",
        sortOrder: "asc",
      },
      { enabled: queriesEnabled },
    );

  const chartsCopy = financeCopy.profitability.chartsSection;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ProfitabilityScopeToolbar scope={scope} onScopeChange={handleScopeChange} />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!trips?.data.length}
          onClick={() => {
            const rows = trips?.data ?? [];
            exportProfitabilityTripsCsv(rows);
            const total = trips?.pagination.total ?? rows.length;
            toast({
              title: financeCopy.exports.toasts.exportedTitle,
              description:
                total > rows.length
                  ? financeCopy.exports.toasts.profitabilityTruncated(
                      rows.length,
                      total,
                    )
                  : financeCopy.exports.toasts.profitability,
            });
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          {financeCopy.profitability.exportCsv}
        </Button>
      </div>

      <FinanceTabFiltersBar
        chips={filters.activeChips}
        hasFilters={filters.hasFilters}
        onClearFilters={handleClearFilters}
      />

      <ProfitabilityKpiCards
        scope={scope}
        trips={trips}
        monthAggregate={monthAggregate}
        isLoading={tripsLoading || monthAggregateLoading}
      />

      <ProfitabilityMasterDetailTable
        scope={scope}
        dimension={dimension}
        onDimensionChange={handleDimensionChange}
        status={status}
        onStatusChange={handleStatusChange}
        aggregate={aggregate}
        aggregateLoading={aggregateLoading}
        profitabilityStatus={
          profitabilityStatusFilter ? [profitabilityStatusFilter] : undefined
        }
        expandedKey={expandedKey}
        onExpandedKeyChange={setExpandedKey}
        queriesEnabled={queriesEnabled}
      />

      <Collapsible open={chartsOpen} onOpenChange={setChartsOpen}>
        <CollapsibleTrigger
          type="button"
          className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted/40 sm:w-auto sm:min-w-[12rem]"
          aria-expanded={chartsOpen}
        >
          <span>{chartsOpen ? chartsCopy.hide : chartsCopy.show}</span>
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              chartsOpen && "rotate-180",
            )}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <ProfitabilityCharts
            scope={scope}
            trips={trips}
            monthAggregate={monthAggregate}
            tripsLoading={tripsLoading}
            monthLoading={monthAggregateLoading}
            showStatusDistribution={false}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
