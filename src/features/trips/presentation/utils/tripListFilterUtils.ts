import type { TripInvoiceStatus } from "../../domain";
import { tripsListCopy } from "../copy/listCopy";

const TRIP_INVOICE_STATUS_FILTER_VALUES: TripInvoiceStatus[] = [
  "draft",
  "stamping",
  "stamped",
  "cancellation_pending",
  "cancelled",
];

export function parseTripInvoiceStatusFilter(
  raw: string | null,
): TripInvoiceStatus | undefined {
  if (!raw) return undefined;
  return TRIP_INVOICE_STATUS_FILTER_VALUES.includes(raw as TripInvoiceStatus)
    ? (raw as TripInvoiceStatus)
    : undefined;
}

export function getTripInvoiceStatusLabel(status: TripInvoiceStatus): string {
  return tripsListCopy.invoiceStatus[status];
}
