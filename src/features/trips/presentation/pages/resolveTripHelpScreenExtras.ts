import type { TripStatusType } from "@features/trips/domain";
import type { HelpScreenExtras } from "@features/help-center/application";
import type { TripDetailTabValue } from "./tripDetailQueryGating";

const STATUS_TABS = new Set<TripDetailTabValue>([
  "route",
  "cargo",
  "overview",
  "tracking",
]);

/**
 * Opaque help extras for TripDetail (corte B). Never writes to the URL.
 * No status while the trip is loading; none on costs/billing (via b).
 */
export function resolveTripHelpScreenExtras(input: {
  tripStatus: TripStatusType | undefined;
  activeTab: TripDetailTabValue;
  tripLoaded: boolean;
}): HelpScreenExtras | null {
  if (!input.tripLoaded || input.tripStatus == null) {
    return null;
  }
  if (!STATUS_TABS.has(input.activeTab)) {
    return null;
  }
  return { status: input.tripStatus };
}
