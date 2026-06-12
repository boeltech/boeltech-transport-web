import { useMemo } from "react";
import { MetricTrendCard, Sparkline } from "@shared/ui/data-display";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { FinanceSummary } from "@features/finance/domain";
import { financeCopy } from "../copy";

interface FinanceSummaryCardsProps {
  summary?: FinanceSummary;
  isLoading?: boolean;
  collectedTrendData?: { value: number }[];
  collectedTrendLoading?: boolean;
}

export function FinanceSummaryCards({
  summary,
  isLoading,
  collectedTrendData,
  collectedTrendLoading = false,
}: FinanceSummaryCardsProps) {
  const collectedSparkline = useMemo(() => {
    if (!collectedTrendData || collectedTrendData.length < 2) return undefined;
    return <Sparkline data={collectedTrendData} token="success" height={40} />;
  }, [collectedTrendData]);

  const cards = [
    {
      key: "totalReceivable",
      title: financeCopy.kpis.totalReceivable.title,
      subtitle: financeCopy.kpis.totalReceivable.description,
      value: summary ? formatMxCurrency(summary.totalReceivable) : "—",
      tone: "warning" as const,
      trend: undefined,
      cardLoading: isLoading,
    },
    {
      key: "collectedThisMonth",
      title: financeCopy.kpis.collectedThisMonth.title,
      subtitle: financeCopy.kpis.collectedThisMonth.description,
      value: summary ? formatMxCurrency(summary.collectedThisMonth) : "—",
      tone: "success" as const,
      trend: collectedSparkline,
      cardLoading: isLoading || collectedTrendLoading,
    },
    {
      key: "totalOverdue",
      title: financeCopy.kpis.totalOverdue.title,
      subtitle: financeCopy.kpis.totalOverdue.description,
      value: summary ? formatMxCurrency(summary.totalOverdue) : "—",
      tone: "destructive" as const,
      trend: undefined,
      cardLoading: isLoading,
    },
    {
      key: "expensesThisMonth",
      title: financeCopy.kpis.expensesThisMonth.title,
      subtitle: financeCopy.kpis.expensesThisMonth.description,
      value: summary ? formatMxCurrency(summary.expensesThisMonth) : "—",
      tone: "neutral" as const,
      trend: undefined,
      cardLoading: isLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
