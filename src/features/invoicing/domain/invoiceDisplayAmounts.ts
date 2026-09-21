import {
  isPueFiscallySettled,
  resolveInvoiceFinancialAmounts,
  type InvoiceLike,
  type SatCancellationStatus,
} from "@boeltech/cfdi-domain";
import type { Invoice, InvoiceListItem, InvoiceStatus } from "./entities";
import { toInvoiceLike, toInvoiceLikeFromListItem } from "./invoiceLike";

function toInvoiceLikeFromFields(fields: {
  status: InvoiceStatus;
  paymentMethod: string;
  total: number;
  totalPaid: number;
}): InvoiceLike {
  return {
    status: fields.status,
    invoiceType: "ingreso",
    cfdiUuid: null,
    paymentMethod: fields.paymentMethod === "PPD" ? "PPD" : "PUE",
    currency: "MXN",
    total: fields.total,
    totalPaid: fields.totalPaid,
    satCancellationStatus: "none" as SatCancellationStatus,
    stampedAt: null,
  };
}

function amountsFromLike(like: InvoiceLike) {
  const financial = resolveInvoiceFinancialAmounts(like);
  return {
    totalPaid: financial.totalPaid,
    balanceDue: financial.balanceDue,
    /** Atajo fiscal PUE (método de pago), no implica cobrada. */
    isPueSettled: isPueFiscallySettled(like),
  };
}

export function getDisplayAmountsFromInvoiceFields(fields: {
  status: InvoiceStatus;
  paymentMethod: string;
  total: number;
  totalPaid: number;
}) {
  return amountsFromLike(toInvoiceLikeFromFields(fields));
}

export function getInvoiceDisplayAmounts(invoice: Invoice) {
  return amountsFromLike(toInvoiceLike(invoice));
}

export function getInvoiceListItemDisplayAmounts(item: InvoiceListItem) {
  return amountsFromLike(toInvoiceLikeFromListItem(item));
}
