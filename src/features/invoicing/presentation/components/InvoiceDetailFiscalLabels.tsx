import { CreditCard, FileCheck2, Building2, UserRound } from "lucide-react";
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

/** Condiciones de cobro (banda «Qué se cobró») — sin repetir cliente ni sellado. */
export function InvoiceDetailPaymentTermsCard({
  invoice,
}: InvoiceDetailFiscalLabelsProps) {
  const { label: paymentFormLabel } = useFormaPagoLabel(invoice.paymentForm);
  const { label: paymentMethodLabel } = useMetodoPagoLabel(invoice.paymentMethod);
  const showExchangeRate =
    invoice.currency.toUpperCase() !== "MXN" || invoice.exchangeRate !== 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden />
          {copy.section.paymentTerms}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-6 sm:grid-cols-2">
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
          <InfoRow
            variant="inline"
            label={invoicingCopy.label.cfdiUsage}
            value={invoice.cfdiUsage || "—"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Desglose compacto bajo conceptos (D3): sin repetir Total/Cobrado/Por cobrar
 * con el mismo peso que los KPIs.
 */
export function InvoiceDetailAmountsPanel({
  invoice,
  displayAmounts,
}: InvoiceDetailFiscalLabelsProps & {
  displayAmounts: ReturnType<typeof getInvoiceDisplayAmounts>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{copy.section.amounts}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
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
        {displayAmounts.isPueSettled ? (
          <>
            <Separator className="my-2" />
            <p
              className="text-xs text-muted-foreground"
              title={copy.hint.pueSettledTitle}
            >
              {copy.hint.pueSettled}
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Contenido del expediente (emisor + cliente fiscal + sellado). */
export function InvoiceDetailFiscalDossierBody({
  invoice,
}: InvoiceDetailFiscalLabelsProps) {
  const { label: issuerTaxRegimeLabel } = useRegimenFiscalLabel(
    invoice.issuerTaxRegime,
  );
  const { label: receiverTaxRegimeLabel } = useRegimenFiscalLabel(
    invoice.receiverTaxRegime,
  );

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
          {copy.section.issuer}
        </h3>
        <div className="grid gap-x-6 sm:grid-cols-2">
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
            value={invoice.issueLocation || "—"}
          />
        </div>
      </section>

      <Separator />

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
          <InfoRow
            variant="inline"
            label={invoicingCopy.label.cfdiUsage}
            value={invoice.cfdiUsage || "—"}
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
    </div>
  );
}

/** @deprecated Prefer PaymentTerms + FiscalDossier; se mantiene por reexports de tests. */
export function InvoiceDetailComprobanteCard({
  invoice,
}: InvoiceDetailFiscalLabelsProps) {
  return <InvoiceDetailPaymentTermsCard invoice={invoice} />;
}

export function InvoiceDetailIssuerReceiverCards({
  invoice,
}: InvoiceDetailFiscalLabelsProps) {
  return <InvoiceDetailFiscalDossierBody invoice={invoice} />;
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
