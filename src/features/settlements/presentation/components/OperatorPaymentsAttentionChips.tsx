import { cn } from "@shared/lib/utils/cn";
import type { OperatorPaymentAttentionFilter } from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.operatorsList.chips;

const OPTIONS: ReadonlyArray<{
  value: OperatorPaymentAttentionFilter;
  label: string;
}> = [
  { value: "all", label: copy.all },
  { value: "ready", label: copy.ready },
  { value: "needs_attention", label: copy.needsAttention },
];

export interface OperatorPaymentsAttentionChipsProps {
  value: OperatorPaymentAttentionFilter;
  onChange: (next: OperatorPaymentAttentionFilter) => void;
  counts?: Partial<Record<OperatorPaymentAttentionFilter, number>>;
  className?: string;
}

export function OperatorPaymentsAttentionChips({
  value,
  onChange,
  counts,
  className,
}: OperatorPaymentsAttentionChipsProps) {
  return (
    <div
      role="radiogroup"
      aria-label={copy.ariaLabel}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      data-testid="operators-attention-chips"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        const count = counts?.[option.value];
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={`operators-chip-${option.value}`}
            onClick={() => {
              if (!active) onChange(option.value);
            }}
            className={cn(
              "inline-flex h-[30px] items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {option.label}
            {count !== undefined ? (
              <span className="font-mono text-xs opacity-75">{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
