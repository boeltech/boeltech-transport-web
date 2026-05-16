import { useMemo } from "react";

import type { TripListItem } from "@features/trips/domain";
import { useCatalogOptions } from "@features/catalogs";
import {
  formatTripListRouteLabel,
  type TripListRouteSummary,
} from "../stopLocalityDisplay";

export function useTripListRouteLabel(trip: TripListRouteSummary): string {
  const { data: stateOptions = [] } = useCatalogOptions("sat_estado");
  const originStateCode = trip.originState?.trim() || undefined;
  const destinationStateCode = trip.destinationState?.trim() || undefined;
  const { data: originMunicipalityOptions = [] } = useCatalogOptions(
    "sat_municipio",
    {
      parentCode: originStateCode,
      enabled: Boolean(originStateCode),
    },
  );
  const { data: destinationMunicipalityOptions = [] } = useCatalogOptions(
    "sat_municipio",
    {
      parentCode: destinationStateCode,
      enabled: Boolean(destinationStateCode),
    },
  );

  return useMemo(
    () =>
      formatTripListRouteLabel(trip, {
        originMunicipalityOptions,
        destinationMunicipalityOptions,
        stateOptions,
      }),
    [
      destinationMunicipalityOptions,
      originMunicipalityOptions,
      stateOptions,
      trip,
    ],
  );
}

export type TripListRouteLabelTrip = Pick<
  TripListItem,
  "originCity" | "originState" | "destinationCity" | "destinationState"
>;
