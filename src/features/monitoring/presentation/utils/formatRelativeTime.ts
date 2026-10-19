import { monitoringCopy } from "../copy/monitoringCopy";

export function formatRelativeTime(
  iso: string | null | undefined,
  nowMs: number,
): string {
  if (!iso) return monitoringCopy.relativeTime.unknown;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return monitoringCopy.relativeTime.unknown;

  const diffSec = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (diffSec < 45) return monitoringCopy.relativeTime.justNow;
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return monitoringCopy.relativeTime.minutes(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return monitoringCopy.relativeTime.hours(hours);
  const days = Math.floor(hours / 24);
  return monitoringCopy.relativeTime.days(days);
}
