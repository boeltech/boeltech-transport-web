import { lazy } from "react";

import { Skeleton } from "@shared/ui/skeleton";

export const TripTrackingTabLazy = lazy(() =>
  import("../components/TripTrackingTab").then((m) => ({
    default: m.TripTrackingTab,
  })),
);

export const TripDetailCargoTabLazy = lazy(() =>
  import("../components/trip-cargos").then((m) => ({
    default: m.TripDetailCargoTab,
  })),
);

export const TripDetailCostsTabLazy = lazy(() =>
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
