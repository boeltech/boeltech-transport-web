import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Download, Info } from "lucide-react";
import { DetailAlertCard } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import { ListingDateRangeFilter } from "@shared/ui/listing";
import { useToast } from "@shared/hooks";
import {
  parseExpenseDimension,
  parseExpenseGranularity,
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
import { exportExpensesByDimensionCsv } from "../utils/financeExportHelpers";

interface ExpenseAnalysisTabProps {
  queriesEnabled: boolean;
}

const DEFAULT_DIMENSION = "vehicle";
const DEFAULT_GRANULARITY = "month";

export function ExpenseAnalysisTab({ queriesEnabled }: ExpenseAnalysisTabProps) {
  const { toast } = useToast();
  const filters = useFinanceListingFilters<
    "dimension" | "granularity" | "from" | "to" | "vehicleId"
  >({
    filters: {
      dimension: {},
      granularity: {},
      from: {},
      to: {},
      vehicleId: {},
    },
    defaultFilterValues: {
      dimension: "",
      granularity: "",
    },
    resetPageOnFilterChange: false,
    chipLabels: {
      dimension: financeCopy.expenses.filters.chipDimension,
      granularity: financeCopy.expenses.filters.chipGranularity,
      from: financeCopy.expenses.filters.chipFrom,
      to: financeCopy.expenses.filters.chipTo,
      vehicleId: () => financeCopy.expenses.filters.chipVehicle,
    },
  });

  const dimension = parseExpenseDimension(filters.filters.dimension);
  const granularity = parseExpenseGranularity(filters.filters.granularity);
  const from = filters.filters.from;
  const to = filters.filters.to;
  const vehicleId = filters.filters.vehicleId;

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
      from: from || undefined,
      to: to || undefined,
      vehicleId: vehicleId || undefined,
    }),
    [from, granularity, to, vehicleId],
  );
  const byDimensionFilters = useMemo(
    () => ({
      dimension,
      sortBy: "total" as const,
      sortOrder: "desc" as const,
      from: from || undefined,
      to: to || undefined,
      vehicleId: vehicleId || undefined,
    }),
    [dimension, from, to, vehicleId],
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <DetailAlertCard
          severity="info"
          icon={<Info className="h-4 w-4" />}
          title={financeCopy.expenses.alert.title}
          className="flex-1"
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 self-start"
          disabled={!dimensionRows.length}
          onClick={() => {
            exportExpensesByDimensionCsv(dimensionRows);
            toast({
              title: financeCopy.exports.toasts.exportedTitle,
              description: financeCopy.exports.toasts.expenses,
            });
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          {financeCopy.expenses.exportCsv}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ListingDateRangeFilter
          fromDate={from}
          toDate={to}
          onApply={(nextFrom, nextTo) =>
            filters.setFilters({ from: nextFrom, to: nextTo })
          }
          onClear={() => filters.setFilters({ from: "", to: "" })}
          heading={financeCopy.expenses.filters.dateRangeHeading}
          placeholder={financeCopy.expenses.filters.dateRangePlaceholder}
          idPrefix="expense-analysis-date"
        />
        <FinanceTabFiltersBar
          chips={filters.activeChips}
          hasFilters={filters.hasFilters}
          onClearFilters={filters.clearAll}
        />
      </div>

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
