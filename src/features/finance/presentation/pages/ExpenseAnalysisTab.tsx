import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Download, Info, Receipt } from "lucide-react";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { ActiveFilterChips } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useToast } from "@shared/hooks";
import { formatDate, getTodayString } from "@shared/utils/dateUtils";
import {
  parseExpenseDimension,
  parseExpenseGranularity,
  resolveAnalysisPeriod,
  useExpensesByCategory,
  useExpensesByDimension,
  useFinanceListingFilters,
  type FinanceDateRange,
} from "@features/finance/application";
import { financeCopy } from "../copy";
import {
  AnalysisPeriodCaption,
  AnalysisPeriodSelector,
  ExpenseAnalysisCharts,
  ExpenseAnalysisKpiCards,
  ExpenseDimensionTableSection,
} from "../components";
import { exportExpensesByDimensionCsv } from "../utils/financeExportHelpers";
import { formatFinancePeriodLabel } from "../utils/financeChartHelpers";

const DEFAULT_DIMENSION = "vehicle";
const DEFAULT_GRANULARITY = "month";

export function ExpenseAnalysisTab() {
  const { toast } = useToast();
  const [today] = useState(getTodayString);

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
      vehicleId: () => financeCopy.expenses.filters.chipVehicle,
    },
  });

  const dimension = parseExpenseDimension(filters.filters.dimension);
  const granularity = parseExpenseGranularity(filters.filters.granularity);
  const period = useMemo(
    () =>
      resolveAnalysisPeriod(
        { from: filters.filters.from, to: filters.filters.to },
        today,
      ),
    [filters.filters.from, filters.filters.to, today],
  );
  const { from, to } = period;
  const vehicleId = filters.filters.vehicleId;

  const handlePeriodChange = useCallback(
    (range: FinanceDateRange) => {
      filters.setFilters({ from: range.from, to: range.to });
    },
    [filters],
  );

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
      from,
      to,
      vehicleId: vehicleId || undefined,
    }),
    [from, granularity, to, vehicleId],
  );
  const byDimensionFilters = useMemo(
    () => ({
      dimension,
      sortBy: "total" as const,
      sortOrder: "desc" as const,
      from,
      to,
      vehicleId: vehicleId || undefined,
    }),
    [dimension, from, to, vehicleId],
  );

  const {
    data: byCategory,
    isLoading: byCategoryLoading,
    isError: byCategoryError,
    refetch: refetchByCategory,
  } = useExpensesByCategory(byCategoryFilters);
  const {
    data: byDimension,
    isLoading: byDimensionLoading,
    isError: byDimensionError,
    refetch: refetchByDimension,
  } = useExpensesByDimension(byDimensionFilters);

  const isLoading = byCategoryLoading || byDimensionLoading;
  const isLoadError = byCategoryError || byDimensionError;
  const handleRetry = useCallback(() => {
    void refetchByCategory();
    void refetchByDimension();
  }, [refetchByCategory, refetchByDimension]);

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
  const latestBucketLabel = latestPeriod
    ? granularity === "month"
      ? formatFinancePeriodLabel(latestPeriod)
      : formatDate(latestPeriod)
    : "";

  const hasExpenseData =
    (byCategory?.total.some((value) => value > 0) ?? false) ||
    dimensionRows.length > 0;
  const isEmpty = !isLoading && !isLoadError && !hasExpenseData;

  const alertCopy = financeCopy.expenses.alert;
  const errorCopy = financeCopy.expenses.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <DetailAlertCard
          severity="info"
          icon={<Info className="h-5 w-5" aria-hidden />}
          title={alertCopy.includesShow}
          items={[
            { text: alertCopy.summary },
            { text: alertCopy.body },
            {
              text: `${alertCopy.bodyRoutePrefix} ${alertCopy.bodyRouteLink}${alertCopy.bodyRouteSuffix}`,
            },
          ]}
          action={
            <Button asChild type="button" size="sm" variant="outline">
              <Link to="/trips">{alertCopy.goToTrips}</Link>
            </Button>
          }
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 self-start"
          disabled={!dimensionRows.length}
          onClick={() => {
            exportExpensesByDimensionCsv(dimensionRows, dimension);
            toast({
              title: financeCopy.exports.toasts.exportedTitle,
              description: financeCopy.exports.toasts.expenses(dimensionLabel),
            });
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          {financeCopy.expenses.exportCsv}
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <AnalysisPeriodSelector
            period={period}
            onRangeChange={handlePeriodChange}
            today={today}
            idPrefix="expense-analysis-period"
          />
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {financeCopy.expenses.filters.granularity}
            </p>
            <Select
              value={granularity}
              onValueChange={(value) =>
                handleGranularityChange(value as "day" | "week" | "month")
              }
            >
              <SelectTrigger
                className="w-[160px]"
                aria-label={financeCopy.expenses.filters.granularity}
              >
                <SelectValue
                  placeholder={financeCopy.expenses.filters.granularity}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">
                  {financeCopy.expenses.filters.granularityValues.day}
                </SelectItem>
                <SelectItem value="week">
                  {financeCopy.expenses.filters.granularityValues.week}
                </SelectItem>
                <SelectItem value="month">
                  {financeCopy.expenses.filters.granularityValues.month}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {filters.hasFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            <ActiveFilterChips chips={filters.activeChips} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={filters.clearAll}
            >
              {financeCopy.page.clearFilters}
            </Button>
          </div>
        ) : null}
      </div>

      <AnalysisPeriodCaption period={period} today={today} />

      {isLoadError ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-5 w-5" aria-hidden />}
          title={errorCopy.title}
          items={[{ text: errorCopy.description }]}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
            >
              {errorCopy.retry}
            </Button>
          }
        />
      ) : isEmpty ? (
        <EmptyState
          icon={<Receipt className="h-10 w-10 text-muted-foreground" />}
          title={financeCopy.expenses.empty.title}
          description={financeCopy.expenses.empty.description}
        />
      ) : (
        <>
          <ExpenseAnalysisKpiCards
            byCategory={byCategory}
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
            periodLabel={latestBucketLabel}
            isLoading={byCategoryLoading}
          />

          <ExpenseDimensionTableSection
            dimension={dimension}
            onDimensionChange={handleDimensionChange}
            rows={dimensionRows}
            isLoading={byDimensionLoading}
          />
        </>
      )}
    </div>
  );
}
