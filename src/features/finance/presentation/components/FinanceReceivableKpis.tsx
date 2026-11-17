import type { AgingSummary, FinanceSummary } from "@features/finance/domain";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import { FINANCE_CHANNEL_CSS } from "../config/financeChartConfig";

export interface FinanceReceivableKpisProps {
  summary?: FinanceSummary;
  agingSummary?: AgingSummary;
  isSummaryLoading?: boolean;
  isAgingLoading?: boolean;
  /** Clientes con vencido (conteo derivado del statement). */
  overdueClientCount?: number;
  periodLabel?: string | null;
}

function ChannelSplitBar({
  withInvoice,
  withoutInvoice,
  ariaLabel,
}: {
  withInvoice: number;
  withoutInvoice: number;
  ariaLabel: string;
}) {
  const total = withInvoice + withoutInvoice;
  const withPct = total > 0 ? (withInvoice / total) * 100 : 0;
  const withoutPct = total > 0 ? (withoutInvoice / total) * 100 : 0;
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={ariaLabel}
    >
      {withPct > 0 ? (
        <span
          className="h-full"
          style={{
            width: `${withPct}%`,
            background: FINANCE_CHANNEL_CSS.with,
          }}
        />
      ) : null}
      {withoutPct > 0 ? (
        <span
          className="h-full"
          style={{
            width: `${withoutPct}%`,
            background: FINANCE_CHANNEL_CSS.without,
          }}
        />
      ) : null}
    </div>
  );
}

function ChannelLegend({
  withInvoice,
  withoutInvoice,
}: {
  withInvoice: number;
  withoutInvoice: number;
}) {
  const copy = financeCopy.pulse;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ background: FINANCE_CHANNEL_CSS.with }}
          aria-hidden
        />
        {copy.withInvoice}{" "}
        <b className="font-medium tabular-nums text-foreground">
          {formatMxCurrency(withInvoice)}
        </b>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ background: FINANCE_CHANNEL_CSS.without }}
          aria-hidden
        />
        {copy.withoutInvoice}{" "}
        <b className="font-medium tabular-nums text-foreground">
          {formatMxCurrency(withoutInvoice)}
        </b>
      </span>
    </div>
  );
}

function resolveChannelAmounts(
  summary: FinanceSummary | undefined,
  key: "receivable" | "overdue" | "collectedThisMonth",
): { withInvoice: number; withoutInvoice: number } {
  const ch = summary?.byChannel;
  if (!ch) {
    const fallback =
      key === "receivable"
        ? (summary?.totalReceivable ?? 0)
        : key === "overdue"
          ? (summary?.totalOverdue ?? 0)
          : (summary?.collectedThisMonth ?? 0);
    return { withInvoice: fallback, withoutInvoice: 0 };
  }
  return {
    withInvoice: ch.withInvoice[key],
    withoutInvoice: ch.withoutInvoice[key],
  };
}

function formatDsoDays(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${Math.round(value)} ${financeCopy.pulse.daysSuffix}`;
}

/**
 * Fila K1 — Por cobrar · Vencido · Cobrado este mes · DSO blended.
 */
export function FinanceReceivableKpis({
  summary,
  agingSummary,
  isSummaryLoading = false,
  isAgingLoading = false,
  overdueClientCount = 0,
  periodLabel,
}: FinanceReceivableKpisProps) {
  const copy = financeCopy.pulse;
  const receivable = resolveChannelAmounts(summary, "receivable");
  const overdue = resolveChannelAmounts(summary, "overdue");
  const collected = resolveChannelAmounts(summary, "collectedThisMonth");
  const dso = agingSummary?.dso30d;
  const blendedLabel = formatDsoDays(dso?.blended ?? dso?.invoiced ?? null);
  const dsoBreakdown = copy.dso.breakdown(
    formatDsoDays(dso?.invoiced),
    formatDsoDays(dso?.operational),
  );

  const cards = [
    {
      key: "receivable",
      title: copy.receivable.title,
      value: summary ? formatMxCurrency(summary.totalReceivable) : "—",
      loading: isSummaryLoading,
      warn: false,
      body: summary ? (
        <div className="space-y-2">
          <ChannelSplitBar
            withInvoice={receivable.withInvoice}
            withoutInvoice={receivable.withoutInvoice}
            ariaLabel={`${copy.withInvoice} / ${copy.withoutInvoice}`}
          />
          <ChannelLegend
            withInvoice={receivable.withInvoice}
            withoutInvoice={receivable.withoutInvoice}
          />
        </div>
      ) : null,
    },
    {
      key: "overdue",
      title: copy.overdue.title,
      value: summary ? formatMxCurrency(summary.totalOverdue) : "—",
      loading: isSummaryLoading,
      warn: (summary?.totalOverdue ?? 0) > 0,
      caption: copy.overdue.caption(overdueClientCount),
      body: summary ? (
        <ChannelLegend
          withInvoice={overdue.withInvoice}
          withoutInvoice={overdue.withoutInvoice}
        />
      ) : null,
    },
    {
      key: "collected",
      title: copy.collected.title,
      value: summary ? formatMxCurrency(summary.collectedThisMonth) : "—",
      loading: isSummaryLoading,
      warn: false,
      caption: periodLabel
        ? copy.collected.caption(periodLabel)
        : undefined,
      body: summary ? (
        <ChannelLegend
          withInvoice={collected.withInvoice}
          withoutInvoice={collected.withoutInvoice}
        />
      ) : null,
    },
    {
      key: "dso",
      title: copy.dso.title,
      value: blendedLabel ?? "—",
      loading: isAgingLoading,
      warn: false,
      caption: copy.dso.caption,
      body:
        dsoBreakdown && !isAgingLoading ? (
          <p className="text-xs text-muted-foreground">{dsoBreakdown}</p>
        ) : null,
    },
  ];

  return (
    <section aria-label={copy.ariaLabel} className="space-y-2">
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className={cn(
              "flex min-h-0 flex-col gap-2 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm",
              card.warn && "border-warning/40",
            )}
          >
            <p className="text-sm font-medium text-muted-foreground">
              {card.title}
            </p>
            {card.loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p
                className={cn(
                  "text-2xl font-semibold tabular-nums tracking-tight",
                  card.warn ? "text-warning" : "text-foreground",
                )}
              >
                {card.value}
              </p>
            )}
            {"caption" in card && card.caption ? (
              <p className="text-xs text-muted-foreground">{card.caption}</p>
            ) : null}
            {card.body}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground" role="note">
        {financeCopy.page.hub.basesLine}
      </p>
    </section>
  );
}
