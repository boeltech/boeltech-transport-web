/* eslint-disable react-refresh/only-export-components */
import type { TooltipProps } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  ChartTooltipContent,
  type ChartTooltipContentProps,
} from "@shared/ui/data-display/charts/ChartTooltip";
import { dashboardCopy } from "../copy/dashboardCopy";
import { formatVarianceAmount, formatVariancePct } from "../utils/financialComparisonHelpers";

function findEntryValue(
  payload: Payload<ValueType, NameType>[] | undefined,
  dataKey: string,
): number {
  const entry = payload?.find((p) => String(p.dataKey) === dataKey);
  const value = entry?.value;
  return typeof value === "number" ? value : Number(value) || 0;
}

export function FinancialComparisonTooltip(
  props: ChartTooltipContentProps,
) {
  const { active, payload, label, series, valueFormatter } = props;
  if (!active || !payload?.length) return null;

  const budgeted = findEntryValue(payload, "budgeted");
  const actual = findEntryValue(payload, "actual");
  const variance = actual - budgeted;

  return (
    <div className="space-y-0">
      <ChartTooltipContent
        active={active}
        payload={payload}
        label={label}
        series={series}
        valueFormatter={valueFormatter}
      />
      <div
        className={cn(
          "relative z-50 -mt-1 rounded-b-md border border-t-0 bg-popover px-3 py-1.5 text-xs text-muted-foreground",
        )}
      >
        <span className="font-medium text-popover-foreground">
          {dashboardCopy.financialComparison.tooltip.variance}:{" "}
        </span>
        {formatVarianceAmount(variance)} ({formatVariancePct(budgeted, actual)})
      </div>
    </div>
  );
}

export function createFinancialComparisonTooltip(
  series: ChartTooltipContentProps["series"],
  valueFormatter?: (value: ValueType, dataKey: string) => string,
) {
  return function Renderer(props: TooltipProps<ValueType, NameType>) {
    return (
      <FinancialComparisonTooltip
        {...props}
        series={series}
        valueFormatter={(value, dataKey) =>
          valueFormatter
            ? valueFormatter(value, dataKey)
            : formatMxCurrency(typeof value === "number" ? value : Number(value) || 0)
        }
      />
    );
  };
}
