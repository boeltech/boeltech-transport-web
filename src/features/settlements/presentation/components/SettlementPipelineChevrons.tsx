import { ChevronRight } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Skeleton } from "@shared/ui/skeleton";
import { settlementsCopy } from "../copy/settlementsCopy";
import { formatPipelineBucketAmount } from "../utils/formatPipelineBucketAmount";

const copy = settlementsCopy.workbench.pipeline;

export interface PipelineChevronBucket {
  id: string;
  label: string;
  count: number;
  amount?: number | null;
  isActive: boolean;
  onClick: () => void;
}

interface SettlementPipelineChevronsProps {
  buckets: readonly PipelineChevronBucket[];
  isLoading?: boolean;
  ariaLabel?: string;
  /** Copy cuando count>0 y no hay suma API (default: workbench Pagos). */
  amountMissingSumLabel?: string;
}

/**
 * Pipeline con chevrons (pieza #8 · Operate-Pagos-Workbench).
 * Nav de etapas — no tabs ni scorecard grid del shell.
 */
export function SettlementPipelineChevrons({
  buckets,
  isLoading = false,
  ariaLabel = copy.ariaLabel,
  amountMissingSumLabel = copy.amountMissingSum,
}: SettlementPipelineChevronsProps) {
  return (
    <nav
      className="flex gap-0.5 overflow-x-auto rounded-2xl border bg-card p-1"
      aria-label={ariaLabel}
      data-testid="settlement-pipeline-chevrons"
    >
      {buckets.map((bucket, index) => (
        <div key={bucket.id} className="flex min-w-0 flex-1 items-stretch">
          {index > 0 ? (
            <div
              className="flex shrink-0 items-center px-0.5 text-border"
              aria-hidden
            >
              <ChevronRight className="h-4 w-4" />
            </div>
          ) : null}
          <button
            type="button"
            role="tab"
            aria-selected={bucket.isActive}
            disabled={isLoading}
            onClick={bucket.onClick}
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl px-3 py-2 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:opacity-60",
              bucket.isActive
                ? "bg-primary/10 shadow-[inset_0_-3px_0_0] shadow-primary"
                : "hover:bg-muted/50",
            )}
          >
            <span
              className={cn(
                "truncate text-xs font-medium",
                bucket.isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              {bucket.label}
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-10" />
            ) : (
              <span className="font-mono text-lg font-bold tabular-nums leading-6 text-foreground">
                {bucket.count}
              </span>
            )}
            {!isLoading ? (
              <span className="truncate font-mono text-[11px] text-muted-foreground tabular-nums">
                {formatPipelineBucketAmount(
                  bucket.amount,
                  bucket.count,
                  amountMissingSumLabel,
                )}
              </span>
            ) : null}
          </button>
        </div>
      ))}
    </nav>
  );
}
