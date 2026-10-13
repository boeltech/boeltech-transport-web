import type {
  DispatchRunOrigin,
  DispatchRunStatus,
} from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

/** Evaluación automática vacía (API status cancelled; UI no dice «Cancelada»). */
export function isEmptyScheduledCancelled(
  origin: DispatchRunOrigin | string | null | undefined,
  status: DispatchRunStatus | string | null | undefined,
): boolean {
  return origin === "scheduled" && status === "cancelled";
}

export function getDispatchRunStatusLabel(
  status: string,
  origin?: DispatchRunOrigin | string | null,
): string {
  if (isEmptyScheduledCancelled(origin, status)) {
    return dispatchRunsCopy.emptyScheduled.label;
  }
  return (
    dispatchRunsCopy.status[status as DispatchRunStatus] ?? status
  );
}

export function getDispatchRunStatusTooltip(
  status: string,
  origin?: DispatchRunOrigin | string | null,
): string | undefined {
  if (isEmptyScheduledCancelled(origin, status)) {
    return dispatchRunsCopy.emptyScheduled.tooltip;
  }
  return undefined;
}
