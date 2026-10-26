import { useId, useMemo, useState } from "react";
import { AlertCircle, ChevronDown, Download, Info, TrendingUp } from "lucide-react";
import {
  DEFAULT_MONTHLY_PERFORMANCE_MONTHS,
  MONTHLY_PERFORMANCE_MONTH_OPTIONS,
  alignPerformanceMonths,
  monthlyPerformanceRequestMonths,
  summarizePerformanceWindow,
  summarizePeriodPersonnelCost,
  useMonthlyPerformance,
  type MonthlyPerformanceMonths,
} from "@features/finance/application";
import { resolveMonthlyMarginBasis } from "@features/finance/domain";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { EmptyState } from "@shared/ui/feedback-states";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";
import {
  PerformanceComparisonChart,
  PerformanceKpiCards,
  PerformanceMonthlyTable,
} from "../components";
import { financeCopy } from "../copy";
import { exportMonthlyPerformanceCsv } from "../utils/financeExportHelpers";
import {
  formatPerformanceMonth,
  formatPerformancePeriodNote,
  formatPerformanceProvisionalKpiNote,
} from "../utils/monthlyPerformanceFormat";

const copy = financeCopy.performance;

function MonthsSelector({
  value,
  onChange,
}: {
  value: MonthlyPerformanceMonths;
  onChange: (months: MonthlyPerformanceMonths) => void;
}) {
  return (
    <div
      role="group"
      aria-label={copy.controls.monthsAriaLabel}
      className="flex gap-0.5 rounded-lg bg-muted/50 p-0.5"
    >
      {MONTHLY_PERFORMANCE_MONTH_OPTIONS.map((months) => (
        <Button
          key={months}
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={value === months}
          className={
            value === months
              ? "h-8 bg-background px-3 text-foreground shadow-sm hover:bg-background"
              : "h-8 px-3 text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
          }
          onClick={() => onChange(months)}
        >
          {copy.controls.monthsOption(months)}
        </Button>
      ))}
    </div>
  );
}

export function PerformanceTab() {
  const { toast } = useToast();
  const compareSwitchId = useId();
  const noPreviousNoticeId = useId();
  const [months, setMonths] = useState<MonthlyPerformanceMonths>(
    DEFAULT_MONTHLY_PERFORMANCE_MONTHS,
  );
  /** `null` = sin elección del usuario: se compara cuando hay datos del año anterior. */
  const [compareChoice, setCompareChoice] = useState<boolean | null>(null);
  const [scopeOpen, setScopeOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useMonthlyPerformance(
    monthlyPerformanceRequestMonths(months),
  );

  const aligned = useMemo(() => (data ? alignPerformanceMonths(data) : []), [data]);
  /** KPI, totales y comparación solo sobre meses completos (N5). */
  const summary = useMemo(() => summarizePerformanceWindow(aligned), [aligned]);
  const { hasCurrent, canCompare } = summary;
  const compare = canCompare && (compareChoice ?? true);
  const marginBasis = useMemo(() => {
    const rows = aligned.map((month) => month.current);
    return resolveMonthlyMarginBasis(rows, data?.marginBasis);
  }, [aligned, data?.marginBasis]);
  const personnelCost = useMemo(() => {
    const rows = summary.inProgressOnly && summary.inProgress
      ? [summary.inProgress.current]
      : summary.completed.map((month) => month.current);
    if (!rows.some((row) => row.periodPersonnelCost != null)) return undefined;
    return summarizePeriodPersonnelCost(rows);
  }, [summary]);
  const previousPersonnelCost = useMemo(() => {
    if (personnelCost == null) return undefined;
    return summarizePeriodPersonnelCost(
      summary.completed.map((month) => month.previous),
    );
  }, [personnelCost, summary.completed]);

  const isEmpty = !isLoading && !isError && !hasCurrent;
  const showContent = !isError && !isEmpty;
  const compareUnavailable = !isLoading && !canCompare;

  const completedPrevious = summary.completed.map((month) => month.previous);
  const previousRangeLabel =
    completedPrevious.length > 0 && !summary.inProgressOnly
      ? copy.rangeLabel(
          formatPerformanceMonth(completedPrevious[0]!.period),
          formatPerformanceMonth(completedPrevious.at(-1)!.period),
        )
      : "";
  const periodNote = formatPerformancePeriodNote(summary);
  const provisionalKpiNote = formatPerformanceProvisionalKpiNote(summary);
  const showNoPreviousNotice = showContent && compareUnavailable && !!previousRangeLabel;

  const handleExport = () => {
    exportMonthlyPerformanceCsv(aligned, { compare });
    toast({
      title: financeCopy.exports.toasts.exportedTitle,
      description: financeCopy.exports.toasts.performance,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <MonthsSelector value={months} onChange={setMonths} />
          <div className="flex items-center gap-2">
            <Switch
              id={compareSwitchId}
              checked={compare}
              onCheckedChange={setCompareChoice}
              disabled={isLoading || !canCompare}
              aria-describedby={showNoPreviousNotice ? noPreviousNoticeId : undefined}
            />
            <Label
              htmlFor={compareSwitchId}
              className={
                compareUnavailable
                  ? "cursor-not-allowed text-sm text-muted-foreground"
                  : "cursor-pointer text-sm"
              }
            >
              {copy.controls.compareLabel}
            </Label>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isLoading || !hasCurrent}
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" />
          {copy.exportCsv}
        </Button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">{copy.scopeNote}</p>
        <Collapsible open={scopeOpen} onOpenChange={setScopeOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 h-auto px-2 py-0.5 text-xs text-muted-foreground"
            >
              {scopeOpen ? copy.scopeIncludesHide : copy.scopeIncludesShow}
              <ChevronDown
                className={cn(
                  "ml-1 h-3.5 w-3.5 transition-transform",
                  scopeOpen && "rotate-180",
                )}
                aria-hidden
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="pt-1 text-xs text-muted-foreground">
              {copy.scopeNoteDetail}
            </p>
          </CollapsibleContent>
        </Collapsible>
        {showNoPreviousNotice ? (
          <p
            id={noPreviousNoticeId}
            role="status"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {copy.noPreviousData(previousRangeLabel)}
          </p>
        ) : null}
      </div>

      {isError ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-5 w-5" aria-hidden />}
          title={copy.error.title}
          items={[{ text: copy.error.description }]}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
            >
              {copy.error.retry}
            </Button>
          }
        />
      ) : isEmpty ? (
        <EmptyState
          icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
          title={copy.empty.title}
          description={copy.empty.description}
        />
      ) : (
        <>
          <PerformanceKpiCards
            current={summary.current}
            previous={summary.previous}
            compare={compare}
            isLoading={isLoading}
            periodNote={periodNote}
            provisionalNote={provisionalKpiNote}
            marginBasis={marginBasis}
            personnelCost={personnelCost}
            previousPersonnelCost={previousPersonnelCost}
            months={aligned}
          />
          <p className="text-xs text-muted-foreground">
            {copy.operationalCostLegend}
          </p>
          <PerformanceComparisonChart
            months={aligned}
            compare={compare}
            isLoading={isLoading}
          />
          {!isLoading ? (
            <PerformanceMonthlyTable
              months={aligned}
              compare={compare}
              showPersonnelColumn={personnelCost != null}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
