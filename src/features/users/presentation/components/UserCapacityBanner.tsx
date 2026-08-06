import { cn } from "@shared/lib/utils/cn";
import { usersCopy } from "../copy/usersCopy";
import type { UserPlanCapacity } from "../helpers/userPlanCapacity";

interface UserCapacityBannerProps {
  capacity: UserPlanCapacity;
  className?: string;
}

export function UserCapacityBanner({
  capacity,
  className,
}: UserCapacityBannerProps) {
  const copy = usersCopy.list.capacity;

  // Sin meta de cupo no inventamos conteo (pagination.total ≠ asientos).
  if (!capacity.isPlanResolved) {
    return null;
  }

  const label = capacity.unlimited
    ? copy.unlimited(capacity.activeCount)
    : copy.limited(capacity.activeCount, capacity.maxUsers as number);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className="font-medium text-foreground">{label}</span>
      {capacity.overQuota && typeof capacity.maxUsers === "number" ? (
        <span className="text-destructive">
          {copy.overQuotaHint(capacity.activeCount, capacity.maxUsers)}
        </span>
      ) : null}
      {capacity.limitReached && !capacity.overQuota ? (
        <span className="text-destructive">{copy.limitReachedHint}</span>
      ) : null}
    </div>
  );
}
