import { DollarSign, Wallet, Scale } from "lucide-react";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { StatCardProps } from "@shared/ui/data-display";
import {
  getInvoiceDisplayAmounts,
  type Invoice,
} from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail;

export function buildInvoiceStats(invoice: Invoice): StatCardProps[] {
  const { totalPaid, balanceDue, isPueSettled } =
    getInvoiceDisplayAmounts(invoice);

  return [
    {
      title: copy.label.statTotal,
      value: formatMxCurrency(invoice.total),
      icon: <DollarSign className="h-5 w-5" />,
      tone: "primary",
    },
    {
      title: copy.label.statPaid,
      value: formatMxCurrency(totalPaid),
      icon: <Wallet className="h-5 w-5" />,
      tone: "success",
    },
    {
      title: copy.label.statBalance,
      value: formatMxCurrency(balanceDue),
      icon: <Scale className="h-5 w-5" />,
      tone: balanceDue > 0 ? "warning" : "neutral",
      description: isPueSettled ? copy.hint.pueSettled : undefined,
    },
  ];
}
