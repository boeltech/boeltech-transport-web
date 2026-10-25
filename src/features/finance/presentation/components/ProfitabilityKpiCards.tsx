import { useMemo } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { MetricTrendCard } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type {
  ProfitabilityScope,
  ProfitabilityTripsResponse,
} from "@features/finance/domain";
import { financeCopy } from "../copy";
import { tripsUseOperationalBasis } from "../utils/operationalMarginDisplay";
import {
  showsMarginForScope,
  tripCountLabel,
} from "../utils/profitabilityScopeHelpers";

const copy = financeCopy.profitability;

interface ProfitabilityKpiCardsProps {
  scope: ProfitabilityScope;
  trips?: ProfitabilityTripsResponse;
  isLoading?: boolean;
  /** Filtro «solo con pérdida» de los viajes al abrir un grupo. */
  lossOnly?: boolean;
  onLossOnlyChange?: (lossOnly: boolean) => void;
}

function formatMarginPct(pct: number | null | undefined): string {
  return pct == null ? "—" : `${pct.toFixed(2)}%`;
}

function LossTripsCard({
  lossCount,
  tripCount,
  lossOnly,
  onLossOnlyChange,
  isLoading,
}: {
  lossCount: number;
  tripCount: number;
  lossOnly: boolean;
  onLossOnlyChange?: (lossOnly: boolean) => void;
  isLoading: boolean;
}) {
  const noLosses = !isLoading && !lossOnly && lossCount === 0;
  return (
    <Card
      className={cn(lossOnly && "border-destructive/60 bg-destructive/5")}
      data-testid="profitability-loss-card"
    >
      <CardContent className="flex h-full flex-col gap-2 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          {copy.lossCard.title}
        </p>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p
            className={cn(
              "text-2xl font-bold tabular-nums",
              lossCount > 0 && "text-destructive",
            )}
          >
            {copy.lossCard.value(lossCount, tripCount)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {lossOnly
            ? copy.lossCard.activeHint
            : noLosses
              ? copy.lossCard.none
              : copy.lossCard.hint}
        </p>
        {onLossOnlyChange && !noLosses ? (
          <Button
            type="button"
            size="sm"
            variant={lossOnly ? "secondary" : "outline"}
            className="mt-auto self-start"
            aria-pressed={lossOnly}
            disabled={isLoading}
            onClick={() => onLossOnlyChange(!lossOnly)}
          >
            {lossOnly ? (
              <X className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            ) : (
              <Filter className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            )}
            {lossOnly ? copy.lossCard.remove : copy.lossCard.apply}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ProfitabilityKpiCards({
  scope,
  trips,
  isLoading = false,
  lossOnly = false,
  onLossOnlyChange,
}: ProfitabilityKpiCardsProps) {
  const tripCount = trips?.pagination.total ?? trips?.data.length ?? 0;
  const agg = trips?.aggregates;
  const showMargin = showsMarginForScope(scope);
  const lossCount = agg?.byProfitabilityStatus.loss ?? 0;
  const operational = tripsUseOperationalBasis(trips);
  const costTitle = operational
    ? copy.metrics.operationalCost
    : copy.metrics.totalActual;
  const costHint = operational
    ? copy.metrics.operationalCostHint
    : copy.metrics.totalActualHint;
  const costValue = operational
    ? (agg?.totalOperationalCost ?? agg?.totalActual ?? 0)
    : (agg?.totalActual ?? 0);
  const marginTitle = operational
    ? copy.metrics.operationalMargin
    : copy.metrics.blendedMargin;
  const marginHint = operational
    ? copy.metrics.operationalMarginHint
    : copy.metrics.blendedMarginHint;
  const marginValue = operational
    ? (agg?.blendedOperationalMargin ?? agg?.blendedMargin ?? 0)
    : (agg?.blendedMargin ?? 0);
  const marginPct = operational
    ? (agg?.blendedOperationalMarginPct ?? agg?.blendedMarginPct)
    : agg?.blendedMarginPct;

  const cards = useMemo(() => {
    if (scope === "pipeline") {
      return [
        {
          key: "projected",
          title: copy.metrics.projectedRevenue,
          subtitle: copy.context.projectedHint,
          value: formatMxCurrency(agg?.totalProjectedRevenue ?? 0),
          tone: "info" as const,
        },
        {
          key: "trips",
          title: copy.metrics.tripCount,
          subtitle: copy.scope.pipeline,
          value: tripCountLabel(tripCount),
          tone: "neutral" as const,
        },
      ];
    }

    if (scope === "cancelled") {
      return [
        {
          key: "loss",
          title: copy.metrics.cancellationLoss,
          subtitle: copy.context.cancellationLossHint,
          value: formatMxCurrency(agg?.totalCancellationLoss ?? 0),
          tone: "destructive" as const,
        },
        {
          key: "actual",
          title: costTitle,
          subtitle: costHint,
          value: formatMxCurrency(costValue),
          tone: "warning" as const,
        },
        {
          key: "trips",
          title: copy.metrics.tripCount,
          subtitle: copy.scope.cancelled,
          value: tripCountLabel(tripCount),
          tone: "neutral" as const,
        },
      ];
    }

    const base = [
      {
        key: "totalRevenue",
        title: copy.metrics.totalRevenue,
        subtitle: tripCountLabel(tripCount),
        value: formatMxCurrency(agg?.totalRevenue ?? 0),
        tone: "primary" as const,
      },
      {
        key: "totalActual",
        title: costTitle,
        subtitle: costHint,
        value: formatMxCurrency(costValue),
        tone: "warning" as const,
      },
    ];

    if (!showMargin) return base;

    return [
      ...base,
      {
        key: "blendedMargin",
        title: marginTitle,
        subtitle:
          operational && (agg?.totalTripCommission ?? 0) === 0
            ? copy.metrics.missingCommissionHint
            : marginHint,
        value: `${formatMxCurrency(marginValue)} · ${formatMarginPct(marginPct ?? null)}`,
        tone:
          marginValue < 0 ? ("destructive" as const) : ("success" as const),
      },
    ];
  }, [
    agg,
    costHint,
    costTitle,
    costValue,
    marginHint,
    marginPct,
    marginTitle,
    marginValue,
    operational,
    scope,
    showMargin,
    tripCount,
  ]);

  const cardCount = cards.length + (showMargin ? 1 : 0);

  return (
    <section
      aria-label={copy.metrics.ariaLabel}
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2",
        cardCount >= 4 ? "xl:grid-cols-4" : cardCount === 3 ? "lg:grid-cols-3" : "",
      )}
    >
      {cards.map((card) => (
        <MetricTrendCard
          key={card.key}
          title={card.title}
          subtitle={card.subtitle}
          value={card.value}
          tone={card.tone}
          isLoading={isLoading}
        />
      ))}
      {showMargin ? (
        <LossTripsCard
          lossCount={lossCount}
          tripCount={tripCount}
          lossOnly={lossOnly}
          onLossOnlyChange={onLossOnlyChange}
          isLoading={isLoading}
        />
      ) : null}
    </section>
  );
}
