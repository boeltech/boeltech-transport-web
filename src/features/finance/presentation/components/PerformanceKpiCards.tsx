import {
  computeVariation,
  type PerformanceTotals,
  type VariationPolarity,
} from "@features/finance/application";
import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import { formatPct } from "../utils/monthlyPerformanceFormat";
import { PerformanceVariation } from "./PerformanceVariation";

const copy = financeCopy.performance.kpis;

interface KpiDefinition {
  key: "revenue" | "cost" | "margin";
  title: string;
  value: number;
  previousValue: number;
  polarity: VariationPolarity;
  detail: string;
  previousDetail?: string;
}

interface PerformanceKpiCardsProps {
  current?: PerformanceTotals;
  previous?: PerformanceTotals;
  compare: boolean;
  isLoading?: boolean;
}

function KpiCard({
  kpi,
  compare,
  isLoading,
}: {
  kpi: KpiDefinition;
  compare: boolean;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-28" />
          </>
        ) : (
          <>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums tracking-tight",
                kpi.key === "margin" && kpi.value < 0
                  ? "text-destructive"
                  : "text-foreground",
              )}
            >
              {formatMxCurrency(kpi.value)}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">{kpi.detail}</p>
            {compare ? (
              <div className="mt-2 space-y-0.5 border-t pt-2 text-xs">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-muted-foreground tabular-nums">
                    {copy.versusPrevious(formatMxCurrency(kpi.previousValue))}
                  </span>
                  <PerformanceVariation
                    variation={computeVariation(kpi.value, kpi.previousValue)}
                    polarity={kpi.polarity}
                  />
                </p>
                {kpi.previousDetail ? (
                  <p className="text-muted-foreground tabular-nums">
                    {kpi.previousDetail}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function PerformanceKpiCards({
  current,
  previous,
  compare,
  isLoading = false,
}: PerformanceKpiCardsProps) {
  const kpis: KpiDefinition[] = [
    {
      key: "revenue",
      title: copy.revenue,
      value: current?.revenue ?? 0,
      previousValue: previous?.revenue ?? 0,
      polarity: "higher-is-better",
      detail: copy.tripCount(current?.tripCount ?? 0),
    },
    {
      key: "cost",
      title: copy.cost,
      value: current?.cost ?? 0,
      previousValue: previous?.cost ?? 0,
      polarity: "lower-is-better",
      detail: copy.shareOfRevenue(
        formatPct(
          current && current.revenue !== 0
            ? (current.cost / current.revenue) * 100
            : null,
        ),
      ),
    },
    {
      key: "margin",
      title: copy.margin,
      value: current?.margin ?? 0,
      previousValue: previous?.margin ?? 0,
      polarity: "higher-is-better",
      detail: copy.shareOfRevenue(formatPct(current?.marginPct ?? null)),
      previousDetail: copy.previousMarginPct(formatPct(previous?.marginPct ?? null)),
    },
  ];

  return (
    <section
      aria-label={copy.ariaLabel}
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      {kpis.map((kpi) => (
        <KpiCard key={kpi.key} kpi={kpi} compare={compare} isLoading={isLoading} />
      ))}
    </section>
  );
}
