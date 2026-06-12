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

export function InvoiceDetailIssuerReceiverCards({
  invoice,
}: InvoiceDetailFiscalLabelsProps) {
  const { label: issuerTaxRegimeLabel } = useRegimenFiscalLabel(
    invoice.issuerTaxRegime,
  );
  const { label: receiverTaxRegimeLabel } = useRegimenFiscalLabel(
    invoice.receiverTaxRegime,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {copy.section.issuer}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow
            variant="inline"
            label={invoicingCopy.label.issuerName}
            value={invoice.issuerName || "—"}
          />
          <InfoRow
            variant="inline"
            label={invoicingCopy.label.issuerRfc}
            value={invoice.issuerRfc || "—"}
            copyable
            mono
          />
          <InfoRow
            variant="inline"
            label={invoicingCopy.label.issuerRegime}
            value={issuerTaxRegimeLabel ?? invoice.issuerTaxRegime ?? "—"}
          />
          <InfoRow
            variant="inline"
            label={invoicingCopy.label.issueLocation}
            value={
              invoice.issueLocation ? `C.P. ${invoice.issueLocation}` : "—"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {copy.section.receiver}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
            label={invoicingCopy.label.cfdiUsage}
            value={invoice.cfdiUsage || "—"}
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
        </CardContent>
      </Card>
    </div>
  );
}

export function InvoiceDetailCfdiAmountsCard({
  invoice,
  displayAmounts,
}: InvoiceDetailFiscalLabelsProps & {
  displayAmounts: ReturnType<typeof getInvoiceDisplayAmounts>;
}) {
  const { label: paymentFormLabel } = useFormaPagoLabel(invoice.paymentForm);
  const { label: paymentMethodLabel } = useMetodoPagoLabel(invoice.paymentMethod);

  const showExchangeRate =
    invoice.currency.toUpperCase() !== "MXN" || invoice.exchangeRate !== 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {copy.section.cfdi}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <InfoRow
            variant="inline"
            label={copy.label.issueDate}
            value={formatDate(invoice.issuedAt)}
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

        <Separator className="my-4" />

        <div className="flex flex-col items-end gap-1 text-sm">
          <div className="flex justify-between w-48">
            <span className="text-muted-foreground">{copy.label.subtotal}</span>
            <span>{formatMxCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between w-48 text-success">
              <span>{copy.label.discount}</span>
              <span>-{formatMxCurrency(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between w-48">
            <span className="text-muted-foreground">
              {copy.label.ivaTrasladado}
            </span>
            <span>{formatMxCurrency(invoice.totalTax)}</span>
          </div>
          {invoice.retainedTax > 0 && (
            <div className="flex justify-between w-48 text-warning">
              <span>{copy.label.ivaRetenido}</span>
              <span>-{formatMxCurrency(invoice.retainedTax)}</span>
            </div>
          )}
          <Separator className="w-48 my-1" />
          <div className="flex justify-between w-48 font-bold text-base">
            <span>{copy.label.total}</span>
            <span>{formatMxCurrency(invoice.total)}</span>
          </div>
          <div className="flex justify-between w-48 text-success">
            <span>{copy.label.paid}</span>
            <span>{formatMxCurrency(displayAmounts.totalPaid)}</span>
          </div>
          {displayAmounts.balanceDue > 0 ? (
            <div className="flex justify-between w-48 text-destructive font-medium">
              <span>{copy.label.balance}</span>
              <span>{formatMxCurrency(displayAmounts.balanceDue)}</span>
            </div>
          ) : displayAmounts.isPueSettled ? (
            <p className="text-xs text-muted-foreground w-48 text-right">
              {copy.hint.pueSettled}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
