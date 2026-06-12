import { useCallback, useMemo, useState } from "react";
import {
  useFinanceListingFilters,
  useProfitabilityAggregate,
  useProfitabilityTrips,
} from "@features/finance/application";
import type {
  ProfitabilityDimension,
  ProfitabilityScope,
  ProfitabilityStatus,
} from "@features/finance/domain";
import {
  FinanceTabFiltersBar,
  ProfitabilityBucketBar,
  ProfitabilityCharts,
  ProfitabilityContextCards,
  ProfitabilityDimensionBarList,
  ProfitabilityKpiCards,
  ProfitabilityMasterDetailTable,
  ProfitabilityScopeToolbar,
} from "../components";
import { financeCopy } from "../copy";

interface ProfitabilityTabProps {
  queriesEnabled: boolean;
}

const DEFAULT_SCOPE: ProfitabilityScope = "operational";
const DEFAULT_DIMENSION: ProfitabilityDimension = "client";

export function ProfitabilityTab({ queriesEnabled }: ProfitabilityTabProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

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

  const scope = (filters.filters.scope || DEFAULT_SCOPE) as ProfitabilityScope;
  const dimension = (filters.filters.dimension ||
    DEFAULT_DIMENSION) as ProfitabilityDimension;
  const status = filters.filters.status || "all";

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
      limit: 20,
      page: 1,
      scope,
      profitabilityStatus:
        status === "all" ? undefined : [status as ProfitabilityStatus],
      sortBy: "grossMarginPct" as const,
      sortOrder: "desc" as const,
    }),
    [scope, status],
  );

  const { data: trips, isLoading: tripsLoading } = useProfitabilityTrips(tripFilters, {
    enabled: queriesEnabled,
  });

  const { data: contextTrips, isLoading: contextLoading } = useProfitabilityTrips(
    { scope: "all", page: 1, limit: 1 },
    { enabled: queriesEnabled },
  );

  const { data: inProgressTrips, isLoading: inProgressLoading } =
    useProfitabilityTrips(
      { scope: "with_in_progress", page: 1, limit: 1 },
      { enabled: queriesEnabled },
    );

  const { data: operationalTrips } = useProfitabilityTrips(
    { scope: "operational", page: 1, limit: 1 },
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

  const { data: aggregate, isLoading: aggregateLoading } = useProfitabilityAggregate(
    aggregateFilters,
    { enabled: queriesEnabled },
  );

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

  const profitabilityStatusFilter = useMemo(
    () =>
      status === "all" ? undefined : [status as ProfitabilityStatus],
    [status],
  );

  const inProgressActual = useMemo(() => {
    const withProgress = inProgressTrips?.aggregates.totalActual ?? 0;
    const completed = operationalTrips?.aggregates.totalActual ?? 0;
    return Math.max(0, withProgress - completed);
  }, [inProgressTrips, operationalTrips]);

  return (
    <div className="space-y-6">
      <ProfitabilityScopeToolbar scope={scope} onScopeChange={handleScopeChange} />

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

      <ProfitabilityBucketBar
        contextTrips={contextTrips}
        inProgressActual={inProgressActual}
        isLoading={contextLoading || inProgressLoading}
      />

      <ProfitabilityContextCards
        aggregates={contextTrips?.aggregates}
        isLoading={contextLoading}
      />

      <ProfitabilityCharts
        scope={scope}
        trips={trips}
        monthAggregate={monthAggregate}
        tripsLoading={tripsLoading}
        monthLoading={monthAggregateLoading}
      />

      <ProfitabilityDimensionBarList
        scope={scope}
        dimension={dimension}
        aggregate={aggregate}
        isLoading={aggregateLoading}
        onSelectKey={setExpandedKey}
      />

      <ProfitabilityMasterDetailTable
        scope={scope}
        dimension={dimension}
        onDimensionChange={handleDimensionChange}
        status={status}
        onStatusChange={handleStatusChange}
        aggregate={aggregate}
        aggregateLoading={aggregateLoading}
        profitabilityStatus={profitabilityStatusFilter}
        expandedKey={expandedKey}
        onExpandedKeyChange={setExpandedKey}
        queriesEnabled={queriesEnabled}
      />
    </div>
  );
}
