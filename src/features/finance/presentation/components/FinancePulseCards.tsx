import { Link } from "react-router-dom";
import { computeMarginPct } from "@features/finance/application";
import type { FinanceSummary, PeriodFinancials } from "@features/finance/domain";
import { Button } from "@shared/ui/button";
import { MetricTrendCard } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import { formatPct } from "../utils/monthlyPerformanceFormat";
import { pulseOperationalTotals } from "../utils/financePulse";

const copy = financeCopy.pulse;

export interface FinancePulseCardsProps {
  summary?: FinanceSummary;
  /** Mes en curso de `performance/monthly` (`operational_margin` + `actual_revenue`). */
  pulseMonth?: PeriodFinancials | null;
  isSummaryLoading?: boolean;
  isPerformanceLoading?: boolean;
  /** Deep link a Análisis → Mes a mes (TD9). */
  analysisHref: string;
  /** Drill Por cobrar → Cobros (TD9). */
  receivableHref?: string;
  /** Drill Vencido → Cobros (TD9). */
  overdueHref?: string;
  /** Rótulo del mes en curso, p. ej. `oct 2026`. */
  periodLabel?: string | null;
}

function marginTone(value: number): "success" | "destructive" {
  return value < 0 ? "destructive" : "success";
}

export function FinancePulseCards({
  summary,
  pulseMonth,
  isSummaryLoading = false,
  isPerformanceLoading = false,
  analysisHref,
  receivableHref,
  overdueHref,
  periodLabel,
}: FinancePulseCardsProps) {
  const { revenue, operationalMargin, hasOperationalMargin } =
    pulseOperationalTotals(pulseMonth);
  const marginPct = hasOperationalMargin
    ? computeMarginPct(operationalMargin, revenue)
    : null;
  const performanceLoading = isPerformanceLoading;
  const summaryLoading = isSummaryLoading;

  const cards = [
    {
      key: "revenue",
      title: copy.revenue.title,
      subtitle: copy.revenue.description,
      value: pulseMonth ? formatMxCurrency(revenue) : "—",
      tone: "primary" as const,
      cardLoading: performanceLoading,
      href: undefined as string | undefined,
      linkAria: undefined as string | undefined,
    },
    {
      key: "operationalMargin",
      title: copy.operationalMargin.title,
      subtitle:
        marginPct != null
          ? `${copy.operationalMargin.description} · ${copy.operationalMargin.shareOfRevenue(formatPct(marginPct))}`
          : copy.operationalMargin.description,
      value:
        pulseMonth && hasOperationalMargin
          ? formatMxCurrency(operationalMargin)
          : "—",
      tone: marginTone(operationalMargin),
      cardLoading: performanceLoading,
      href: undefined,
      linkAria: undefined,
    },
    {
      key: "totalReceivable",
      title: copy.receivable.title,
      subtitle: copy.receivable.description,
      value: summary ? formatMxCurrency(summary.totalReceivable) : "—",
      tone: "warning" as const,
      cardLoading: summaryLoading,
      href: receivableHref,
      linkAria: copy.receivableLinkAria,
    },
    {
      key: "totalOverdue",
      title: copy.overdue.title,
      subtitle: copy.overdue.description,
      value: summary ? formatMxCurrency(summary.totalOverdue) : "—",
      tone: "destructive" as const,
      cardLoading: summaryLoading,
      href: overdueHref,
      linkAria: copy.overdueLinkAria,
    },
  ];

  return (
    <section aria-label={copy.ariaLabel} className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          {periodLabel && !performanceLoading ? (
            <p className="text-xs text-muted-foreground">
              {copy.periodNote(periodLabel)}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground" role="note">
            {copy.basisLine}
          </p>
        </div>
        <Button asChild type="button" size="sm" variant="outline">
          <Link to={analysisHref}>{copy.ctaMonthOverMonth}</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const metric = (
            <MetricTrendCard
              title={card.title}
              subtitle={card.subtitle}
              value={card.value}
              tone={card.tone}
              isLoading={card.cardLoading}
              className={cn(
                "h-full w-full",
                card.href && "transition-shadow hover:shadow-md",
              )}
            />
          );
          if (!card.href) {
            return (
              <div key={card.key} className="min-h-0 min-w-0 h-full w-full">
                {metric}
              </div>
            );
          }
          return (
            <Link
              key={card.key}
              to={card.href}
              aria-label={card.linkAria}
              className="flex h-full w-full min-h-0 min-w-0 flex-col rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {metric}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
