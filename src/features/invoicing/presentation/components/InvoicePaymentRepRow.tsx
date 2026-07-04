import { FileCode, Download, Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { RepStatusBadge } from "../config/repStatusConfig";
import { CopyableUuidSubtitle } from "./CopyableUuidSubtitle";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { Payment } from "@features/invoicing/domain";
import {
  downloadRepXml,
  useOpenRepPdf,
} from "@features/invoicing/application";
import {
  formatPaymentReceivedAt,
  formatRepFiscalDeadlineLabel,
  getRepFiscalDeadlineForPayment,
} from "../helpers/repFiscalDeadlineUx";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail;

interface InvoicePaymentRepRowProps {
  payment: Payment;
  invoiceId: string;
  invoiceSerieFolio: string;
  canExportFiles: boolean;
  onRetry: (paymentId: string) => void;
  retryingPaymentId: string | null;
}

function buildRepXmlFilename(
  serieFolio: string,
  numParcialidad: number | null,
): string {
  const suffix = numParcialidad != null ? `-p${numParcialidad}` : "";
  return `rep-${serieFolio}${suffix}.xml`;
}

function buildRepPdfFilename(
  serieFolio: string,
  numParcialidad: number | null,
): string {
  const suffix = numParcialidad != null ? `-p${numParcialidad}` : "";
  return `rep-${serieFolio}${suffix}.pdf`;
}

function formatInstallmentLine(payment: Payment): string | null {
  if (payment.repStatus === "not_required") return null;
  if (payment.repNumParcialidad == null) return null;

  const parcialidadLabel =
    payment.repStatus === "stamped"
      ? `${copy.label.repParcialidad} ${payment.repNumParcialidad}`
      : copy.label.repParcialidadEstimated(payment.repNumParcialidad);

  const parts = [parcialidadLabel];

  if (payment.repStatus === "stamped") {
    if (payment.repImpSaldoAnt != null) {
      parts.push(
        `${copy.label.repSaldoAnt}: ${formatMxCurrency(payment.repImpSaldoAnt)}`,
      );
    }
    if (payment.repImpPagado != null) {
      parts.push(
        `${copy.label.repPagado}: ${formatMxCurrency(payment.repImpPagado)}`,
      );
    }
    if (payment.repImpSaldoInsoluto != null) {
      parts.push(
        `${copy.label.repSaldoInsoluto}: ${formatMxCurrency(payment.repImpSaldoInsoluto)}`,
      );
    }
  }

  return parts.join(" • ");
}

export function InvoicePaymentRepRow({
  payment,
  invoiceId,
  invoiceSerieFolio,
  canExportFiles,
  onRetry,
  retryingPaymentId,
}: InvoicePaymentRepRowProps) {
  const { toast } = useToast();
  const retrying = retryingPaymentId === payment.id;
  const fiscalDeadline =
    payment.repStatus === "pending" ||
    payment.repStatus === "failed" ||
    payment.repStatus === "restamp_pending" ||
    payment.repStatus === "cancelling"
      ? getRepFiscalDeadlineForPayment(payment)
      : null;
  const receivedAtLabel = formatPaymentReceivedAt(
    formatDate(payment.paymentDate),
    payment.paymentTime,
  );
  const displayAmountMxn =
    payment.repStatus === "stamped" && payment.repImpPagado != null
      ? payment.repImpPagado
      : payment.amountMxn;
  const installmentLine = formatInstallmentLine(payment);
  const showRepFiles =
    canExportFiles &&
    payment.repStatus === "stamped" &&
    (payment.hasRepXml || payment.repCfdiUuid);

  const { mutate: openRepPdf, isPending: openingRepPdf } = useOpenRepPdf({
    onError: (err) =>
      toast({
        variant: "destructive",
        title: copy.toast.repPdfError,
        description: getErrorMessage(err),
      }),
  });

  const handleDownloadXml = () => {
    try {
      downloadRepXml(
        invoiceId,
        payment.id,
        buildRepXmlFilename(invoiceSerieFolio, payment.repNumParcialidad),
      );
    } catch (err) {
      toast({
        variant: "destructive",
        title: copy.toast.repXmlError,
        description: getErrorMessage(err),
      });
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-muted/40 rounded-md text-sm">
      <div className="space-y-1 min-w-0">
        <p className="font-medium">{formatMxCurrency(displayAmountMxn)}</p>
        <p className="text-xs text-muted-foreground">
          {receivedAtLabel} •{" "}
          {payment.paymentFormName ?? payment.paymentForm}
          {payment.reference && ` • ${copy.label.ref}: ${payment.reference}`}
        </p>
        {payment.repStatus !== "not_required" && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex flex-wrap items-center gap-2">
              <RepStatusBadge status={payment.repStatus} />
              {fiscalDeadline?.status === "approaching" && (
                <p className="text-xs text-warning">
                  {copy.hint.repFiscalDeadlineRowApproaching(
                    formatRepFiscalDeadlineLabel(fiscalDeadline.deadlineDate),
                  )}
                </p>
              )}
              {fiscalDeadline?.status === "overdue" && (
                <p className="text-xs text-destructive">
                  {copy.hint.repFiscalDeadlineRowOverdue(
                    formatRepFiscalDeadlineLabel(fiscalDeadline.deadlineDate),
                  )}
                </p>
              )}
            </div>
            {installmentLine && (
              <p className="text-xs text-muted-foreground">{installmentLine}</p>
            )}
            {payment.repStatus === "stamped" && payment.repCfdiUuid && (
              <CopyableUuidSubtitle
                uuid={payment.repCfdiUuid}
                label={copy.label.repUuid}
                copyAriaLabel={copy.header.repUuidCopyLabel}
                size="sm"
              />
            )}
            {payment.repStatus === "stamped" && payment.repStampedAt && (
              <p className="text-xs text-muted-foreground">
                {copy.label.stampedAt}: {formatDate(payment.repStampedAt)}
              </p>
            )}
            {payment.repStatus === "failed" && payment.repLastError && (
              <p className="text-xs text-destructive truncate max-w-md">
                {payment.repLastError}
              </p>
            )}
            {showRepFiles && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {payment.hasRepXml && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handleDownloadXml}
                    title={copy.header.repXmlTitle}
                  >
                    <FileCode className="mr-1.5 h-3.5 w-3.5" />
                    {copy.header.repXml}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={openingRepPdf}
                  onClick={() =>
                    openRepPdf({
                      invoiceId,
                      paymentId: payment.id,
                      filename: buildRepPdfFilename(
                        invoiceSerieFolio,
                        payment.repNumParcialidad,
                      ),
                    })
                  }
                  title={copy.header.repPdfTitle}
                >
                  {openingRepPdf ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {copy.header.repPdf}
                </Button>
              </div>
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
