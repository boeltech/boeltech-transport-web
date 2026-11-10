import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { AgreementCommissionType } from "@features/settlements/domain";
import type { CompensationTemplateRule } from "../../domain/entities";

export interface MinimumGuaranteeTick {
  /** 0–100 position on the bar. */
  positionPct: number;
  label: string;
  amountLabel: string;
  align?: "start" | "center" | "end";
  /** Marca de equilibrio: nunca se elimina al colapsar (A8). */
  keep?: boolean;
}

export interface MinimumGuaranteeChartModel {
  /** Point where calculated pay equals the minimum (min ÷ rate). */
  breakEvenValue: number;
  breakEvenLabel: string;
  unit: "km" | "%";
  minSegmentPct: number;
  ticks: MinimumGuaranteeTick[];
  untilLegend: string;
  afterLegend: string;
}

/** Separación mínima entre ticks (~10 % del ancho) — A8. */
export const MIN_TICK_GAP_PCT = 10;

function isMustKeepTick(tick: MinimumGuaranteeTick): boolean {
  return (
    tick.keep === true || tick.positionPct <= 0.5 || tick.positionPct >= 99.5
  );
}

/**
 * Elimina ticks que se solapan (&lt; gapPct), conservando siempre el de equilibrio
 * y los extremos (0 / 100).
 */
export function collapseOverlappingTicks(
  ticks: readonly MinimumGuaranteeTick[],
  gapPct: number = MIN_TICK_GAP_PCT,
): MinimumGuaranteeTick[] {
  if (ticks.length <= 2) return [...ticks];
  const sorted = [...ticks].sort((a, b) => a.positionPct - b.positionPct);
  const result: MinimumGuaranteeTick[] = [];

  for (const tick of sorted) {
    if (result.length === 0) {
      result.push(tick);
      continue;
    }
    const prev = result[result.length - 1]!;
    const gap = tick.positionPct - prev.positionPct;
    if (gap >= gapPct) {
      result.push(tick);
      continue;
    }
    if (isMustKeepTick(tick) && !isMustKeepTick(prev)) {
      result[result.length - 1] = tick;
    } else if (isMustKeepTick(tick) && isMustKeepTick(prev)) {
      // p. ej. 0 y equilibrio bajo: ambos se conservan
      result.push(tick);
    }
  }
  return result;
}

/**
 * Modelo de la gráfica del mínimo (T4): equilibrio = mínimo ÷ tarifa.
 * Solo aplica a km / % con mínimo > 0.
 */
export function buildMinimumGuaranteeChart(
  rule: Pick<CompensationTemplateRule, "commissionType" | "rateValue" | "minimumGuaranteedAmount">,
  options?: { maxDistanceKm?: number },
): MinimumGuaranteeChartModel | null {
  const commissionType = rule.commissionType as AgreementCommissionType;
  const rate =
    typeof rule.rateValue === "number" && Number.isFinite(rule.rateValue) ? rule.rateValue : 0;
  const minimum =
    typeof rule.minimumGuaranteedAmount === "number" && rule.minimumGuaranteedAmount > 0
      ? rule.minimumGuaranteedAmount
      : 0;

  if (minimum <= 0 || rate <= 0) return null;
  if (commissionType !== "rate_per_km" && commissionType !== "percentage_of_freight") {
    return null;
  }

  if (commissionType === "rate_per_km") {
    const breakEven = minimum / rate;
    const maxKm = Math.max(options?.maxDistanceKm ?? 1500, breakEven * 1.5, 100);
    const midLow = Math.round(breakEven * 0.6);
    const midHigh = Math.round(Math.min(maxKm * 0.6, breakEven + (maxKm - breakEven) * 0.4));

    const payAt = (km: number) => Math.max(minimum, Math.round(km * rate * 100) / 100);
    const rawTicks: MinimumGuaranteeTick[] = [
      { positionPct: 0, label: "0 km", amountLabel: "", align: "start" },
      {
        positionPct: (midLow / maxKm) * 100,
        label: `${midLow} km`,
        amountLabel: formatMxCurrency(payAt(midLow)),
      },
      {
        positionPct: (breakEven / maxKm) * 100,
        label: `${Math.round(breakEven)} km`,
        amountLabel: formatMxCurrency(payAt(breakEven)),
        keep: true,
      },
      {
        positionPct: (midHigh / maxKm) * 100,
        label: `${midHigh} km`,
        amountLabel: formatMxCurrency(payAt(midHigh)),
      },
      {
        positionPct: 100,
        label: `${Math.round(maxKm)} km`,
        amountLabel: formatMxCurrency(payAt(maxKm)),
        align: "end",
      },
    ];

    return {
      breakEvenValue: breakEven,
      breakEvenLabel: `${Math.round(breakEven)} km`,
      unit: "km",
      minSegmentPct: Math.min(100, (breakEven / maxKm) * 100),
      ticks: collapseOverlappingTicks(rawTicks),
      untilLegend: `Hasta ${Math.round(breakEven)} km paga el mínimo`,
      afterLegend: `Desde ${Math.round(breakEven)} km, ${formatMxCurrency(rate)} por cada km`,
    };
  }

  // percentage_of_freight: break-even freight = minimum / (rate/100)
  const breakEvenFreight = minimum / (rate / 100);
  const maxFreight = Math.max(breakEvenFreight * 2, 20_000);
  const midLow = Math.round(breakEvenFreight * 0.5);
  const midHigh = Math.round(breakEvenFreight * 1.4);
  const payAtFreight = (freight: number) =>
    Math.max(minimum, Math.round(((freight * rate) / 100) * 100) / 100);
  const rawTicks: MinimumGuaranteeTick[] = [
    { positionPct: 0, label: "$0", amountLabel: "", align: "start" },
    {
      positionPct: (midLow / maxFreight) * 100,
      label: formatMxCurrency(midLow),
      amountLabel: formatMxCurrency(payAtFreight(midLow)),
    },
    {
      positionPct: (breakEvenFreight / maxFreight) * 100,
      label: formatMxCurrency(breakEvenFreight),
      amountLabel: formatMxCurrency(payAtFreight(breakEvenFreight)),
      keep: true,
    },
    {
      positionPct: (midHigh / maxFreight) * 100,
      label: formatMxCurrency(midHigh),
      amountLabel: formatMxCurrency(payAtFreight(midHigh)),
    },
    {
      positionPct: 100,
      label: formatMxCurrency(maxFreight),
      amountLabel: formatMxCurrency(payAtFreight(maxFreight)),
      align: "end",
    },
  ];

  return {
    breakEvenValue: breakEvenFreight,
    breakEvenLabel: formatMxCurrency(breakEvenFreight),
    unit: "%",
    minSegmentPct: Math.min(100, (breakEvenFreight / maxFreight) * 100),
    ticks: collapseOverlappingTicks(rawTicks),
    untilLegend: `Hasta un flete de ${formatMxCurrency(breakEvenFreight)} paga el mínimo`,
    afterLegend: `Desde ahí, ${rate}% del flete`,
  };
}
