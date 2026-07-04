import {
  computeRepFiscalDeadline,
  type RepFiscalDeadlineStatus,
} from "@boeltech/cfdi-domain";
import type { Payment } from "@features/invoicing/domain";

export function getRepFiscalDeadlineForPayment(payment: Payment): {
  deadlineDate: string;
  status: RepFiscalDeadlineStatus;
  daysUntilDeadline: number;
} {
  return computeRepFiscalDeadline({
    paymentDate: payment.paymentDate,
    repStatus: payment.repStatus,
  });
}

export function getWorstRepFiscalDeadlineStatus(
  payments: readonly Payment[],
): RepFiscalDeadlineStatus | null {
  let worst: RepFiscalDeadlineStatus | null = null;
  for (const payment of payments) {
    const { status } = getRepFiscalDeadlineForPayment(payment);
    if (status === "overdue") return "overdue";
    if (status === "approaching") worst = "approaching";
  }
  return worst;
}

export function hasRepFiscalDeadlineAlert(payments: readonly Payment[]): boolean {
  const worst = getWorstRepFiscalDeadlineStatus(payments);
  return worst === "approaching" || worst === "overdue";
}

export function formatRepFiscalDeadlineLabel(deadlineDate: string): string {
  const [year, month, day] = deadlineDate.split("-");
  return `${day}/${month}/${year}`;
}

export function formatPaymentReceivedAt(
  paymentDate: string,
  paymentTime?: string,
): string {
  if (!paymentTime || paymentTime === "12:00:00") {
    return paymentDate;
  }
  return `${paymentDate} ${paymentTime.slice(0, 5)}`;
}
