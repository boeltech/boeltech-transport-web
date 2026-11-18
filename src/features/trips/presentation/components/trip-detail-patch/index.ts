export {
  mapTripStopToOperationalValues,
  mapTripToScheduleFormValues,
  type TripScheduleFormValues,
  type TripStopOperationalValues,
} from "./tripStopOperationalFields";
export { buildCreateLikeFromTrip } from "./tripCreateLikeFromTrip";
export {
  buildScheduleUpdateInput,
  buildScheduleUpdateFromDestinationEta,
  buildScheduleDestinationEtaReplaceStops,
} from "./tripSchedulePatch";
export {
  DESTINATION_ETA_MUST_BE_AFTER_DEPARTURE,
  isDestinationEtaAfterDeparture,
} from "./destinationEtaVsDeparture";
export { mapStopToCreateStopInput, resolveStopCityForApi } from "./mapStopToCreateStopInput";
