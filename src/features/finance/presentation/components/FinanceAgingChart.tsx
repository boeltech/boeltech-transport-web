import { useMemo, type ReactNode } from "react";
import { ChartCard } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type {
  AgingBucket,
  AgingSummary,
  OperationalAgingBucket,
} from "@features/finance/domain";
import { financeCopy } from "../copy";
import { FINANCE_CHANNEL_CSS } from "../config/financeChartConfig";

interface FinanceAgingChartProps {
  agingSummary?: AgingSummary;
  isLoading?: boolean;
  exportAction?: ReactNode;
}

type AgingRowKey = OperationalAgingBucket;

const OVERDUE_KEYS: ReadonlySet<AgingBucket> = new Set([
  "31-60",
  "61-90",
  "90+",
]);

const ROW_ORDER: AgingRowKey[] = [
  "upcoming",
  "0-30",
  "31-60",
  "61-90",
  "90+",
];

function bucketLabel(key: AgingRowKey): string {
  return financeCopy.summary.agingBuckets[key];
}

/**
 * Antigüedad apilada por canal (K5) — barras horizontales + tramo Por salir.
 */
export function FinanceAgingChart({
  agingSummary,
  isLoading = false,
  exportAction,
}: FinanceAgingChartProps) {
  const copy = financeCopy.summary.charts.agingBuckets;

  const rows = useMemo(() => {
    if (!agingSummary) return [];
    const withInv = agingSummary.byChannel?.withInvoice.buckets;
    const withoutInv = agingSummary.byChannel?.withoutInvoice.buckets;
    return ROW_ORDER.map((key) => {
      const withBalance =
        key === "upcoming"
          ? 0
          : (withInv?.[key]?.totalBalance ??
            agingSummary.buckets[key]?.totalBalance ??
            0);
      const withoutBalance =
        withoutInv?.[key]?.totalBalance ??
        (key === "upcoming" ? 0 : 0);
      const total = withBalance + withoutBalance;
      return {
        key,
        label: bucketLabel(key),
        withBalance,
        withoutBalance,
        total,
        overdue: key !== "upcoming" && OVERDUE_KEYS.has(key),
      };
    }).filter(
      (row) => row.key !== "upcoming" || row.withoutBalance > 0.009,
    );
  }, [agingSummary]);

  const maxTotal = useMemo(
    () => Math.max(1, ...rows.map((r) => r.total)),
    [rows],
  );

  return (
    <ChartCard
      title={copy.title}
      description={copy.description}
      isLoading={isLoading}
      aria-label="Antigüedad de saldos por canal"
      tools={exportAction}
      footer={
        agingSummary ? (
          <p className="text-xs text-muted-foreground">{copy.footer}</p>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const withPct = (row.withBalance / maxTotal) * 100;
            const withoutPct = (row.withoutBalance / maxTotal) * 100;
            return (
              <div
                key={row.key}
                className={cn(
                  "grid grid-cols-[7.5rem_1fr_auto] items-center gap-3",
                  row.overdue && "text-warning",
                )}
              >
                <span
                  className={cn(
                    "text-sm text-muted-foreground",
                    row.overdue && "text-warning",
                  )}
                >
                  {row.label}
                </span>
                <div className="flex h-3 min-w-0 overflow-hidden rounded-sm bg-muted">
                  {withPct > 0 ? (
                    <span
                      className="h-full"
                      style={{
                        width: `${withPct}%`,
                        background: row.overdue
                          ? FINANCE_CHANNEL_CSS.overdueWith
                          : FINANCE_CHANNEL_CSS.with,
                      }}
                    />
                  ) : null}
                  {withoutPct > 0 ? (
                    <span
                      className="h-full"
                      style={{
                        width: `${withoutPct}%`,
                        background: row.overdue
                          ? FINANCE_CHANNEL_CSS.overdueWithout
                          : FINANCE_CHANNEL_CSS.without,
                      }}
                    />
                  ) : null}
                </div>
                <span className="min-w-[7.5rem] text-right text-sm tabular-nums">
                  <span className="font-medium">
                    {formatMxCurrency(row.total)}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {formatMxCurrency(row.withBalance).replace("$", "")} ·{" "}
                    {formatMxCurrency(row.withoutBalance).replace("$", "")}
                  </span>
                </span>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: FINANCE_CHANNEL_CSS.with }}
                aria-hidden
              />
              {copy.withInvoice}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: FINANCE_CHANNEL_CSS.without }}
                aria-hidden
              />
              {copy.withoutInvoice}
            </span>
            <span className="text-muted-foreground/80">{copy.figuresHint}</span>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
