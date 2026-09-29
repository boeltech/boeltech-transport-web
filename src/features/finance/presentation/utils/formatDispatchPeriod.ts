import { formatDate } from "@shared/utils/dateUtils";
import type { DispatchPeriodWindowFields } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

export function isEventHoursWindow(
  window: Pick<DispatchPeriodWindowFields, "windowKind" | "windowHours">,
): window is { windowKind: "event_hours"; windowHours: number } {
  return window.windowKind === "event_hours" && window.windowHours != null;
}

/** Listado: `{inclusiveStart} — corte {cutDate}` o `Últimas {n} h`. Nunca usa periodEnd. */
export function formatDispatchPeriodListLabel(
  window: DispatchPeriodWindowFields,
): string {
  if (isEventHoursWindow(window)) {
    return dispatchRunsCopy.tab.table.periodEvent(window.windowHours);
  }
  if (window.inclusiveStart && window.cutDate) {
    return dispatchRunsCopy.tab.table.periodCalendar(
      formatDate(window.inclusiveStart),
      formatDate(window.cutDate),
    );
  }
  return "—";
}

/** Título del detalle. Nunca usa periodEnd como día inclusivo. */
export function formatDispatchRunTitle(
  window: DispatchPeriodWindowFields,
): string {
  const copy = dispatchRunsCopy.detail;
  if (isEventHoursWindow(window)) {
    return copy.titleEvent(window.windowHours);
  }
  if (window.inclusiveStart && window.inclusiveEnd) {
    return copy.titleCalendar(
      formatDate(window.inclusiveStart),
      formatDate(window.inclusiveEnd),
    );
  }
  return copy.titleFallback;
}

/** Copy D2: qué días entran y que el corte no entra. */
export function formatDispatchPeriodInclusiveCopy(
  window: DispatchPeriodWindowFields,
): string | null {
  const copy = dispatchRunsCopy.detail;
  if (isEventHoursWindow(window)) {
    return copy.periodEvent(window.windowHours);
  }
  if (window.inclusiveStart && window.inclusiveEnd && window.cutDate) {
    return copy.periodCalendar(
      formatDate(window.inclusiveStart),
      formatDate(window.inclusiveEnd),
      formatDate(window.cutDate),
    );
  }
  return null;
}
