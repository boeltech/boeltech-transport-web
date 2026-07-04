import type { Trip, UpdateTripInput } from "@features/trips/domain";
import { localInputToUtcIso } from "@shared/utils/dateUtils";

import { buildCreateLikeFromTrip } from "./tripCreateLikeFromTrip";
import { buildUpdateTripInputFromCreateInput } from "../../pages/create/updateTripPayloadShared";
import {
  buildScheduleOverrideFromTrip,
  findDestinationStop,
  mergeDestinationEstimatedArrivalFromSchedule,
} from "./tripScheduledArrivalSync";
import type { TripScheduleFormValues } from "./tripStopOperationalFields";

export function buildScheduleUpdateInput(
  trip: Trip,
  values: TripScheduleFormValues,
): UpdateTripInput {
  const destination = findDestinationStop(trip);
  if (destination) {
    const editedById = mergeDestinationEstimatedArrivalFromSchedule(trip, values);
    const scheduleOverride = buildScheduleOverrideFromTrip(trip, values);
    return buildUpdateTripInputFromCreateInput(
      buildCreateLikeFromTrip(trip, editedById, scheduleOverride),
    );
  }

  return {
    scheduledDeparture: localInputToUtcIso(values.scheduledDeparture),
    scheduledArrival: values.scheduledArrival
      ? localInputToUtcIso(values.scheduledArrival)
      : null,
  };
}
