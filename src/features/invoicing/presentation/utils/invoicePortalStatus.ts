import type { InvoiceStatus } from "../../domain";
import { invoicingCopy } from "../copy/invoicingCopy";

export function resolveInvoicePortalStatusLabel(status: InvoiceStatus): string {
  return invoicingCopy.detail.statusLabelsClient[status];
}
