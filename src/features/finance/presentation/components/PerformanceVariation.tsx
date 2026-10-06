import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  variationSentiment,
  type Variation,
  type VariationPolarity,
  type VariationSentiment,
} from "@features/finance/application";
import { cn } from "@shared/lib/utils/cn";
import { financeCopy } from "../copy";
import { formatVariationPct } from "../utils/monthlyPerformanceFormat";

const SENTIMENT_CLASSES: Record<VariationSentiment, string> = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
};

interface PerformanceVariationProps {
  variation: Variation;
  polarity: VariationPolarity;
  className?: string;
}

/** `▲ 12.5%` con color según si subir es bueno (ingreso, margen) o malo (gasto). */
export function PerformanceVariation({
  variation,
  polarity,
  className,
}: PerformanceVariationProps) {
  const sentiment = variationSentiment(variation, polarity);
  const label = formatVariationPct(variation);
  const copy = financeCopy.performance.variation;

  if (variation.kind === "none") {
    return (
      <span className={cn("tabular-nums text-muted-foreground", className)}>
        {label}
      </span>
    );
  }

  const Icon =
    variation.delta > 0 ? ArrowUpRight : variation.delta < 0 ? ArrowDownRight : Minus;
  const direction =
    variation.delta > 0 ? copy.upAria : variation.delta < 0 ? copy.downAria : copy.flatAria;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tabular-nums",
        SENTIMENT_CLASSES[sentiment],
        className,
      )}
      aria-label={variation.kind === "new" ? label : `${direction} ${label}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
