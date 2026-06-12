/**
 * Factory para Tooltip de Recharts con tokens DS.
 */

import type { TooltipProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  ChartTooltipContent,
  type ChartTooltipProps,
} from "./ChartTooltip";

export function createChartTooltip({
  series,
  valueFormatter,
}: ChartTooltipProps = {}) {
  return function ChartTooltipRenderer(
    props: TooltipProps<ValueType, NameType>,
  ) {
    return (
      <ChartTooltipContent
        {...props}
        series={series}
        valueFormatter={valueFormatter}
      />
    );
  };
}
