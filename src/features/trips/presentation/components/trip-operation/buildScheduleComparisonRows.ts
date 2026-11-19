import type { Trip } from "@features/trips/domain";
import { toUtcIsoInstantForParse } from "@shared/utils/dateUtils";

import { operationCopy } from "../../copy";

const copy = operationCopy.scheduleTable;
const empty = operationCopy.state.emptyDash;
const SCHEDULE_TZ = "America/Mexico_City";

function formatOdometerKm(value: number | null | undefined): string {
  if (value == null) return empty;
  return value.toLocaleString("es-MX");
}

/** RP-7: `12 nov 2026, 06:00` (24 h, sin a.m./p.m.). */
function formatScheduleDateTime(iso: string | null | undefined): string {
  if (!iso) return empty;
  const normalized = toUtcIsoInstantForParse(iso);
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return empty;
  const raw = d.toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SCHEDULE_TZ,
  });
  return raw.replace(/\s*(a\.?\s*m\.?|p\.?\s*m\.?)/gi, "").trim();
}

export type ScheduleComparisonRowId = "departure" | "arrival";

export interface ScheduleComparisonRow {
  readonly id: ScheduleComparisonRowId;
  readonly event: string;
  readonly scheduled: string;
  readonly actual: string;
  readonly difference: string;
  readonly mileageKm: string;
}

function formatDurationLabel(totalMinutes: number): string {
  const abs = Math.abs(totalMinutes);
  if (abs < 60) return `${abs} min`;
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function formatScheduleDifference(
  scheduled: Date | null | undefined,
  actual: Date | null | undefined,
): string {
  if (!scheduled || !actual) return empty;
  const diffMin = Math.round(
    (actual.getTime() - scheduled.getTime()) / 60_000,
  );
  if (diffMin === 0) return copy.onTime;
  const label = formatDurationLabel(diffMin);
  return diffMin > 0 ? copy.after(label) : copy.before(label);
}

export function formatTripDuration(
  start: Date | null | undefined,
  end: Date | null | undefined,
): string | null {
  if (!start || !end) return null;
  const diffMin = Math.round((end.getTime() - start.getTime()) / 60_000);
  if (diffMin < 0) return null;
  return formatDurationLabel(diffMin);
}

export function buildScheduleComparisonRows(trip: Trip): ScheduleComparisonRow[] {
  return [
    {
      id: "departure",
      event: copy.departure,
      scheduled: trip.scheduledDeparture
        ? formatScheduleDateTime(trip.scheduledDeparture.toISOString())
        : empty,
      actual: trip.actualDeparture
        ? formatScheduleDateTime(trip.actualDeparture.toISOString())
        : empty,
      difference: formatScheduleDifference(
        trip.scheduledDeparture,
        trip.actualDeparture,
      ),
      mileageKm: formatOdometerKm(trip.mileage.start),
    },
    {
      id: "arrival",
      event: copy.arrival,
      scheduled: trip.scheduledArrival
        ? formatScheduleDateTime(trip.scheduledArrival.toISOString())
        : empty,
      actual: trip.actualArrival
        ? formatScheduleDateTime(trip.actualArrival.toISOString())
        : empty,
      difference: formatScheduleDifference(
        trip.scheduledArrival,
        trip.actualArrival,
      ),
      mileageKm: formatOdometerKm(trip.mileage.end),
    },
  ];
}

export function buildScheduleFooterText(trip: Trip): string | null {
  const start = trip.mileage.start;
  const end = trip.mileage.end;
  const actualKm =
    start != null && end != null && end >= start
      ? `${Math.round(end - start).toLocaleString("es-MX")} km`
      : null;
  const planned =
    trip.totalDistRec != null && trip.totalDistRec > 0
      ? `${Math.round(trip.totalDistRec).toLocaleString("es-MX")} km`
      : null;
  const duration = formatTripDuration(
    trip.actualDeparture ?? trip.scheduledDeparture,
    trip.actualArrival,
  );
  if (!actualKm && !planned && !duration) return null;
  return copy.footer({ actualKm, plannedKm: planned, duration });
}
