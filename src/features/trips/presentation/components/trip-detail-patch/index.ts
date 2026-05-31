export {
  getStopFiscalStatus,
  mapTripStopToOperationalValues,
  mapTripToScheduleFormValues,
  validateStopOperationalFields,
  type StopFiscalStatus,
  type TripScheduleFormValues,
  type TripStopOperationalValues,
} from "./tripStopOperationalFields";
export { buildScheduleUpdateInput } from "./tripSchedulePatch";
export { buildStopOperationalUpdateInput } from "./tripStopOperationalPatch";
export { mapStopToCreateStopInput, resolveStopCityForApi } from "./mapStopToCreateStopInput";
