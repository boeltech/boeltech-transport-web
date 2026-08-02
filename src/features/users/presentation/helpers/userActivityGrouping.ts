/**
 * Agrupación por día del historial de usuarios.
 *
 * El API devuelve los eventos ordenados de más reciente a más antiguo; aquí solo
 * se parten en bloques de día civil (hora de México) para que la lista no repita
 * la fecha completa en cada fila.
 */

import { formatDate, getTodayString, toMexicoDayKey } from "@shared/utils/dateUtils";
import type { UserManagementEvent } from "../../domain";
import { userActivityPageCopy } from "../copy/userActivityPageCopy";

const UNDATED_KEY = "";

export interface UserActivityDayGroup {
  /** Día civil "YYYY-MM-DD" en México, o cadena vacía si el evento no trae fecha. */
  readonly key: string;
  readonly label: string;
  readonly events: readonly UserManagementEvent[];
}

function previousDay(dayKey: string): string {
  const date = new Date(`${dayKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().substring(0, 10);
}

function dayLabel(dayKey: string, today: string): string {
  const copy = userActivityPageCopy.groups;
  if (dayKey === UNDATED_KEY) return copy.undated;
  if (dayKey === today) return copy.today;
  if (dayKey === previousDay(today)) return copy.yesterday;
  return formatDate(dayKey);
}

export function groupUserActivityByDay(
  events: readonly UserManagementEvent[],
  today: string = getTodayString(),
): UserActivityDayGroup[] {
  const buckets = new Map<string, UserManagementEvent[]>();

  for (const event of events) {
    const key = toMexicoDayKey(event.createdAt) ?? UNDATED_KEY;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(event);
    } else {
      buckets.set(key, [event]);
    }
  }

  return Array.from(buckets, ([key, groupEvents]) => ({
    key,
    label: dayLabel(key, today),
    events: groupEvents,
  }));
}
