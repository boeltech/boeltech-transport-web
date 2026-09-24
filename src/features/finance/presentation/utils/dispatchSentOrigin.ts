import type { InvoiceListItem } from "@features/invoicing/domain";
import type { DispatchRunOrigin } from "../../domain/billingDispatchRun.types";

/**
 * Origen heurístico del envío en tab Enviadas (F4 / D6).
 * Automática solo si hay `lastScheduledRunId`; si no, Manual.
 */
export function resolveDispatchSentOrigin(
  invoice: InvoiceListItem,
): DispatchRunOrigin {
  return invoice.autoDispatch?.lastScheduledRunId ? "scheduled" : "manual";
}
