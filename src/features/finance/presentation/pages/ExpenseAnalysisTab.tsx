import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronDown, Download, Info, Receipt } from "lucide-react";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { ActiveFilterChips } from "@shared/ui/listing";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";
import {
  ANALYSIS_PERIOD_URL_PARAMS,
  WIDEST_ANALYSIS_PERIOD_PRESET,
  analysisPeriodDayCount,
  analysisPeriodUrlRange,
  parseExpenseDimension,
  parseExpenseGranularity,
  previousMonthDateRange,
  useAnalysisPeriod,
  useExpensesByCategory,
  useExpensesByDimension,
  useFinanceListingFilters,
  type ExpenseGranularity,
} from "@features/finance/application";
import { financeCopy } from "../copy";
import {
  ExpenseAnalysisCharts,
  ExpenseAnalysisKpiCards,
  ExpenseDimensionTableSection,
} from "../components";
import { exportExpensesByDimensionCsv } from "../utils/financeExportHelpers";

const DEFAULT_DIMENSION = "vehicle";
/** D8: periodos de un mes o menos se grafican por día; más largos, por mes. */
const DAY_GRANULARITY_MAX_DAYS = 31;

function defaultGranularityFor(period: { from?: string; to?: string }): ExpenseGranularity {
  const days = analysisPeriodDayCount(period);
  return days != null && days <= DAY_GRANULARITY_MAX_DAYS ? "day" : "month";
}

function ExpenseScopeAlert({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const alertCopy = financeCopy.expenses.alert;
  return (
    <DetailAlertCard
      severity="info"
      icon={<Info className="h-5 w-5" aria-hidden />}
      title={alertCopy.summary}
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" size="sm" variant="outline">
            <Link to="/trips">{alertCopy.goToTrips}</Link>
          </Button>
          <Button asChild type="button" size="sm" variant="ghost">
            <Link to="/finance/analysis?view=margin">
              {alertCopy.goToProfitability}
            </Link>
          </Button>
        </div>
      }
    >
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 h-auto px-2 py-1 text-xs"
          >
            {open ? alertCopy.includesHide : alertCopy.includesShow}
            <ChevronDown
              className={cn(
                "ml-1 h-3.5 w-3.5 transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pt-1 text-sm text-muted-foreground">
          <p>{alertCopy.body}</p>
          <p>
            {alertCopy.bodyRoutePrefix}{" "}
            <span className="font-medium text-foreground/80">
              {alertCopy.bodyRouteLink}
            </span>
            {alertCopy.bodyRouteSuffix}
          </p>
        </CollapsibleContent>
      </Collapsible>
    </DetailAlertCard>
  );
}

export function ExpenseAnalysisTab() {
  const { toast } = useToast();
  const { period, today, setRange } = useAnalysisPeriod();
  const [alertOpen, setAlertOpen] = useState(false);
  const defaultGranularity = defaultGranularityFor(period);

  const filters = useFinanceListingFilters<"dimension" | "granularity" | "vehicleId">({
    filters: {
      dimension: {},
      granularity: {},
      vehicleId: {},
    },
    defaultFilterValues: {
      dimension: "",
      granularity: defaultGranularity,
    },
    resetPageOnFilterChange: false,
    preserveParamsOnClear: [...ANALYSIS_PERIOD_URL_PARAMS],
    chipLabels: {
      dimension: financeCopy.expenses.filters.chipDimension,
      granularity: financeCopy.expenses.filters.chipGranularity,
      vehicleId: () => financeCopy.expenses.filters.chipVehicle,
    },
  });

  const dimension = parseExpenseDimension(filters.filters.dimension);
  const granularity = filters.filters.granularity
    ? parseExpenseGranularity(filters.filters.granularity)
    : defaultGranularity;
  const { from, to } = period;
  const vehicleId = filters.filters.vehicleId;

  const handleWidenPeriod = useCallback(() => {
    setRange(analysisPeriodUrlRange(WIDEST_ANALYSIS_PERIOD_PRESET, today));
  }, [setRange, today]);

  const handleViewPreviousMonth = useCallback(() => {
    setRange(previousMonthDateRange(today));
  }, [setRange, today]);

  const handleDimensionChange = useCallback(
    (value: "vehicle" | "driver" | "client" | "route") => {
      filters.setFilter("dimension", value === DEFAULT_DIMENSION ? "" : value);
    },
    [filters],
  );

  const handleGranularityChange = useCallback(
    (value: ExpenseGranularity) => {
      filters.setFilter("granularity", value === defaultGranularity ? "" : value);
    },
    [defaultGranularity, filters],
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

  /** Suma del periodo completo — misma base que el KPI (D2). */
  const categorySummary = useMemo(() => {
    if (!byCategory) return [];
    return Object.entries(byCategory.series)
      .map(([category, values]) => ({
        category,
        amount: values.reduce((sum, value) => sum + value, 0),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [byCategory]);

  const dimensionRows = byDimension ?? [];
  const dimensionLabel = financeCopy.expenses.filters.dimensionValues[dimension];

  const hasExpenseData =
    (byCategory?.total.some((value) => value > 0) ?? false) ||
    dimensionRows.length > 0;
  const isEmpty = !isLoading && !isLoadError && !hasExpenseData;
  const isWidestPeriod = period.choice === WIDEST_ANALYSIS_PERIOD_PRESET;
  const isCurrentMonth = period.choice === "this_month";

  const errorCopy = financeCopy.expenses.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {financeCopy.expenses.filters.granularity}
            </p>
            <Select
              value={granularity}
              onValueChange={(value) =>
                handleGranularityChange(value as ExpenseGranularity)
              }
            >
              <SelectTrigger
                className="w-[180px]"
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full shrink-0 self-start sm:w-auto lg:self-auto"
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

      <p className="text-xs text-muted-foreground">{financeCopy.expenses.dateBasis}</p>

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
        <div className="space-y-3">
          <EmptyState
            icon={<Receipt className="h-10 w-10 text-muted-foreground" />}
            title={financeCopy.expenses.empty.title}
            description={financeCopy.expenses.empty.description}
          />
          <div className="flex flex-wrap justify-center gap-2">
            {isCurrentMonth ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleViewPreviousMonth}
              >
                {financeCopy.expenses.empty.viewPreviousMonth}
              </Button>
            ) : null}
            {!isWidestPeriod ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleWidenPeriod}
              >
                {financeCopy.expenses.empty.widenPeriod}
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="ghost" asChild>
              <Link to="/finance/analysis?view=performance">
                {financeCopy.expenses.empty.viewPerformance}
              </Link>
            </Button>
          </div>
          <ExpenseScopeAlert open={alertOpen} onOpenChange={setAlertOpen} />
        </div>
      ) : (
        <>
          <ExpenseAnalysisKpiCards
            byCategory={byCategory}
            dimensionLabel={dimensionLabel}
            dimensionRows={dimensionRows}
            isLoading={byCategoryLoading}
            isDimensionLoading={byDimensionLoading}
          />

          <ExpenseScopeAlert open={alertOpen} onOpenChange={setAlertOpen} />

          <ExpenseAnalysisCharts
            byCategory={byCategory}
            categorySummary={categorySummary}
            granularity={granularity}
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
