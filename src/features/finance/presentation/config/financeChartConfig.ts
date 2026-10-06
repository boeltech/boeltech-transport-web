import type {
  ChartSeries,
  ChartToken,
  ComboChartSeries,
} from "@shared/ui/data-display";
import type { AgingBucket } from "@features/finance/domain";
import { financeCopy } from "../copy";

export const FINANCE_EXPENSE_CHART_TOKENS: ChartToken[] = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
];

export function pickFinanceExpenseChartToken(index: number): ChartToken {
  return FINANCE_EXPENSE_CHART_TOKENS[index % FINANCE_EXPENSE_CHART_TOKENS.length]!;
}

export function buildExpenseCategoryChartSeries(
  categories: string[],
  labelFn: (category: string) => string,
): ChartSeries[] {
  return categories.map((category, index) => ({
    dataKey: category,
    label: labelFn(category),
    token: pickFinanceExpenseChartToken(index),
  }));
}

export const FINANCE_AGING_BUCKET_KEYS: AgingBucket[] = [
  "0-30",
  "31-60",
  "61-90",
  "90+",
];

export const FINANCE_AGING_SERIES: ChartSeries[] = [
  {
    dataKey: "balance",
    label: financeCopy.summary.charts.agingBuckets.balanceLabel,
    token: "chart-1",
  },
];

export const FINANCE_PROFITABILITY_MONTHLY_SERIES: ChartSeries[] = [
  {
    dataKey: "revenue",
    label: financeCopy.profitability.table.revenue,
    token: "chart-1",
  },
  {
    dataKey: "actual",
    label: financeCopy.profitability.table.actualTotal,
    token: "chart-3",
  },
];

export const FINANCE_PROFITABILITY_COMBO_SERIES = [
  {
    dataKey: "revenue",
    label: financeCopy.profitability.table.revenue,
    token: "chart-1" as const,
    type: "bar" as const,
  },
  {
    dataKey: "actual",
    label: financeCopy.profitability.table.actualTotal,
    token: "chart-3" as const,
    type: "bar" as const,
  },
  {
    dataKey: "marginPct",
    label: financeCopy.profitability.table.marginPct,
    token: "success" as const,
    type: "line" as const,
    yAxisId: "right" as const,
  },
];

/** Vista Rendimiento: el año anterior se dibuja con el mismo token, atenuado. */
export const PERFORMANCE_PREVIOUS_OPACITY = 0.35;

export const PERFORMANCE_CHART_SYNC_ID = "finance-performance-monthly";

const performanceLegend = financeCopy.performance.chart.legend;

function previousLabel(label: string): string {
  return `${label} ${performanceLegend.previousSuffix}`;
}

/** Orden por mes: año anterior junto al actual de cada concepto. */
export function buildPerformanceAmountSeries(compare: boolean): ComboChartSeries[] {
  const revenue: ComboChartSeries = {
    dataKey: "revenue",
    label: performanceLegend.revenue,
    token: "chart-1",
    type: "bar",
  };
  const cost: ComboChartSeries = {
    dataKey: "cost",
    label: performanceLegend.cost,
    token: "chart-3",
    type: "bar",
  };
  if (!compare) return [revenue, cost];
  return [
    {
      ...revenue,
      dataKey: "previousRevenue",
      label: previousLabel(revenue.label),
      fillOpacity: PERFORMANCE_PREVIOUS_OPACITY,
    },
    revenue,
    {
      ...cost,
      dataKey: "previousCost",
      label: previousLabel(cost.label),
      fillOpacity: PERFORMANCE_PREVIOUS_OPACITY,
    },
    cost,
  ];
}

export function buildPerformanceMarginSeries(compare: boolean): ComboChartSeries[] {
  const marginPct: ComboChartSeries = {
    dataKey: "marginPct",
    label: performanceLegend.marginPct,
    token: "success",
    type: "line",
  };
  if (!compare) return [marginPct];
  return [
    {
      ...marginPct,
      dataKey: "previousMarginPct",
      label: previousLabel(marginPct.label),
      fillOpacity: 0.6,
      strokeDasharray: "6 4",
    },
    marginPct,
  ];
}

export const FINANCE_BUCKET_BAR_SEGMENT_KEYS = [
  { key: "realized", token: "success" as const },
  { key: "pipeline", token: "info" as const },
  { key: "in_progress", token: "warning" as const },
  { key: "cancellation_loss", token: "destructive" as const },
] as const;

export function buildFinanceBucketBarSegments(values: {
  realized: number;
  pipeline: number;
  inProgress: number;
  cancellationLoss: number;
}) {
  const map: Record<string, number> = {
    realized: values.realized,
    pipeline: values.pipeline,
    in_progress: values.inProgress,
    cancellation_loss: values.cancellationLoss,
  };
  return FINANCE_BUCKET_BAR_SEGMENT_KEYS.map(({ key, token }) => ({
    key,
    label: financeCopy.profitability.buckets[key],
    value: map[key] ?? 0,
    token,
  }));
}