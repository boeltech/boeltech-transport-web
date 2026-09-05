/**
 * @deprecated Preferir mapSettlementWorkbenchBuckets + WorkbenchPageShell (ADR-0090).
 * Conservado temporalmente por referencias residuales.
 */
import { Link } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import type { SettlementWorkbenchSummary } from "../../domain/entities";
import type { SettlementWorkbenchNavBucket } from "../config/settlementWorkbenchConfig";
import {
  SETTLEMENT_WORKBENCH_BUCKETS,
  settlementsCompensationApprovalsPath,
} from "../config/settlementWorkbenchConfig";
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
          const count =
            bucket === "pending"
              ? summary.pending
              : bucket === "draft"
                ? summary.draft
                : bucket === "payable"
                  ? summary.payable
                  : summary.closed;

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

        {summary.approval > 0 ? (
          <Button
            asChild
            type="button"
            variant="link"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
          >
            <Link to={settlementsCompensationApprovalsPath()}>
              {copy.approvalLink(summary.approval)}
            </Link>
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {copy.bucketDescriptions[activeBucket]}
      </p>
    </div>
  );
}
