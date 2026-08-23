import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { ListingDateRangeFilter } from "@shared/ui/listing";
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
import { formatExpenseTemporalLabel } from "../utils/financeChartHelpers";

interface ExpenseAnalysisTabProps {
  queriesEnabled: boolean;
}

const DEFAULT_DIMENSION = "vehicle";
const DEFAULT_GRANULARITY = "month";

export function ExpenseAnalysisTab({ queriesEnabled }: ExpenseAnalysisTabProps) {
  const { toast } = useToast();
  const [chartsOpen, setChartsOpen] = useState(false);
  const [includesOpen, setIncludesOpen] = useState(false);

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
  const periodLabel = formatExpenseTemporalLabel({
    from: from || undefined,
    to: to || undefined,
    latestPeriod,
  });

  const chartsCopy = financeCopy.expenses.chartsSection;
  const alertCopy = financeCopy.expenses.alert;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">{alertCopy.summary}</p>
          <Collapsible open={includesOpen} onOpenChange={setIncludesOpen}>
            <CollapsibleTrigger
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              aria-expanded={includesOpen}
            >
              {includesOpen ? alertCopy.includesHide : alertCopy.includesShow}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform",
                  includesOpen && "rotate-180",
                )}
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <p>{alertCopy.body}</p>
                <p>
                  {alertCopy.bodyRoutePrefix}{" "}
                  <Link
                    to="/trips"
                    className="font-medium text-foreground underline underline-offset-2"
                  >
                    {alertCopy.bodyRouteLink}
                  </Link>
                  {alertCopy.bodyRouteSuffix}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
        <FinanceTabFiltersBar
          chips={filters.activeChips}
          hasFilters={filters.hasFilters}
          onClearFilters={filters.clearAll}
        />
      </div>

      <ExpenseAnalysisKpiCards
        byCategory={byCategory}
        latestPeriodIndex={latestPeriodIndex}
        periodLabel={periodLabel}
        dimensionLabel={dimensionLabel}
        dimensionRows={dimensionRows}
        isLoading={byCategoryLoading}
        isDimensionLoading={byDimensionLoading}
      />

      <ExpenseDimensionTableSection
        dimension={dimension}
        onDimensionChange={handleDimensionChange}
        rows={dimensionRows}
        isLoading={byDimensionLoading}
      />

      <Collapsible open={chartsOpen} onOpenChange={setChartsOpen}>
        <CollapsibleTrigger
          type="button"
          className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted/40 sm:w-auto sm:min-w-[14rem]"
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
          <ExpenseAnalysisCharts
            byCategory={byCategory}
            categorySummary={categorySummary}
            latestPeriodIndex={latestPeriodIndex}
            latestPeriod={latestPeriod}
            periodLabel={periodLabel}
            isLoading={byCategoryLoading}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
