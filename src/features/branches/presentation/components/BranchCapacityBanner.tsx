import { cn } from "@shared/lib/utils/cn";
import type { BranchListMeta } from "../../domain";
import { branchesCopy } from "../copy/branchesCopy";

interface BranchCapacityBannerProps {
  meta?: BranchListMeta;
  className?: string;
}

export function BranchCapacityBanner({ meta, className }: BranchCapacityBannerProps) {
  if (!meta) return null;

  const label =
    meta.maxBranches === null
      ? branchesCopy.list.capacity.unlimited(meta.activeCount)
      : branchesCopy.list.capacity.limited(meta.activeCount, meta.maxBranches);

  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className="font-medium text-foreground">{label}</span>
      {meta.overQuota && meta.maxBranches !== null ? (
        <span className="text-destructive">
          {branchesCopy.list.capacity.overQuotaHint(meta.activeCount, meta.maxBranches)}
        </span>
      ) : null}
      {meta.limitReached && !meta.overQuota ? (
        <span className="text-destructive">
          {branchesCopy.list.capacity.limitReachedHint}
        </span>
      ) : null}
    </div>
  );
}
