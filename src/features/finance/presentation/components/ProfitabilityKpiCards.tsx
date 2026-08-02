import { useMemo } from "react";
import { MetricTrendCard, Sparkline } from "@shared/ui/data-display";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type {
  ProfitabilityAggregateItem,
  ProfitabilityScope,
  ProfitabilityTripsResponse,
} from "@features/finance/domain";
import { financeCopy } from "../copy";
import {
  showsMarginForScope,
  tripCountLabel,
} from "../utils/profitabilityScopeHelpers";

interface ProfitabilityKpiCardsProps {
  scope: ProfitabilityScope;
  trips?: ProfitabilityTripsResponse;
  monthAggregate?: ProfitabilityAggregateItem[];
  isLoading?: boolean;
}

export function ProfitabilityKpiCards({
  scope,
  trips,
  monthAggregate,
  isLoading = false,
}: ProfitabilityKpiCardsProps) {
  const revenueTrendData = useMemo(
    () => monthAggregate?.map((row) => ({ value: row.totalRevenue })) ?? [],
    [monthAggregate],
  );

  const revenueSparkline = useMemo(() => {
    if (revenueTrendData.length < 2) return undefined;
    return <Sparkline data={revenueTrendData} token="chart-1" height={40} />;
  }, [revenueTrendData]);

  const tripCount = trips?.pagination.total ?? trips?.data.length ?? 0;
  const agg = trips?.aggregates;
  const marginPct = agg?.blendedMarginPct;
  const showMargin = showsMarginForScope(scope);

  const cards = useMemo(() => {
    if (scope === "pipeline") {
      return [
        {
          key: "projected",
          title: financeCopy.profitability.metrics.projectedRevenue,
          subtitle: financeCopy.profitability.context.projectedHint,
          value: formatMxCurrency(agg?.totalProjectedRevenue ?? 0),
          tone: "info" as const,
          trend: undefined,
        },
        {
          key: "trips",
          title: financeCopy.profitability.metrics.tripCount,
          subtitle: financeCopy.profitability.scope.pipeline,
          value: tripCountLabel(tripCount),
          tone: "neutral" as const,
          trend: undefined,
        },
      ];
    }

    if (scope === "cancelled") {
      return [
        {
          key: "loss",
          title: financeCopy.profitability.metrics.cancellationLoss,
          subtitle: financeCopy.profitability.context.cancellationLossHint,
          value: formatMxCurrency(agg?.totalCancellationLoss ?? 0),
          tone: "destructive" as const,
          trend: undefined,
        },
        {
          key: "actual",
          title: financeCopy.profitability.metrics.totalActual,
          subtitle: financeCopy.profitability.table.actualTotal,
          value: formatMxCurrency(agg?.totalActual ?? 0),
          tone: "warning" as const,
          trend: undefined,
        },
        {
          key: "trips",
          title: financeCopy.profitability.metrics.tripCount,
          subtitle: financeCopy.profitability.scope.cancelled,
          value: tripCountLabel(tripCount),
          tone: "neutral" as const,
          trend: undefined,
        },
      ];
    }

    const base = [
      {
        key: "totalRevenue",
        title: financeCopy.profitability.metrics.totalRevenue,
        subtitle: financeCopy.profitability.metrics.totalRevenueHint,
        value: formatMxCurrency(agg?.totalRevenue ?? 0),
        tone: "primary" as const,
        trend: revenueSparkline,
      },
      {
        key: "totalActual",
        title: financeCopy.profitability.metrics.totalActual,
        subtitle: financeCopy.profitability.table.actualTotal,
        value: formatMxCurrency(agg?.totalActual ?? 0),
        tone: "warning" as const,
        trend: undefined,
      },
    ];

    if (!showMargin) {
      return base;
    }

    return [
      ...base,
      {
        key: "blendedMargin",
        title: financeCopy.profitability.metrics.blendedMargin,
        subtitle: financeCopy.profitability.metrics.blendedMarginHint,
        value: formatMxCurrency(agg?.blendedMargin ?? 0),
        tone: "success" as const,
        trend: undefined,
      },
      {
        key: "blendedMarginPct",
        title: financeCopy.profitability.metrics.blendedMarginPct,
        subtitle: financeCopy.profitability.metrics.tripSample.subtitle,
        value:
          marginPct == null
            ? `— · ${tripCountLabel(tripCount)}`
            : `${marginPct.toFixed(2)}% · ${tripCountLabel(tripCount)}`,
        tone:
          marginPct != null && marginPct < 0
            ? ("destructive" as const)
            : ("info" as const),
        trend: undefined,
      },
    ];
  }, [
    agg,
    marginPct,
    revenueSparkline,
    scope,
    showMargin,
    tripCount,
  ]);

  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
        cards.length >= 4 ? "xl:grid-cols-4" : cards.length === 3 ? "lg:grid-cols-3" : ""
      }`}
    >
      {cards.map((card) => (
        <MetricTrendCard
          key={card.key}
          title={card.title}
          subtitle={card.subtitle}
          value={card.value}
          tone={card.tone}
          trend={card.trend}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
