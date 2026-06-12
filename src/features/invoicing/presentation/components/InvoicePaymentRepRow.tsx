import { Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { RepStatusBadge } from "../config/repStatusConfig";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { Payment } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail;

interface InvoicePaymentRepRowProps {
  payment: Payment;
  onRetry: (paymentId: string) => void;
  retryingPaymentId: string | null;
}

export function InvoicePaymentRepRow({
  payment,
  onRetry,
  retryingPaymentId,
}: InvoicePaymentRepRowProps) {
  const retrying = retryingPaymentId === payment.id;

  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-muted/40 rounded-md text-sm">
      <div className="space-y-1 min-w-0">
        <p className="font-medium">{formatMxCurrency(payment.amountMxn)}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(payment.paymentDate)} •{" "}
          {payment.paymentFormName ?? payment.paymentForm}
          {payment.reference && ` • ${copy.label.ref}: ${payment.reference}`}
        </p>
        {payment.repStatus !== "not_required" && (
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <RepStatusBadge status={payment.repStatus} />
            {payment.repStatus === "stamped" && payment.repCfdiUuid && (
              <p className="text-xs text-muted-foreground font-mono truncate">
                {copy.label.repUuid}: {payment.repCfdiUuid}
                {payment.repStampedAt && ` • ${formatDate(payment.repStampedAt)}`}
              </p>
            )}
            {payment.repStatus === "failed" && payment.repLastError && (
              <p className="text-xs text-destructive truncate max-w-md">
                {payment.repLastError}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {payment.createdByName && (
          <span className="text-xs text-muted-foreground">
            {payment.createdByName}
          </span>
        )}
        {payment.repStatus === "failed" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={retrying}
            onClick={() => onRetry(payment.id)}
          >
            {retrying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              copy.label.repRetry
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
