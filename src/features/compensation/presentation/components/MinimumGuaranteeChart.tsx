import { cn } from "@shared/lib/utils/cn";
import {
  buildMinimumGuaranteeChart,
  type MinimumGuaranteeChartModel,
} from "../utils/minimumGuaranteeChart";
import type { CompensationTemplateRule } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";

const copy = compensationCopy.builder.minimumChart;

interface MinimumGuaranteeChartProps {
  rule: Pick<
    CompensationTemplateRule,
    "commissionType" | "rateValue" | "minimumGuaranteedAmount"
  >;
  className?: string;
}

function ChartBody({ model }: { model: MinimumGuaranteeChartModel }) {
  return (
    <div
      className="rounded-md bg-background p-3"
      data-testid="minimum-guarantee-chart"
    >
      <p className="mb-2.5 text-xs font-semibold">{copy.title}</p>
      <div className="relative flex h-2.5 overflow-hidden rounded-[5px]">
        <div
          className="h-full border border-warning bg-warning-soft bg-[repeating-linear-gradient(135deg,var(--warning-soft)_0_6px,color-mix(in_oklch,var(--warning)_22%,var(--warning-soft))_6px_12px)]"
          style={{ width: `${model.minSegmentPct}%` }}
          data-testid="minimum-guarantee-min-segment"
        />
        <div className="h-full flex-1 bg-gradient-to-r from-primary/40 to-primary" />
      </div>
      <div className="relative mt-1 h-9 text-[11px] leading-[14px] text-muted-foreground">
        {model.ticks.map((tick) => (
          <div
            key={`${tick.label}-${tick.positionPct}`}
            className={cn(
              "absolute top-1 whitespace-nowrap text-center",
              tick.align === "start" && "translate-x-0 text-left",
              tick.align === "end" && "-translate-x-full text-right",
              (!tick.align || tick.align === "center") && "-translate-x-1/2",
            )}
            style={{ left: `${tick.positionPct}%` }}
          >
            <div>{tick.label}</div>
            {tick.amountLabel ? (
              <b className="font-mono font-semibold text-foreground">{tick.amountLabel}</b>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm border border-warning bg-warning-soft"
            aria-hidden
          />
          {model.untilLegend}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" aria-hidden />
          {model.afterLegend}
        </span>
      </div>
    </div>
  );
}

export function MinimumGuaranteeChart({ rule, className }: MinimumGuaranteeChartProps) {
  const model = buildMinimumGuaranteeChart(rule);
  if (!model) return null;

  return (
    <div className={className}>
      <ChartBody model={model} />
    </div>
  );
}
