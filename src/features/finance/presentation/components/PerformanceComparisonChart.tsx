import { useCallback, useMemo } from "react";
import type { AlignedPerformanceMonth } from "@features/finance/application";
import {
  BoeltechComboChart,
  ChartCard,
  chartColor,
  findPeakCategory,
  type ComboChartSeries,
  type ComboChartTooltipArgs,
} from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrencyCompact } from "@shared/utils/formatMxCurrency";
import { formatMonthPeriodAxis } from "@shared/utils/monthPeriod";
import {
  PERFORMANCE_CHART_SYNC_ID,
  buildPerformanceAmountSeries,
  buildPerformanceMarginSeries,
} from "../config/financeChartConfig";
import { financeCopy } from "../copy";
import {
  buildPerformanceChartRows,
  formatPerformanceMonth,
} from "../utils/monthlyPerformanceFormat";
import { PerformanceTooltipContent } from "./PerformanceTooltipContent";

const copy = financeCopy.performance.chart;

/** Mismo ancho de eje en ambas gráficas para que los meses queden alineados. */
const Y_AXIS_WIDTH = 64;

function LegendItem({ series }: { series: ComboChartSeries }) {
  const opacity = series.fillOpacity ?? 1;
  return (
    <li className="flex items-center gap-1.5">
      {series.type === "line" ? (
        <span
          aria-hidden
          className={cn(
            "w-4 shrink-0 border-t-2",
            series.strokeDasharray ? "border-dashed" : "border-solid",
          )}
          style={{ borderColor: chartColor(series.token), opacity }}
        />
      ) : (
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: chartColor(series.token), opacity }}
        />
      )}
      <span>{series.label}</span>
    </li>
  );
}

function PerformanceLegend({
  series,
  ariaLabel,
}: {
  series: ComboChartSeries[];
  ariaLabel: string;
}) {
  return (
    <ul
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
    >
      {series.map((item) => (
        <LegendItem key={item.dataKey} series={item} />
      ))}
    </ul>
  );
}

interface PerformanceComparisonChartProps {
  months: AlignedPerformanceMonth[];
  compare: boolean;
  isLoading: boolean;
}

export function PerformanceComparisonChart({
  months,
  compare,
  isLoading,
}: PerformanceComparisonChartProps) {
  const rows = useMemo(() => buildPerformanceChartRows(months), [months]);
  /** Mismos ticks en ambas gráficas: el mes en curso (último) y el pico de ingreso. */
  const priorityPeriods = useMemo(() => {
    const peak = findPeakCategory(rows, "period", ["revenue"]);
    return peak ? [peak] : [];
  }, [rows]);
  const monthByPeriod = useMemo(
    () => new Map(months.map((month) => [month.period, month])),
    [months],
  );
  const amountSeries = useMemo(() => buildPerformanceAmountSeries(compare), [compare]);
  const marginSeries = useMemo(() => buildPerformanceMarginSeries(compare), [compare]);
  const inProgressMonth = months.find((month) => month.isInProgress);

  const renderTooltip = useCallback(
    ({ row }: ComboChartTooltipArgs) => {
      const month = monthByPeriod.get(String(row.period));
      return month ? <PerformanceTooltipContent month={month} compare={compare} /> : null;
    },
    [compare, monthByPeriod],
  );

  return (
    <ChartCard
      title={copy.title}
      description={compare ? copy.descriptionCompare : copy.description}
      isLoading={isLoading}
      aria-label={copy.ariaLabel}
      footer={
        <div className="space-y-1 text-xs text-muted-foreground">
          {inProgressMonth ? (
            <p>{copy.inProgressNote(formatPerformanceMonth(inProgressMonth.period))}</p>
          ) : null}
          <p>{financeCopy.performance.operationalNote}</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <PerformanceLegend
            series={amountSeries}
            ariaLabel={copy.amountsLegendAriaLabel}
          />
          <BoeltechComboChart
            data={rows}
            series={amountSeries}
            xAxisKey="period"
            xAxisTickFormatter={formatMonthPeriodAxis}
            xAxisPriorityValues={priorityPeriods}
            height={300}
            showLegend={false}
            yAxisWidth={Y_AXIS_WIDTH}
            yAxisTickFormatter={formatMxCurrencyCompact}
            syncId={PERFORMANCE_CHART_SYNC_ID}
            renderTooltip={renderTooltip}
          />
        </div>
        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{copy.marginHeading}</p>
            <PerformanceLegend
              series={marginSeries}
              ariaLabel={copy.marginLegendAriaLabel}
            />
          </div>
          <BoeltechComboChart
            data={rows}
            series={marginSeries}
            xAxisKey="period"
            xAxisTickFormatter={formatMonthPeriodAxis}
            xAxisPriorityValues={priorityPeriods}
            height={170}
            showLegend={false}
            yAxisWidth={Y_AXIS_WIDTH}
            yAxisTickFormatter={(value) => `${value}%`}
            syncId={PERFORMANCE_CHART_SYNC_ID}
            renderTooltip={renderTooltip}
          />
        </div>
      </div>
    </ChartCard>
  );
}
