import type { ChartSeries, ChartToken } from "@shared/ui/data-display";
import type { AgingBucket, ProfitabilityStatus } from "@features/finance/domain";
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

export const FINANCE_INVOICE_STATUS_CHART_CONFIG = [
  { key: "draft" as const, token: "neutral" as const, copyKey: "draft" as const },
  { key: "stamped" as const, token: "chart-1" as const, copyKey: "stamped" as const },
  {
    key: "cancellationPending" as const,
    token: "warning" as const,
    copyKey: "cancellation_pending" as const,
  },
  { key: "cancelled" as const, token: "destructive" as const, copyKey: "cancelled" as const },
] as const;

export const FINANCE_RECEIVABLE_AMOUNT_SERIES: ChartSeries[] = [
  {
    dataKey: "value",
    label: financeCopy.summary.charts.amounts.receivable,
    token: "warning",
  },
  {
    dataKey: "value",
    label: financeCopy.summary.charts.amounts.collected,
    token: "success",
  },
  {
    dataKey: "value",
    label: financeCopy.summary.charts.amounts.overdue,
    token: "destructive",
  },
];

export const FINANCE_INCOME_SERIES: ChartSeries[] = [
  {
    dataKey: "collected",
    label: financeCopy.summary.charts.amounts.collected,
    token: "success",
  },
];

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

export function buildInvoiceStatusChartSeries(): ChartSeries[] {
  return FINANCE_INVOICE_STATUS_CHART_CONFIG.map(({ token, copyKey }) => ({
    dataKey: "value",
    label: financeCopy.invoices.statusLabels[copyKey],
    token,
  }));
}

export function buildInvoiceStatusMonthChartSeries(): ChartSeries[] {
  return FINANCE_INVOICE_STATUS_CHART_CONFIG.map(({ key, token, copyKey }) => ({
    dataKey: key,
    label: financeCopy.invoices.statusLabels[copyKey],
    token,
  }));
}

export const FINANCE_PROFITABILITY_STATUS_ORDER: ProfitabilityStatus[] = [
  "high",
  "medium",
  "low",
  "breakeven",
  "loss",
];

export const FINANCE_PROFITABILITY_STATUS_TOKEN: Record<
  ProfitabilityStatus,
  ChartToken
> = {
  high: "success",
  medium: "chart-1",
  low: "warning",
  breakeven: "info",
  loss: "destructive",
};

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

export function buildProfitabilityStatusChartSeries(): ChartSeries[] {
  return FINANCE_PROFITABILITY_STATUS_ORDER.map((status) => ({
    dataKey: "value",
    label: financeCopy.profitability.statuses[status],
    token: FINANCE_PROFITABILITY_STATUS_TOKEN[status],
  }));
}
