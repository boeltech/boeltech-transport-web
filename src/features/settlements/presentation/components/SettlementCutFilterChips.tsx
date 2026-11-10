import { cn } from "@shared/lib/utils/cn";
import type { SettlementCutReviewFilter } from "../utils/settlementCutWarnings";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.cutWizard.review;

const OPTIONS: ReadonlyArray<{
  value: SettlementCutReviewFilter;
  label: string;
}> = [
  { value: "all", label: copy.chipAll },
  { value: "with_warning", label: copy.chipWithWarning },
  { value: "ready", label: copy.chipReady },
];

export interface SettlementCutFilterChipsProps {
  value: SettlementCutReviewFilter;
  onChange: (next: SettlementCutReviewFilter) => void;
  counts?: Partial<Record<SettlementCutReviewFilter, number>>;
  className?: string;
}

export function SettlementCutFilterChips({
  value,
  onChange,
  counts,
  className,
}: SettlementCutFilterChipsProps) {
  return (
    <div
      role="radiogroup"
      aria-label={copy.chipsAriaLabel}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      data-testid="cut-filter-chips"
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
            data-testid={`cut-chip-${option.value}`}
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
