import { cn } from "@shared/lib/utils/cn";
import type { ApprovalQueue } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.flow.queue;

const OPTIONS: ReadonlyArray<{ value: ApprovalQueue; label: string }> = [
  { value: "mine", label: copy.mine },
  { value: "all", label: copy.all },
];

/** Handoff F6 D7: control segmentado «Me toca · Todas» (patrón `ThemeSegmented`). */
export function ApprovalQueueToggle({
  value,
  onChange,
  className,
}: {
  value: ApprovalQueue;
  onChange: (queue: ApprovalQueue) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={copy.label}
      className={cn("inline-flex items-center rounded-lg border bg-muted p-1", className)}
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              if (!active) onChange(option.value);
            }}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
