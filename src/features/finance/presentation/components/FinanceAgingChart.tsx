import { useMemo } from "react";
import { BoeltechBarChart, ChartCard } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import type { AgingSummary } from "@features/finance/domain";
import {
  FINANCE_AGING_BUCKET_KEYS,
  FINANCE_AGING_SERIES,
} from "../config/financeChartConfig";
import { financeCopy } from "../copy";
import { financeCurrencyValueFormatter } from "../utils/financeChartHelpers";

interface FinanceAgingChartProps {
  agingSummary?: AgingSummary;
  isLoading?: boolean;
}

export function FinanceAgingChart({
  agingSummary,
  isLoading = false,
}: FinanceAgingChartProps) {
  const chartData = useMemo(
    () =>
      agingSummary
        ? FINANCE_AGING_BUCKET_KEYS.map((key) => ({
            label: financeCopy.summary.agingBuckets[key],
            balance: agingSummary.buckets[key].totalBalance,
          }))
        : [],
    [agingSummary],
  );

  const dsoBadge = isLoading ? (
    <Skeleton className="h-8 w-24" />
  ) : (
    <div className="rounded-md border bg-muted/40 px-3 py-1.5 text-right">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {financeCopy.summary.dsoTitle}
      </p>
      <p className="text-sm font-semibold tabular-nums">
        {agingSummary?.dso30d ?? 0} {financeCopy.summary.daysSuffix}
      </p>
    </div>
  );

  return (
    <ChartCard
      title={financeCopy.summary.charts.agingBuckets.title}
      description={financeCopy.summary.charts.agingBuckets.description}
      isLoading={isLoading}
      aria-label="Gráfico de barras: aging de cobranza por bucket"
      tools={dsoBadge}
      footer={
        agingSummary ? (
          <p className="text-xs text-muted-foreground">
            {financeCopy.summary.charts.agingBuckets.footer(
              financeCurrencyValueFormatter(agingSummary.totalReceivable),
            )}
          </p>
        ) : undefined
      }
    >
      <BoeltechBarChart
        data={chartData}
        series={FINANCE_AGING_SERIES}
        valueFormatter={financeCurrencyValueFormatter}
      />
    </ChartCard>
  );
}
