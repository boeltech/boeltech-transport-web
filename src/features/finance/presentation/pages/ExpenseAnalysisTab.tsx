import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  useExpensesByCategory,
  useExpensesByDimension,
  useFinanceListingFilters,
} from "@features/finance/application";
import { financeCopy } from "../copy";
import {
  ExpenseAnalysisCharts,
  ExpenseAnalysisKpiCards,
  ExpenseDimensionTableSection,
  FinanceTabFiltersBar,
} from "../components";

interface ExpenseAnalysisTabProps {
  queriesEnabled: boolean;
}

const DEFAULT_DIMENSION = "vehicle";
const DEFAULT_GRANULARITY = "month";

export function ExpenseAnalysisTab({ queriesEnabled }: ExpenseAnalysisTabProps) {
  const filters = useFinanceListingFilters<"dimension" | "granularity">({
    filters: {
      dimension: {},
      granularity: {},
    },
    defaultFilterValues: {
      dimension: "",
      granularity: "",
    },
    resetPageOnFilterChange: false,
    chipLabels: {
      dimension: financeCopy.expenses.filters.chipDimension,
      granularity: financeCopy.expenses.filters.chipGranularity,
    },
  });

  const dimension = (filters.filters.dimension ||
    DEFAULT_DIMENSION) as "vehicle" | "driver" | "client" | "route";
  const granularity = (filters.filters.granularity ||
    DEFAULT_GRANULARITY) as "day" | "week" | "month";

  const handleDimensionChange = useCallback(
    (value: "vehicle" | "driver" | "client" | "route") => {
      filters.setFilter("dimension", value === DEFAULT_DIMENSION ? "" : value);
    },
    [filters],
  );

  const handleGranularityChange = useCallback(
    (value: "day" | "week" | "month") => {
      filters.setFilter("granularity", value === DEFAULT_GRANULARITY ? "" : value);
    },
    [filters],
  );

  const byCategoryFilters = useMemo(
    () => ({
      granularity,
    }),
    [granularity],
  );
  const byDimensionFilters = useMemo(
    () => ({
      dimension,
      sortBy: "total" as const,
      sortOrder: "desc" as const,
    }),
    [dimension],
  );

  const { data: byCategory, isLoading: byCategoryLoading } = useExpensesByCategory(
    byCategoryFilters,
    { enabled: queriesEnabled },
  );
  const { data: byDimension, isLoading: byDimensionLoading } = useExpensesByDimension(
    byDimensionFilters,
    { enabled: queriesEnabled },
  );

  const latestPeriod = byCategory?.periods.at(-1);
  const latestPeriodIndex = latestPeriod && byCategory
    ? byCategory.periods.findIndex((item) => item === latestPeriod)
    : -1;

  const categorySummary = useMemo(() => {
    if (!byCategory || latestPeriodIndex < 0) return [];
    return Object.entries(byCategory.series)
      .map(([category, values]) => ({
        category,
        amount: values[latestPeriodIndex] ?? 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [byCategory, latestPeriodIndex]);

  const dimensionRows = byDimension ?? [];
  const dimensionLabel = financeCopy.expenses.filters.dimensionValues[dimension];

  return (
    <div className="space-y-6">
      <DetailAlertCard
        severity="info"
        icon={<Info className="h-4 w-4" />}
        title={financeCopy.expenses.alert.title}
        items={[
          {
            text: financeCopy.expenses.alert.body,
          },
          {
            text: (
              <>
                {financeCopy.expenses.alert.bodyRoutePrefix}{" "}
                <Link to="/trips" className="font-medium underline underline-offset-2">
                  {financeCopy.expenses.alert.bodyRouteLink}
                </Link>
                {financeCopy.expenses.alert.bodyRouteSuffix}
              </>
            ),
          },
        ]}
      />

      <FinanceTabFiltersBar
        chips={filters.activeChips}
        hasFilters={filters.hasFilters}
        onClearFilters={filters.clearAll}
      />

      <ExpenseAnalysisKpiCards
        byCategory={byCategory}
        categorySummary={categorySummary}
        latestPeriodIndex={latestPeriodIndex}
        latestPeriod={latestPeriod}
        dimensionLabel={dimensionLabel}
        dimensionRows={dimensionRows}
        isLoading={byCategoryLoading}
        isDimensionLoading={byDimensionLoading}
      />

      <ExpenseAnalysisCharts
        byCategory={byCategory}
        categorySummary={categorySummary}
        latestPeriodIndex={latestPeriodIndex}
        latestPeriod={latestPeriod}
        granularity={granularity}
        onGranularityChange={handleGranularityChange}
        isLoading={byCategoryLoading}
      />

      <ExpenseDimensionTableSection
        dimension={dimension}
        onDimensionChange={handleDimensionChange}
        rows={dimensionRows}
        isLoading={byDimensionLoading}
      />
    </div>
  );
}
