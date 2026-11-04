import { formatDate } from "@shared/utils/dateUtils";
import type { DispatchPeriodWindowFields } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { isEventHoursWindow } from "./formatDispatchPeriod";

/** Label corto del periodo para la franja sticky de Mesa de corte. */
export function formatDispatchPeriodCutLabel(
  window: DispatchPeriodWindowFields,
): string {
  const copy = dispatchRunsCopy.detail;
  if (isEventHoursWindow(window)) {
    return copy.periodShortEvent(window.windowHours);
  }
  if (window.inclusiveStart && window.inclusiveEnd) {
    return copy.periodShortCalendar(
      formatDate(window.inclusiveStart),
      formatDate(window.inclusiveEnd),
    );
  }
  return copy.titleFallback;
}
