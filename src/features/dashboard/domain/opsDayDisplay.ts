/**
 * Helpers de presentación «Viajes de hoy» (I4 / D33) — sin lógica de contrato.
 */

import type {
  TripOpsDayDelayKind,
  TripOpsDayItem,
  TripOpsDaySummary,
} from "@features/trips/domain";

export type OpsDayBucketId =
  | "departing"
  | "in_progress"
  | "overdue"
  | "arrived";

/** Aproximación al universo del día (API no expone total único; conteos pueden solapar). */
export function opsDayApproximateTotal(
  counts: TripOpsDaySummary["counts"],
): number {
  return counts.departing + counts.inProgress + counts.arrived;
}

export function buildOpsDayAllHref(todayCdmx: string): string {
  return `/trips?opsDay=${encodeURIComponent(todayCdmx)}`;
}

export function buildOpsDayBucketHref(
  bucket: OpsDayBucketId,
  todayCdmx: string,
): string {
  switch (bucket) {
    case "departing":
      return `/trips?status=scheduled&dateFrom=${encodeURIComponent(todayCdmx)}&dateTo=${encodeURIComponent(todayCdmx)}`;
    case "in_progress":
      return "/trips?status=in_progress";
    case "overdue":
      return "/trips?overdue=1";
    case "arrived":
      return `/trips?status=completed&dateFrom=${encodeURIComponent(todayCdmx)}&dateTo=${encodeURIComponent(todayCdmx)}`;
  }
}

/** Subtexto D33 bajo la hora: `no ha salido` / `{N} h tarde` / `<1 h tarde`. */
export function formatOpsDayDelaySubtext(
  delayKind: TripOpsDayDelayKind | null,
  delayMs: number | null,
): string | null {
  if (delayKind === "departure") {
    return "salida · no ha salido";
  }
  if (delayKind === "arrival") {
    const late =
      delayMs == null || !Number.isFinite(delayMs) || delayMs < 3_600_000
        ? "<1 h tarde"
        : `${Math.floor(delayMs / 3_600_000)} h tarde`;
    return `llegada · ${late}`;
  }
  return null;
}

export type OpsDayRowBucket =
  | "overdue"
  | "departing"
  | "in_progress"
  | "arrived"
  | "other";

export function resolveOpsDayRowBucket(item: TripOpsDayItem): OpsDayRowBucket {
  if (item.delayKind != null) return "overdue";
  if (item.status === "scheduled") return "departing";
  if (item.status === "in_progress") return "in_progress";
  if (item.status === "completed") return "arrived";
  return "other";
}

export function opsDayBucketLabel(bucket: OpsDayRowBucket): string {
  switch (bucket) {
    case "overdue":
      return "Con retraso";
    case "departing":
      return "Por salir";
    case "in_progress":
      return "En ruta";
    case "arrived":
      return "Llegó";
    default:
      return "—";
  }
}

export function opsDayBucketBadgeVariant(
  bucket: OpsDayRowBucket,
): "warning" | "neutral" | "info" | "success" {
  switch (bucket) {
    case "overdue":
      return "warning";
    case "departing":
      return "neutral";
    case "in_progress":
      return "info";
    case "arrived":
      return "success";
    default:
      return "neutral";
  }
}

/** ISO principal a mostrar en columna Hora + hint de rol. */
export function resolveOpsDayHour(
  item: TripOpsDayItem,
  bucket: OpsDayRowBucket,
): { iso: string | null; hint: string | null } {
  const delaySub = formatOpsDayDelaySubtext(item.delayKind, item.delayMs);
  if (bucket === "overdue") {
    if (item.delayKind === "departure") {
      return { iso: item.scheduledDeparture, hint: delaySub };
    }
    return { iso: item.scheduledArrival, hint: delaySub };
  }
  if (bucket === "departing") {
    return { iso: item.scheduledDeparture, hint: "salida" };
  }
  if (bucket === "in_progress") {
    return { iso: item.scheduledArrival, hint: "llegada estimada" };
  }
  if (bucket === "arrived") {
    return { iso: item.actualArrival ?? item.scheduledArrival, hint: "llegó" };
  }
  return { iso: item.scheduledDeparture, hint: null };
}
