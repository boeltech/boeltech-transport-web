import { CreditCard, FileCheck2, FileText, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Separator } from "@shared/ui/separator";
import { InfoRow } from "@shared/ui/data-display";
import {
  useRegimenFiscalLabel,
  useFormaPagoLabel,
  useMetodoPagoLabel,
} from "@features/catalogs";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  getInvoiceDisplayAmounts,
  type Invoice,
} from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail;

interface InvoiceDetailFiscalLabelsProps {
  invoice: Invoice;
}

export function InvoiceDetailComprobanteCard({
  invoice,
}: InvoiceDetailFiscalLabelsProps) {
  const { label: receiverTaxRegimeLabel } = useRegimenFiscalLabel(
    invoice.receiverTaxRegime,
  );
  const { label: paymentFormLabel } = useFormaPagoLabel(invoice.paymentForm);
  const { label: paymentMethodLabel } = useMetodoPagoLabel(invoice.paymentMethod);
  const showExchangeRate =
    invoice.currency.toUpperCase() !== "MXN" || invoice.exchangeRate !== 1;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
          {copy.section.comprobante}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <UserRound className="h-4 w-4 text-muted-foreground" aria-hidden />
            {copy.section.receiver}
          </h3>
          <div className="grid gap-x-6 sm:grid-cols-2">
            <InfoRow
              variant="inline"
              label={invoicingCopy.label.receiverName}
              value={invoice.receiverName || "—"}
            />
            <InfoRow
              variant="inline"
              label={invoicingCopy.label.rfc}
              value={invoice.receiverRfc || "—"}
              copyable
              mono
            />
            <InfoRow
              variant="inline"
              label={invoicingCopy.label.taxRegime}
              value={receiverTaxRegimeLabel ?? invoice.receiverTaxRegime ?? "—"}
            />
            <InfoRow
              variant="inline"
              label={invoicingCopy.label.postalCode}
              value={invoice.receiverPostalCode || "—"}
            />
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden />
            {copy.section.paymentTerms}
          </h3>
          <div className="grid gap-x-6 sm:grid-cols-2">
            <InfoRow
              variant="inline"
              label={invoicingCopy.label.cfdiUsage}
              value={invoice.cfdiUsage || "—"}
            />
            <InfoRow
              variant="inline"
              label={copy.label.paymentForm}
              value={paymentFormLabel ?? invoice.paymentForm ?? "—"}
            />
            <InfoRow
              variant="inline"
              label={copy.label.paymentMethod}
              value={paymentMethodLabel ?? invoice.paymentMethod ?? "—"}
            />
            <InfoRow
              variant="inline"
              label={copy.label.currency}
              value={invoice.currency}
            />
            {showExchangeRate ? (
              <InfoRow
                variant="inline"
                label={copy.label.exchangeRate}
                value={invoice.exchangeRate.toFixed(4)}
              />
            ) : null}
            <InfoRow
              variant="inline"
              label={copy.label.issueDate}
              value={formatDate(invoice.issuedAt)}
            />
          </div>
        </section>

        {(invoice.cfdiUuid || invoice.stampedAt || invoice.pacProvider) ? (
          <>
            <Separator />
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <FileCheck2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                {copy.section.stamping}
              </h3>
              <div className="grid gap-x-6 sm:grid-cols-2">
                {invoice.cfdiUuid ? (
                  <InfoRow
                    variant="inline"
                    label={copy.label.cfdiUuid}
                    value={invoice.cfdiUuid}
                    copyable
                    mono
                  />
                ) : null}
                {invoice.stampedAt ? (
                  <InfoRow
                    variant="inline"
                    label={copy.label.stampedAt}
                    value={formatDateTime(invoice.stampedAt)}
                  />
                ) : null}
                {invoice.pacProvider ? (
                  <InfoRow
                    variant="inline"
                    label={copy.label.pacProvider}
                    value={invoice.pacProvider}
                  />
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function InvoiceDetailAmountsPanel({
  invoice,
  displayAmounts,
}: InvoiceDetailFiscalLabelsProps & {
  displayAmounts: ReturnType<typeof getInvoiceDisplayAmounts>;
}) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {copy.section.amounts}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm">
          <InfoRow
            variant="inline"
            label={copy.label.subtotal}
            value={formatMxCurrency(invoice.subtotal)}
          />
          {invoice.discount > 0 ? (
            <InfoRow
              variant="inline"
              label={copy.label.discount}
              value={`-${formatMxCurrency(invoice.discount)}`}
              className="text-success"
            />
          ) : null}
          <InfoRow
            variant="inline"
            label={copy.label.ivaTrasladado}
            value={formatMxCurrency(invoice.totalTax)}
          />
          {invoice.retainedTax > 0 ? (
            <InfoRow
              variant="inline"
              label={copy.label.ivaRetenido}
              value={`-${formatMxCurrency(invoice.retainedTax)}`}
              className="text-warning"
            />
          ) : null}
        </div>

        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-3">
          <InfoRow
            variant="inline"
            label={copy.label.total}
            value={
              <span className="text-lg font-semibold tabular-nums">
                {formatMxCurrency(invoice.total)}
              </span>
            }
          />
        </div>

        <Separator />

        <div className="space-y-1 text-sm">
          <InfoRow
            variant="inline"
            label={copy.label.paid}
            value={formatMxCurrency(displayAmounts.totalPaid)}
            className="text-success"
          />
          {displayAmounts.balanceDue > 0 ? (
            <InfoRow
              variant="inline"
              label={copy.label.balance}
              value={formatMxCurrency(displayAmounts.balanceDue)}
              className="font-medium text-warning"
            />
          ) : displayAmounts.isPueSettled ? (
            <p className="text-xs text-muted-foreground">
              {copy.hint.pueSettled}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function InvoiceDetailIssuerReceiverCards({
  invoice,
}: InvoiceDetailFiscalLabelsProps) {
  return <InvoiceDetailComprobanteCard invoice={invoice} />;
}

export function InvoiceDetailCfdiAmountsCard({
  invoice,
  displayAmounts,
}: InvoiceDetailFiscalLabelsProps & {
  displayAmounts: ReturnType<typeof getInvoiceDisplayAmounts>;
}) {
  return (
    <InvoiceDetailAmountsPanel
      invoice={invoice}
      displayAmounts={displayAmounts}
    />
  );
}
