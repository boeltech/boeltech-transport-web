import {
  computeMarginPct,
  computeVariation,
  type AlignedPerformanceMonth,
} from "@features/finance/application";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import {
  formatPct,
  formatPerformanceMonth,
  formatPerformanceMonthWithStatus,
  formatPerformanceYear,
  formatVariationDetail,
} from "../utils/monthlyPerformanceFormat";

const copy = financeCopy.performance.tooltip;

interface PerformanceTooltipContentProps {
  month: AlignedPerformanceMonth;
  compare: boolean;
}

export function PerformanceTooltipContent({
  month,
  compare: compareRequested,
}: PerformanceTooltipContentProps) {
  const { current, previous } = month;
  /** El mes en curso nunca se compara: solo el año actual + nota. */
  const compare = compareRequested && !month.isInProgress;
  const showInProgressNote = compareRequested && month.isInProgress;
  /** Mes cerrado provisional: aviso en tooltip; el mes en curso solo lleva N5. */
  const showProvisionalNote =
    current.provisional && !month.isInProgress;
  const amountRows = [
    { key: "revenue", label: copy.revenue, cur: current.actualRevenue, prev: previous.actualRevenue },
    { key: "cost", label: copy.cost, cur: current.actualCost, prev: previous.actualCost },
    { key: "margin", label: copy.margin, cur: current.actualMargin, prev: previous.actualMargin },
  ];
  const currentMarginPct = computeMarginPct(current.actualMargin, current.actualRevenue);
  const previousMarginPct = computeMarginPct(previous.actualMargin, previous.actualRevenue);

  return (
    <div className="min-w-[220px] space-y-1.5">
      <p className="font-medium">
        {formatPerformanceMonthWithStatus(month.period, month.isInProgress)}
      </p>
      <table className="w-full tabular-nums [&_td]:py-0.5 [&_td]:pl-4 [&_th]:py-0.5 [&_thead_th+th]:pl-4">
        {compare ? (
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-normal">{copy.metric}</th>
              <th className="text-right font-normal">
                {formatPerformanceYear(current.period)}
              </th>
              <th className="text-right font-normal">
                {formatPerformanceYear(previous.period)}
              </th>
              <th className="text-right font-normal">{copy.delta}</th>
            </tr>
          </thead>
        ) : null}
        <tbody>
          {amountRows.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="text-left font-normal text-muted-foreground">
                {row.label}
              </th>
              <td className="text-right font-medium">{formatMxCurrency(row.cur)}</td>
              {compare ? (
                <>
                  <td className="text-right text-muted-foreground">
                    {formatMxCurrency(row.prev)}
                  </td>
                  <td className="text-right">
                    {formatVariationDetail(computeVariation(row.cur, row.prev))}
                  </td>
                </>
              ) : null}
            </tr>
          ))}
          <tr>
            <th scope="row" className="text-left font-normal text-muted-foreground">
              {copy.marginPct}
            </th>
            <td className="text-right font-medium">{formatPct(currentMarginPct)}</td>
            {compare ? (
              <>
                <td className="text-right text-muted-foreground">
                  {formatPct(previousMarginPct)}
                </td>
                <td />
              </>
            ) : null}
          </tr>
        </tbody>
      </table>
      {showInProgressNote ? (
        <p className="max-w-[240px] text-xs text-muted-foreground">
          {copy.inProgressNote(formatPerformanceMonth(previous.period))}
        </p>
      ) : null}
      {showProvisionalNote ? (
        <p className="max-w-[240px] text-xs text-muted-foreground">
          {copy.provisionalNote(formatPerformanceMonth(month.period))}
        </p>
      ) : null}
    </div>
  );
}
