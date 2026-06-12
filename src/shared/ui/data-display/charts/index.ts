/**
 * @shared/ui/data-display/charts
 *
 * Barrera de import: features consumen wrappers Boeltech*Chart desde
 * @shared/ui/data-display — nunca importan recharts directo.
 */

export { chartColor, CHART_AXIS_LINE, CHART_AXIS_TICK, CHART_GRID } from "./chartTokens";
export type { ChartSeries, ChartToken } from "./chartTokens";

export { ChartContainer } from "./ChartContainer";
export type { ChartContainerProps } from "./ChartContainer";

export { ChartTooltipContent } from "./ChartTooltip";
export type { ChartTooltipContentProps, ChartTooltipProps } from "./ChartTooltip";

export { createChartTooltip } from "./createChartTooltip";

export { ChartLegend } from "./ChartLegend";
export type { ChartLegendProps } from "./ChartLegend";

export { BoeltechLineChart } from "./BoeltechLineChart";
export type { BoeltechLineChartProps } from "./BoeltechLineChart";

export { BoeltechBarChart } from "./BoeltechBarChart";
export type { BoeltechBarChartProps } from "./BoeltechBarChart";

export { BoeltechAreaChart } from "./BoeltechAreaChart";
export type { BoeltechAreaChartProps } from "./BoeltechAreaChart";

export { BoeltechDonutChart } from "./BoeltechDonutChart";
export type { BoeltechDonutChartProps } from "./BoeltechDonutChart";

export { Sparkline } from "./Sparkline";
export type { SparklineProps } from "./Sparkline";

export { BoeltechCategoryBar } from "./BoeltechCategoryBar";
export type {
  BoeltechCategoryBarProps,
  CategoryBarSegment,
} from "./BoeltechCategoryBar";

export { BoeltechBarList } from "./BoeltechBarList";
export type { BoeltechBarListProps, BarListItem } from "./BoeltechBarList";

export { BoeltechComboChart } from "./BoeltechComboChart";
export type {
  BoeltechComboChartProps,
  ComboChartSeries,
} from "./BoeltechComboChart";
