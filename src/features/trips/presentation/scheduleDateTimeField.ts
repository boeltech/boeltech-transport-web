import {
  mexicoTodayAt,
  mexicoTomorrowAt,
  TRIP_SCHEDULE_DEFAULT_TIME,
  type DateTimePreset,
} from "@shared/ui/form";

export function tripScheduleDateTimeFieldProps(labels: {
  todayAtEight: string;
  tomorrowAtEight: string;
}): {
  defaultTimeOnDateSelect: string;
  presets: DateTimePreset[];
} {
  return {
    defaultTimeOnDateSelect: TRIP_SCHEDULE_DEFAULT_TIME,
    presets: [
      {
        label: labels.todayAtEight,
        value: mexicoTodayAt(TRIP_SCHEDULE_DEFAULT_TIME),
      },
      {
        label: labels.tomorrowAtEight,
        value: mexicoTomorrowAt(TRIP_SCHEDULE_DEFAULT_TIME),
      },
    ],
  };
}
