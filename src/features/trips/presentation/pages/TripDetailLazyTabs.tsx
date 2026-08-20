import { Skeleton } from "@shared/ui/skeleton";
import { lazyWithRetry } from "@shared/lib/lazyWithRetry";

export const TripTrackingTabLazy = lazyWithRetry(() =>
  import("../components/TripTrackingTab").then((m) => ({
    default: m.TripTrackingTab,
  })),
);

export const TripDetailCargoTabLazy = lazyWithRetry(() =>
  import("../components/trip-cargos").then((m) => ({
    default: m.TripDetailCargoTab,
  })),
);

export const TripDetailCostsTabLazy = lazyWithRetry(() =>
  import("../components/trip-costs").then((m) => ({
    default: m.TripDetailCostsTab,
  })),
);

export function TripDetailTabFallback() {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
