import { useState } from "react";
import { Wallet } from "lucide-react";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import type { BillingArrears } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/billingFormatters";

interface BillingArrearsCardProps {
  data: BillingArrears;
  isLoading?: boolean;
  /** Fecha límite de gracia (label ya formateado desde la page). */
  graceDeadlineLabel?: string;
  /** billing.update + Stripe publishable + gateway up. */
  canPayWithStripe?: boolean;
  hasDefaultPaymentMethod?: boolean;
  payingInvoiceId?: string | null;
  onPayInvoice?: (invoiceId: string) => void | Promise<void>;
}

export function BillingArrearsCard({
  data,
  isLoading = false,
  graceDeadlineLabel = "",
  canPayWithStripe = false,
  hasDefaultPaymentMethod = false,
  payingInvoiceId = null,
  onPayInvoice,
}: BillingArrearsCardProps) {
  const copy = billingCopy.arrears;
  const [localPayingId, setLocalPayingId] = useState<string | null>(null);
  const activePayingId = payingInvoiceId ?? localPayingId;

  const handlePay = async (invoiceId: string) => {
    if (!onPayInvoice) return;
    setLocalPayingId(invoiceId);
    try {
      await onPayInvoice(invoiceId);
    } finally {
      setLocalPayingId(null);
    }
  };

  return (
    <Card
      className={cn(
        "border-warning/40 bg-warning-soft text-warning-soft-foreground",
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription className="text-warning-soft-foreground/80">
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-warning-soft-foreground/80">
            {copy.loading}
          </p>
        ) : (
          <>
            {data.invoices.some(
              (invoice) => invoice.lastAutoCharge?.outcome === "failed",
            ) ? (
              <AlertWithIcon
                variant="warning"
                title={copy.autoChargeFailed}
              >
                {copy.autoChargeFailedHint}
              </AlertWithIcon>
            ) : null}
            {data.invoices.some(
              (invoice) =>
                invoice.lastAutoCharge?.outcome === "requires_action",
            ) ? (
              <AlertWithIcon
                variant="warning"
                title={copy.autoChargeRequiresAction}
              >
                {copy.autoChargeRequiresActionHint}
              </AlertWithIcon>
            ) : null}

            <div className="space-y-1">
              <p className="text-sm text-warning-soft-foreground/80">
                {copy.totalLabel}
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {formatBillingPriceCents(data.totalOpenCents)}
              </p>
              <p className="text-xs text-warning-soft-foreground/80">
                {copy.openCount(data.openCount)}
              </p>
              {graceDeadlineLabel ? (
                <p className="text-sm text-warning-soft-foreground/90">
                  {copy.graceOperate(graceDeadlineLabel)}
                </p>
              ) : null}
            </div>

            <ul className="divide-y divide-warning/25 rounded-lg border border-warning/30 bg-background/40">
              {data.invoices.map((invoice) => {
                const periodLabel = formatBillingPeriodKey(invoice.periodKey);
                const amountLabel = formatBillingPriceCents(
                  invoice.amountDueCents,
                );
                const dateLabel = invoice.dueDate
                  ? formatDate(invoice.dueDate)
                  : null;
                const isOverdue = invoice.daysOverdue > 0;
                const duePart = dateLabel
                  ? isOverdue
                    ? copy.overdueOn(dateLabel)
                    : copy.dueOn(dateLabel)
                  : null;
                const statusPart = isOverdue
                  ? copy.daysOverdue(invoice.daysOverdue)
                  : copy.pendingPayment;
                const statusLine = [duePart, statusPart]
                  .filter(Boolean)
                  .join(" · ");
                const showPay =
                  canPayWithStripe &&
                  hasDefaultPaymentMethod &&
                  Boolean(onPayInvoice) &&
                  invoice.status === "open";
                const isPaying = activePayingId === invoice.id;

                return (
                  <li
                    key={invoice.id}
                    className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{periodLabel}</p>
                      {statusLine ? (
                        <p className="text-sm text-warning-soft-foreground/80">
                          {statusLine}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <p className="text-sm font-semibold tabular-nums">
                        {amountLabel}
                      </p>
                      {showPay ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isPaying || Boolean(activePayingId)}
                          onClick={() => void handlePay(invoice.id)}
                        >
                          {isPaying ? copy.paying : copy.payNow}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            {canPayWithStripe && !hasDefaultPaymentMethod ? (
              <p className="text-xs text-warning-soft-foreground/80">
                {copy.payNeedsCard}
              </p>
            ) : null}

            <p className="text-xs text-warning-soft-foreground/80">
              {copy.footer}
            </p>
            <p className="text-sm">
              <a
                className="font-medium underline underline-offset-4"
                href={`mailto:${billingCopy.contact.email}`}
              >
                {copy.contactCta}
              </a>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
