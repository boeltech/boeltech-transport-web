import { useMemo } from "react";
import type { TripStatusType } from "@features/trips/domain";
import { usePublishHelpScreenExtras } from "@features/help-center/application";
import type { TripDetailTabValue } from "./tripDetailQueryGating";
import { resolveTripHelpScreenExtras } from "./resolveTripHelpScreenExtras";

const OWNER_ID = "trip-detail";

/**
 * Publishes synthetic `status=` for help match while TripDetail is mounted.
 * Does not mutate `location.search` (TB-2 / CB-INJ-7).
 */
export function usePublishTripHelpScreenExtras(input: {
  tripStatus: TripStatusType | undefined;
  activeTab: TripDetailTabValue;
  tripLoaded: boolean;
}): void {
  const { tripStatus, activeTab, tripLoaded } = input;
  const extras = useMemo(
    () => resolveTripHelpScreenExtras({ tripStatus, activeTab, tripLoaded }),
    [tripStatus, activeTab, tripLoaded],
  );
  usePublishHelpScreenExtras(OWNER_ID, extras);
}
