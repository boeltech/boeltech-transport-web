import { useMemo, type ReactNode } from "react";
import { Banknote, Receipt } from "lucide-react";
import { MetricTrendCard, Sparkline, StatCard } from "@shared/ui/data-display";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { FinanceSummary } from "@features/finance/domain";
import { financeCopy } from "../copy";

export type FinanceSummaryCardKey =
  | "totalReceivable"
  | "collectedThisMonth"
  | "totalOverdue"
  | "expensesThisMonth";

const DEFAULT_KEYS: FinanceSummaryCardKey[] = [
  "totalReceivable",
  "collectedThisMonth",
  "totalOverdue",
  "expensesThisMonth",
];

interface FinanceSummaryCardsProps {
  summary?: FinanceSummary;
  isLoading?: boolean;
  collectedTrendData?: { value: number }[];
  collectedTrendLoading?: boolean;
  /** Subconjunto de KPI (p. ej. Cobrado + Gasto bajo el Pulse). */
  keys?: readonly FinanceSummaryCardKey[];
  /**
   * `stat` = StatCard quieto (secundario bajo Pulse).
   * `trend` = MetricTrendCard (histórico / franja completa).
   */
  density?: "trend" | "stat";
  /** Título de sección cuando density=stat (p. ej. Contexto del mes). */
  sectionTitle?: string;
}

const STAT_ICONS: Partial<Record<FinanceSummaryCardKey, ReactNode>> = {
  collectedThisMonth: <Banknote className="h-4 w-4" aria-hidden />,
  expensesThisMonth: <Receipt className="h-4 w-4" aria-hidden />,
  totalReceivable: <Banknote className="h-4 w-4" aria-hidden />,
  totalOverdue: <Banknote className="h-4 w-4" aria-hidden />,
};

export function FinanceSummaryCards({
  summary,
  isLoading,
  collectedTrendData,
  collectedTrendLoading = false,
  keys = DEFAULT_KEYS,
  density = "trend",
  sectionTitle,
}: FinanceSummaryCardsProps) {
  const collectedSparkline = useMemo(() => {
    if (!collectedTrendData || collectedTrendData.length < 2) return undefined;
    return <Sparkline data={collectedTrendData} token="success" height={40} />;
  }, [collectedTrendData]);

  const allCards = [
    {
      key: "totalReceivable" as const,
      title: financeCopy.kpis.totalReceivable.title,
      subtitle: financeCopy.kpis.totalReceivable.description,
      value: summary ? formatMxCurrency(summary.totalReceivable) : "—",
      tone: "warning" as const,
      trend: undefined as ReactNode | undefined,
      cardLoading: isLoading,
    },
    {
      key: "collectedThisMonth" as const,
      title: financeCopy.kpis.collectedThisMonth.title,
      subtitle: financeCopy.kpis.collectedThisMonth.description,
      value: summary ? formatMxCurrency(summary.collectedThisMonth) : "—",
      tone: "success" as const,
      trend: collectedSparkline,
      cardLoading: isLoading || collectedTrendLoading,
    },
    {
      key: "totalOverdue" as const,
      title: financeCopy.kpis.totalOverdue.title,
      subtitle: financeCopy.kpis.totalOverdue.description,
      value: summary ? formatMxCurrency(summary.totalOverdue) : "—",
      tone: "destructive" as const,
      trend: undefined,
      cardLoading: isLoading,
    },
    {
      key: "expensesThisMonth" as const,
      title: financeCopy.kpis.expensesThisMonth.title,
      subtitle: financeCopy.kpis.expensesThisMonth.description,
      value: summary ? formatMxCurrency(summary.expensesThisMonth) : "—",
      tone: "neutral" as const,
      trend: undefined,
      cardLoading: isLoading,
    },
  ];

  const keySet = new Set(keys);
  const cards = allCards.filter((card) => keySet.has(card.key));
  const colClass =
    cards.length >= 4
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      : cards.length === 3
        ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        : "grid grid-cols-1 gap-3 sm:grid-cols-2";

  if (density === "stat") {
    return (
      <section
        aria-label={sectionTitle ?? financeCopy.page.hub.monthContextTitle}
        className="space-y-2"
      >
        {sectionTitle ? (
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {sectionTitle}
          </h2>
        ) : null}
        <div className={colClass}>
          {cards.map((card) => (
            <StatCard
              key={card.key}
              title={card.title}
              value={card.value}
              description={card.subtitle}
              tone={card.tone}
              icon={STAT_ICONS[card.key] ?? (
                <Banknote className="h-4 w-4" aria-hidden />
              )}
              trend={card.trend}
              isLoading={card.cardLoading}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className={colClass}>
      {cards.map((card) => (
        <MetricTrendCard
          key={card.key}
          title={card.title}
          subtitle={card.subtitle}
          value={card.value}
          tone={card.tone}
          trend={card.trend}
          isLoading={card.cardLoading}
        />
      ))}
    </div>
  );
}
