import { useFormaPagoLabel } from "@features/catalogs";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { InfoRow } from "@shared/ui/data-display";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { COBROS_PAYMENT_FORM } from "../config/financeCobrosConfig";
import { financeCopy } from "../copy";

const copy = financeCopy.cobros;

interface FinanceCobrosConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: FinanceInvoiceListItem[];
  total: number;
  receiverRfc: string;
  paymentDate: string;
  reference: string;
  onReferenceChange: (value: string) => void;
  isPending?: boolean;
  onConfirm: () => void;
}

export function FinanceCobrosConfirmSheet({
  open,
  onOpenChange,
  invoices,
  total,
  receiverRfc,
  paymentDate,
  reference,
  onReferenceChange,
  isPending = false,
  onConfirm,
}: FinanceCobrosConfirmSheetProps) {
  const formattedTotal = formatMxCurrency(total);
  const clientName = invoices[0]?.receiverName?.trim() || receiverRfc;
  const { label: paymentFormLabel } = useFormaPagoLabel(COBROS_PAYMENT_FORM, {
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Overlay de lote: Sheet (excepción DS vs Dialog de pago 1:1; Capa 1 D9). */}
      <SheetContent className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 space-y-1 border-b px-6 py-4 text-left">
          <SheetTitle>{copy.sheetTitle}</SheetTitle>
          <SheetDescription>{copy.sheetDescription}</SheetDescription>
        </SheetHeader>
        <div
          data-slot="cobros-confirm-body"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4 text-sm"
        >
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.sheetTotal}
            </p>
            <p className="text-xl font-semibold tabular-nums">{formattedTotal}</p>
          </div>

          <div>
            <InfoRow
              variant="inline"
              label={copy.sheetClient}
              value={
                <span>
                  {clientName}
                  <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                    {receiverRfc}
                  </span>
                </span>
              }
            />
            <InfoRow
              variant="inline"
              label={copy.sheetPaymentDate}
              value={formatDate(paymentDate)}
            />
            <InfoRow
              variant="inline"
              label={copy.sheetPaymentTime}
              value={copy.sheetPaymentTimeValue}
            />
            <InfoRow
              variant="inline"
              label={copy.sheetPaymentForm}
              value={paymentFormLabel ?? COBROS_PAYMENT_FORM}
            />
          </div>

          <div className="space-y-2">
            <p className="font-medium">{copy.sheetInvoicesTitle}</p>
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {invoice.serie}-{invoice.folio}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {copy.sheetBalanceFull}
                  </p>
                </div>
                <span className="tabular-nums">
                  {formatMxCurrency(invoice.balanceDue)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cobros-payment-reference">{copy.sheetReference}</Label>
            <Input
              id="cobros-payment-reference"
              value={reference}
              onChange={(event) => onReferenceChange(event.target.value)}
              placeholder={copy.sheetReferencePlaceholder}
              maxLength={100}
            />
          </div>

          <AlertWithIcon variant="info" title={copy.sheetNoticeTitle}>
            {copy.sheetNoticeDescription}
          </AlertWithIcon>
        </div>
        <SheetFooter className="mt-auto shrink-0 gap-2 border-t bg-background px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {copy.cancel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending || total <= 0}
          >
            {isPending ? copy.submitting : copy.confirm(formattedTotal)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
