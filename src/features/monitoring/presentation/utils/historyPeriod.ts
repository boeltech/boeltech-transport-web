/**
 * Presets de periodo historial (PRD D14–D15 / CA-26–27).
 * Default: últimas 4 h. Máx. 7 días.
 */

import {
  HISTORY_DEFAULT_HOURS,
  HISTORY_MAX_RANGE_MS,
} from "../../domain";

export type HistoryPeriodPreset =
  | "last4h"
  | "today"
  | "yesterday"
  | "last24h"
  | "custom";

export interface HistoryPeriodRange {
  from: Date;
  to: Date;
}

const CDMX = "America/Mexico_City";

/** Inicio de día civil en CDMX como Date UTC. */
function startOfDayCdmx(ref: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CDMX,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ref);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  // Medianoche CDMX ≈ UTC−6 (sin DST post-2022) — usamos offset fijo −06:00.
  return new Date(`${y}-${m}-${d}T00:00:00-06:00`);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function resolveHistoryPreset(
  preset: Exclude<HistoryPeriodPreset, "custom">,
  now: Date = new Date(),
): HistoryPeriodRange {
  const to = now;
  switch (preset) {
    case "last4h":
      return {
        from: new Date(now.getTime() - HISTORY_DEFAULT_HOURS * 60 * 60 * 1000),
        to,
      };
    case "last24h":
      return {
        from: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        to,
      };
    case "today": {
      return { from: startOfDayCdmx(now), to };
    }
    case "yesterday": {
      const todayStart = startOfDayCdmx(now);
      return { from: addDays(todayStart, -1), to: todayStart };
    }
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

export function isHistoryRangeValid(from: Date, to: Date): boolean {
  if (!(to.getTime() > from.getTime())) return false;
  return to.getTime() - from.getTime() <= HISTORY_MAX_RANGE_MS;
}

export function historyRangeError(
  from: Date,
  to: Date,
): "order" | "max" | null {
  if (!(to.getTime() > from.getTime())) return "order";
  if (to.getTime() - from.getTime() > HISTORY_MAX_RANGE_MS) return "max";
  return null;
}

export function toIsoRange(range: HistoryPeriodRange): {
  from: string;
  to: string;
} {
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  };
}
