import { useId, useMemo } from "react";
import { AlertCircle, Info } from "lucide-react";
import {
  analysisPeriodIncludesCurrentMonth,
  previousMonthDateRange,
  resolveOperatingResultWindow,
  summarizeOperatingResult,
  useMonthlyPerformance,
  type FinanceDateRange,
  type OperatingResult,
  type ResolvedAnalysisPeriod,
} from "@features/finance/application";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import {
  formatAnalysisPeriodRange,
  formatDayShort,
  formatMonthLong,
  formatMonthSpan,
} from "../utils/analysisPeriodFormat";

const copy = financeCopy.operatingResult;

/** «octubre 2026» / «oct 2025–sep 2026»: los meses que suma el Resultado. */
function formatResultMonths(months: readonly string[]): string {
  if (months.length === 0) return "";
  return months.length === 1
    ? formatMonthLong(months[0]!)
    : formatMonthSpan(months[0]!, months.at(-1)!);
}

type RowKey = keyof typeof copy.rows;

interface CascadeLine {
  key: RowKey;
  operator: "" | "−" | "=";
  amount: number;
  /** Renglón de total (Margen operativo / Después de personal). */
  total?: boolean;
  /** Partida del costo operativo: va dentro del agrupador. */
  grouped?: boolean;
  /** Subtotal informativo del agrupador: no se resta. */
  subtotal?: boolean;
}

function buildLines(result: OperatingResult): CascadeLine[] {
  const lines: CascadeLine[] = [
    { key: "revenue", operator: "", amount: result.revenue },
    { key: "tripExpenses", operator: "−", amount: result.tripExpenses, grouped: true },
    { key: "tripCommission", operator: "−", amount: result.tripCommission, grouped: true },
    {
      key: "operationalCostGroup",
      operator: "",
      amount: result.operationalCost,
      grouped: true,
      subtotal: true,
    },
    { key: "operationalMargin", operator: "=", amount: result.operationalMargin, total: true },
  ];
  if (result.personnelCost != null && result.afterPersonnel != null) {
    lines.push(
      { key: "personnelCost", operator: "−", amount: result.personnelCost },
      { key: "afterPersonnel", operator: "=", amount: result.afterPersonnel, total: true },
    );
  }
  return lines;
}

function RowHint({ rowKey }: { rowKey: RowKey }) {
  const label = copy.rows[rowKey];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={copy.hintAriaLabel(label)}
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {copy.hints[rowKey]}
      </TooltipContent>
    </Tooltip>
  );
}

function CascadeRow({ line }: { line: CascadeLine }) {
  const negativeTotal = line.total && line.amount < 0;
  return (
    <div
      data-row={line.key}
      className={cn(
        "flex items-center justify-between gap-4 py-1.5",
        line.grouped && "ml-4 border-l-2 border-border pl-3",
        line.total && "mt-1 border-t border-border pt-2.5",
        line.subtotal && "text-xs text-muted-foreground",
      )}
    >
      <dt className="flex min-w-0 items-center gap-1.5">
        <span
          aria-hidden
          className="w-3 shrink-0 text-center font-mono text-muted-foreground"
        >
          {line.operator}
        </span>
        <span className={cn(line.total && "font-semibold", line.subtotal && "italic")}>
          {copy.rows[line.key]}
        </span>
        <RowHint rowKey={line.key} />
      </dt>
      <dd
        className={cn(
          "shrink-0 text-right font-mono tabular-nums",
          line.total && "font-semibold",
          negativeTotal && "text-destructive",
        )}
      >
        {formatMxCurrency(line.amount)}
      </dd>
    </div>
  );
}

export interface OperatingResultCascadeProps {
  result?: OperatingResult | null;
  isLoading?: boolean;
  /** El periodo no cae en meses completos (custom). */
  partialMonths?: boolean;
  /** Se descartaron meses por el tope del API. */
  truncatedMonths?: number | null;
  /** Mes en curso `YYYY-MM`: el título lo marca «(en curso)». */
  currentMonth?: string;
  /** Periodo del hub en texto («06–20 oct 2026 (días)») para la alerta de meses parciales. */
  periodLabel?: string;
  /** Corte «26 oct» cuando el periodo toca el mes en curso. */
  asOf?: string;
  /** Atajo «Ver mes anterior» (periodo = Este mes, P1-a). */
  onViewPreviousMonth?: () => void;
}

/** Suma vertical ATF del hub Análisis: gasto y comisión una sola vez; dos totales. */
export function OperatingResultCascade({
  result,
  isLoading = false,
  partialMonths = false,
  truncatedMonths = null,
  currentMonth,
  periodLabel,
  asOf,
  onViewPreviousMonth,
}: OperatingResultCascadeProps) {
  const titleId = useId();
  const lines = useMemo(() => (result ? buildLines(result) : []), [result]);
  if (!isLoading && !result) return null;

  const months = result?.months ?? [];
  const monthsLabel = formatResultMonths(months);
  const inProgressOnly = months.length === 1 && months[0] === currentMonth;
  const title = monthsLabel
    ? copy.titleWithPeriod(
        inProgressOnly ? `${monthsLabel} ${copy.inProgressSuffix}` : monthsLabel,
      )
    : copy.title;

  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader className="pb-3">
        <CardTitle id={titleId}>{title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || !result ? (
          <div className="w-full space-y-2" aria-busy="true">
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <>
            {partialMonths && periodLabel ? (
              <AlertWithIcon variant="info" role="status" className="w-full">
                {copy.partialMonthsAlert(monthsLabel, months.length, periodLabel)}
              </AlertWithIcon>
            ) : null}
            {result.provisional ? (
              <AlertWithIcon variant="warning" role="status" className="w-full">
                <p>{copy.provisionalNote(asOf)}</p>
                {onViewPreviousMonth ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={onViewPreviousMonth}
                  >
                    {financeCopy.analysisPeriod.viewPreviousMonth}
                  </Button>
                ) : null}
              </AlertWithIcon>
            ) : null}
            <TooltipProvider delayDuration={200}>
              <dl aria-label={copy.ariaLabel} className="w-full text-sm">
                {lines.map((line) => (
                  <CascadeRow key={line.key} line={line} />
                ))}
              </dl>
            </TooltipProvider>
            {truncatedMonths ? (
              <p className="text-xs text-muted-foreground">
                {copy.truncatedNote(truncatedMonths)}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface OperatingResultSectionProps {
  period: ResolvedAnalysisPeriod;
  today: string;
  /** Cambia el periodo del hub (atajo «Ver mes anterior»). */
  onRangeChange?: (range: FinanceDateRange) => void;
}

/**
 * Resultado del periodo del hub (`from`/`to`) sumando la serie mensual. Oculto
 * con base `trip_expenses` o API sin desglose gasto/comisión (TEC C4).
 */
export function OperatingResultSection({
  period,
  today,
  onRangeChange,
}: OperatingResultSectionProps) {
  const resultWindow = useMemo(
    () => resolveOperatingResultWindow({ from: period.from, to: period.to }, today),
    [period.from, period.to, today],
  );
  const { data, isLoading, isPlaceholderData, isError, refetch } =
    useMonthlyPerformance(resultWindow.requestMonths);
  const result = useMemo(
    () => summarizeOperatingResult(data, resultWindow.months),
    [data, resultWindow.months],
  );

  if (isError) {
    return (
      <DetailAlertCard
        severity="warning"
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
    );
  }

  // Primera carga sin esqueleto: la base aún no se conoce y con `trip_expenses` no hay Resultado.
  if (isLoading) return null;
  const refreshing = isPlaceholderData && data?.marginBasis === "operational";
  return (
    <OperatingResultCascade
      result={refreshing ? null : result}
      isLoading={refreshing}
      partialMonths={!resultWindow.aligned}
      truncatedMonths={resultWindow.truncated ? resultWindow.requestMonths : null}
      currentMonth={today.slice(0, 7)}
      periodLabel={formatAnalysisPeriodRange(period.from, period.to)}
      asOf={
        analysisPeriodIncludesCurrentMonth(period, today) ? formatDayShort(today) : undefined
      }
      onViewPreviousMonth={
        period.choice === "this_month" && onRangeChange
          ? () => onRangeChange(previousMonthDateRange(today))
          : undefined
      }
    />
  );
}
