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
          {lossOnly ? copy.lossCard.activeHint : copy.lossCard.hint}
        </p>
        {onLossOnlyChange ? (
          <Button
            type="button"
            size="sm"
            variant={lossOnly ? "secondary" : "outline"}
            className="mt-auto self-start"
            aria-pressed={lossOnly}
            disabled={isLoading || (!lossOnly && lossCount === 0)}
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
          title: copy.metrics.totalActual,
          subtitle: copy.metrics.totalActualHint,
          value: formatMxCurrency(agg?.totalActual ?? 0),
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
        title: copy.metrics.totalActual,
        subtitle: copy.metrics.totalActualHint,
        value: formatMxCurrency(agg?.totalActual ?? 0),
        tone: "warning" as const,
      },
    ];

    if (!showMargin) return base;

    const marginPct = agg?.blendedMarginPct;
    return [
      ...base,
      {
        key: "blendedMargin",
        title: copy.metrics.blendedMargin,
        subtitle: copy.metrics.blendedMarginHint,
        value: `${formatMxCurrency(agg?.blendedMargin ?? 0)} · ${formatMarginPct(marginPct)}`,
        tone:
          (agg?.blendedMargin ?? 0) < 0
            ? ("destructive" as const)
            : ("success" as const),
      },
    ];
  }, [agg, scope, showMargin, tripCount]);

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
