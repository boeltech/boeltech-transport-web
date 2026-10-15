/**
 * @deprecated Preferir mapSettlementWorkbenchBuckets + WorkbenchPageShell (ADR-0090).
 * Conservado temporalmente por referencias residuales.
 */
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import type { SettlementWorkbenchSummary } from "../../domain/entities";
import type { SettlementWorkbenchNavBucket } from "../config/settlementWorkbenchConfig";
import { SETTLEMENT_WORKBENCH_BUCKETS } from "../config/settlementWorkbenchConfig";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench;

interface SettlementWorkbenchKpiStripProps {
  activeBucket: SettlementWorkbenchNavBucket;
  summary: SettlementWorkbenchSummary;
  isLoading?: boolean;
  onBucketChange: (bucket: SettlementWorkbenchNavBucket) => void;
  onOpenAdvancesTab: () => void;
}

function BucketCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Badge
      variant="warning"
      tone="soft"
      className="ml-1.5 h-5 min-w-5 px-1.5 text-[11px] font-medium tabular-nums"
    >
      {count}
    </Badge>
  );
}

function countForBucket(
  bucket: SettlementWorkbenchNavBucket,
  summary: SettlementWorkbenchSummary,
): number {
  switch (bucket) {
    case "pending":
      return summary.pending;
    case "draft":
      return summary.draft;
    case "approval":
      return summary.approval;
    case "payable":
      return summary.payable;
    case "closed":
      return summary.closed;
  }
}

export function SettlementWorkbenchKpiStrip({
  activeBucket,
  summary,
  isLoading = false,
  onBucketChange,
  onOpenAdvancesTab,
}: SettlementWorkbenchKpiStripProps) {
  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Etapas de pagos a operadores"
      >
        {SETTLEMENT_WORKBENCH_BUCKETS.map((bucket) => {
          const isActive = activeBucket === bucket;
          const count = countForBucket(bucket, summary);

          return (
            <Button
              key={bucket}
              type="button"
              role="tab"
              aria-selected={isActive}
              variant={isActive ? "default" : "outline"}
              size="sm"
              disabled={isLoading}
              className={cn("h-8 gap-0", isActive && "shadow-sm")}
              onClick={() => onBucketChange(bucket)}
            >
              {copy.buckets[bucket]}
              <BucketCountBadge count={count} />
            </Button>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-0"
          disabled={isLoading}
          onClick={onOpenAdvancesTab}
        >
          {copy.buckets.openAdvances}
          <BucketCountBadge count={summary.openAdvances} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {copy.bucketDescriptions[activeBucket]}
      </p>
    </div>
  );
}
