import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { AgreementCommissionType } from "@features/settlements/domain";
import type { CompensationTemplateRule } from "../../domain/entities";

export interface MinimumGuaranteeTick {
  /** 0–100 position on the bar. */
  positionPct: number;
  label: string;
  amountLabel: string;
  align?: "start" | "center" | "end";
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

    return {
      breakEvenValue: breakEven,
      breakEvenLabel: `${Math.round(breakEven)} km`,
      unit: "km",
      minSegmentPct: Math.min(100, (breakEven / maxKm) * 100),
      ticks: [
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
      ],
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

  return {
    breakEvenValue: breakEvenFreight,
    breakEvenLabel: formatMxCurrency(breakEvenFreight),
    unit: "%",
    minSegmentPct: Math.min(100, (breakEvenFreight / maxFreight) * 100),
    ticks: [
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
    ],
    untilLegend: `Hasta un flete de ${formatMxCurrency(breakEvenFreight)} paga el mínimo`,
    afterLegend: `Desde ahí, ${rate}% del flete`,
  };
}
