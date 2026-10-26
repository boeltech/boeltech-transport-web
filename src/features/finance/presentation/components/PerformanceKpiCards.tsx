import { useMemo, type ReactNode } from "react";
import {
  computeVariation,
  type AlignedPerformanceMonth,
  type PerformanceTotals,
  type VariationPolarity,
} from "@features/finance/application";
import type { MarginBasis } from "@features/finance/domain";
import { MetricTrendCard, Sparkline } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import { formatPct } from "../utils/monthlyPerformanceFormat";
import { PerformanceVariation } from "./PerformanceVariation";

const copy = financeCopy.performance.kpis;

interface KpiDefinition {
  key: "revenue" | "cost" | "margin" | "personnel";
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
  /** Rótulo de periodo siempre visible sobre los KPI (meses completos / en curso). */
  periodNote?: string;
  /**
   * Nota de rango cuando algún mes completo del summary es provisional.
   * Nunca chips en las cards; nunca en modo «solo mes en curso».
   */
  provisionalNote?: string | null;
  /** ADR-0108 — naming de costo/margen. */
  marginBasis?: MarginBasis;
  /** ADR-0108 — personal de periodo aparte (meses del summary). */
  personnelCost?: number;
  previousPersonnelCost?: number;
  /**
   * Meses alineados (`aligned`) para sparklines de Ingreso y Margen.
   * Si hay menos de 2 puntos, no se muestra sparkline (YoY sigue en `trend`).
   */
  months?: readonly AlignedPerformanceMonth[];
}

function buildDetailSubtitle(kpi: KpiDefinition, compare: boolean): string {
  if (!compare) return kpi.detail;
  return [kpi.detail, copy.versusPrevious(formatMxCurrency(kpi.previousValue)), kpi.previousDetail]
    .filter(Boolean)
    .join(" · ");
}

function buildSubtitleWithYoy(kpi: KpiDefinition): ReactNode {
  const text = buildDetailSubtitle(kpi, true);
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span>{text}</span>
      <PerformanceVariation
        variation={computeVariation(kpi.value, kpi.previousValue)}
        polarity={kpi.polarity}
      />
    </span>
  );
}

function marginTone(value: number): "success" | "destructive" {
  return value < 0 ? "destructive" : "success";
}

export function PerformanceKpiCards({
  current,
  previous,
  compare,
  isLoading = false,
  periodNote,
  provisionalNote,
  marginBasis = "operational",
  personnelCost,
  previousPersonnelCost,
  months,
}: PerformanceKpiCardsProps) {
  const operational = marginBasis === "operational";
  const showPersonnel = personnelCost != null;
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
      title: operational ? copy.cost : copy.costLegacy,
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
      title: operational ? copy.margin : copy.marginLegacy,
      value: current?.margin ?? 0,
      previousValue: previous?.margin ?? 0,
      polarity: "higher-is-better",
      detail: copy.shareOfRevenue(formatPct(current?.marginPct ?? null)),
      previousDetail: copy.previousMarginPct(formatPct(previous?.marginPct ?? null)),
    },
  ];
  if (showPersonnel) {
    kpis.push({
      key: "personnel",
      title: copy.personnelCost,
      value: personnelCost,
      previousValue: previousPersonnelCost ?? 0,
      polarity: "lower-is-better",
      detail: copy.personnelCostHint,
    });
  }

  const revenueSparkline = useMemo(() => {
    const data = (months ?? []).map((month) => ({
      value: month.current.actualRevenue,
    }));
    if (data.length < 2) return undefined;
    return <Sparkline data={data} token="chart-1" height={40} />;
  }, [months]);

  const marginSparkline = useMemo(() => {
    const data = (months ?? []).map((month) => ({
      value: month.current.actualMargin,
    }));
    if (data.length < 2) return undefined;
    return <Sparkline data={data} token="success" height={40} />;
  }, [months]);

  const cardCount = kpis.length;

  return (
    <div className="space-y-2">
      {periodNote && !isLoading ? (
        <p className="text-xs text-muted-foreground">{periodNote}</p>
      ) : null}
      {provisionalNote && !isLoading ? (
        <p className="text-xs text-muted-foreground" role="status">
          {provisionalNote}
        </p>
      ) : null}
      <section
        aria-label={copy.ariaLabel}
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2",
          cardCount >= 3 && "lg:grid-cols-3",
          cardCount >= 4 && "xl:grid-cols-4",
        )}
      >
        {kpis.map((kpi) => {
          const sparkline =
            kpi.key === "revenue"
              ? revenueSparkline
              : kpi.key === "margin"
                ? marginSparkline
                : undefined;
          const yoyInSubtitle = Boolean(sparkline && compare);

          return (
            <MetricTrendCard
              key={kpi.key}
              title={kpi.title}
              subtitle={
                yoyInSubtitle
                  ? buildSubtitleWithYoy(kpi)
                  : buildDetailSubtitle(kpi, compare)
              }
              value={formatMxCurrency(kpi.value)}
              tone={kpi.key === "margin" ? marginTone(kpi.value) : "primary"}
              isLoading={isLoading}
              trend={
                sparkline ??
                (compare ? (
                  <PerformanceVariation
                    variation={computeVariation(kpi.value, kpi.previousValue)}
                    polarity={kpi.polarity}
                    className="justify-end"
                  />
                ) : undefined)
              }
            />
          );
        })}
      </section>
    </div>
  );
}
