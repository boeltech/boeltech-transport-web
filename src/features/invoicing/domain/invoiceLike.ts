import type { InvoiceLike, SatCancellationStatus } from "@boeltech/cfdi-domain";
import type { Invoice, InvoiceListItem } from "./entities";

function toPaymentMethod(
  value: string,
): InvoiceLike["paymentMethod"] {
  return value === "PPD" ? "PPD" : "PUE";
}

function toSatCancellationStatus(
  value: string,
): SatCancellationStatus {
  if (
    value === "pending_receiver" ||
    value === "cancelled" ||
    value === "rejected"
  ) {
    return value;
  }
  return "none";
}

export function toInvoiceLike(invoice: Invoice): InvoiceLike {
  return {
    status: invoice.status,
    invoiceType: invoice.invoiceType,
    cfdiUuid: invoice.cfdiUuid,
    paymentMethod: toPaymentMethod(invoice.paymentMethod),
    currency: invoice.currency,
    total: invoice.total,
    totalPaid: invoice.totalPaid,
    satCancellationStatus: toSatCancellationStatus(invoice.satCancellationStatus),
    stampedAt: invoice.stampedAt,
  };
}

export function toInvoiceLikeFromListItem(item: InvoiceListItem): InvoiceLike {
  return {
    status: item.status,
    invoiceType: "ingreso",
    cfdiUuid: item.cfdiUuid,
    paymentMethod: toPaymentMethod(item.paymentMethod),
    currency: item.currency,
    total: item.total,
    totalPaid: item.totalPaid,
    satCancellationStatus: toSatCancellationStatus(item.satCancellationStatus),
    stampedAt: item.stampedAt,
  };
}
