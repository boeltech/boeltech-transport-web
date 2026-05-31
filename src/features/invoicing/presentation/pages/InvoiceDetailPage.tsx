import { useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Download, FileText, FileCode, Loader2, Receipt, AlertCircle } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Separator } from "@shared/ui/separator";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { useRegimenFiscalLabel } from "@features/catalogs";
import {
  useInvoice,
  useOpenInvoicePdf,
  downloadInvoiceXml,
} from "@features/invoicing/application";
import type { Invoice } from "@features/invoicing/domain";
import { InvoiceStatusBadge, InvoiceActions } from "../components";

// ============================================================================
// HELPERS
// ============================================================================

function resolveInvoiceBackHref(
  from: string | undefined,
  invoice: Invoice | undefined,
): string {
  if (from && !from.startsWith("/invoices/new")) return from;
  if (invoice?.trips?.length) return `/trips/${invoice.trips[0].tripId}`;
  return "/finance?tab=invoices";
}

function formatMXN(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const fromState = location.state?.from as string | undefined;

  const { data: invoice, isLoading, isError, error } = useInvoice(id!);

  const handleBack = () => {
    navigate(resolveInvoiceBackHref(fromState, invoice));
  };

  const { label: issuerTaxRegimeLabel } = useRegimenFiscalLabel(
    invoice?.issuerTaxRegime,
  );
  const { label: receiverTaxRegimeLabel } = useRegimenFiscalLabel(
    invoice?.receiverTaxRegime,
  );

  const { mutate: openPdf, isPending: openingPdf } = useOpenInvoicePdf({
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Error al generar PDF",
        description: getErrorMessage(err),
      }),
  });

  // Toast para errores de red / servidor inesperados (404 se trata inline)
  useEffect(() => {
    if (isError && error) {
      const apiError = error as { status?: number };
      if (!apiError.status || apiError.status !== 404) {
        toast({
          variant: "destructive",
          title: "Error al cargar factura",
          description: getErrorMessage(error),
        });
      }
    }
  }, [isError, error]); // eslint-disable-line react-hooks/exhaustive-deps

  const shellHeaderPlaceholder = {
    backHref: resolveInvoiceBackHref(fromState, undefined),
    icon: <Receipt className="h-6 w-6" />,
    title: "Factura",
  };

  if (isLoading) {
    return (
      <DetailPageShell
        isLoading
        header={shellHeaderPlaceholder}
      />
    );
  }

  if (isError || !invoice) {
    return (
      <DetailPageShell
        isLoading={false}
        notFound
        notFoundConfig={{
          icon: <AlertCircle />,
          title: "Factura no encontrada",
          description: error ? getErrorMessage(error) : undefined,
          onBackClick: handleBack,
          backLabel: "Regresar",
        }}
        header={shellHeaderPlaceholder}
      />
    );
  }

  const isStampedLike =
    invoice.status === "stamped" || invoice.status === "cancellation_pending";

  const backHref = resolveInvoiceBackHref(fromState, invoice);

  return (
    <DetailPageShell
      isLoading={false}
      header={{
        backHref,
        backLabel: "Volver",
        icon: <Receipt className="h-6 w-6" />,
        title: `${invoice.serie}-${invoice.folio}`,
        subtitle: invoice.cfdiUuid
          ? `UUID: ${invoice.cfdiUuid}`
          : `${invoice.receiverName} · ${invoice.receiverRfc}`,
        statusBadge: <InvoiceStatusBadge status={invoice.status} />,
        actions: (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <InvoiceActions
              variant="buttons"
              invoiceId={invoice.id}
              invoiceSerie={invoice.serie}
              invoiceFolio={invoice.folio}
              invoiceStatus={invoice.status}
              fullInvoice={invoice}
            />
            {isStampedLike && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    openPdf({
                      id: invoice.id,
                      serieFolio: `${invoice.serie}-${invoice.folio}`,
                    })
                  }
                  disabled={openingPdf}
                  title="Ver PDF"
                >
                  {openingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {openingPdf ? "Generando..." : "PDF"}
                </Button>
                {invoice.xmlContent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadInvoiceXml(
                        invoice.xmlContent!,
                        `${invoice.serie}-${invoice.folio}`,
                      )
                    }
                    title="Descargar XML timbrado"
                  >
                    <FileCode className="mr-2 h-4 w-4" />
                    XML
                  </Button>
                ) : null}
              </>
            )}
          </div>
        ),
      }}
      metadata={{
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        createdBy:
          invoice.createdByName?.trim() ||
          invoice.createdBy?.trim() ||
          undefined,
        updatedBy: invoice.updatedByName?.trim() || undefined,
      }}
    >
      {invoice.parentInvoiceId && (
        <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm mb-6">
          <span className="text-muted-foreground">Esta factura sustituye a </span>
          <Link
            to={`/invoices/${invoice.parentInvoiceId}`}
            state={{ from: location.pathname }}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            la factura original
          </Link>
          .
        </div>
      )}

      {isStampedLike && (
        <p className="text-xs text-muted-foreground mb-6">
          {invoice.xmlContent
            ? "El XML descargable es el CFDI timbrado completo (Carta Porte 3.1 y TimbreFiscalDigital van dentro del mismo archivo). El PDF de representación impresa resume el CFDI y, si el XML incluye Carta Porte, muestra un resumen de transporte."
            : "Si no aparece el botón para descargar XML, actualice la página para volver a cargar el comprobante desde el servidor."}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emisor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Emisor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">{invoice.issuerName}</p>
            <p className="text-muted-foreground">{invoice.issuerRfc}</p>
            <p className="text-muted-foreground">
              Régimen:{" "}
              {issuerTaxRegimeLabel ?? invoice.issuerTaxRegime}
            </p>
            <p className="text-muted-foreground">
              Lugar expedición: {invoice.issueLocation}
            </p>
          </CardContent>
        </Card>

        {/* Receptor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Receptor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">{invoice.receiverName}</p>
            <p className="text-muted-foreground">{invoice.receiverRfc}</p>
            <p className="text-muted-foreground">
              Uso CFDI: {invoice.cfdiUsage}
            </p>
            <p className="text-muted-foreground">
              Régimen:{" "}
              {receiverTaxRegimeLabel ?? invoice.receiverTaxRegime}
            </p>
            <p className="text-muted-foreground">
              C.P.: {invoice.receiverPostalCode}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CFDI Info + Importes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Datos CFDI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <p className="text-muted-foreground">Fecha emisión</p>
              <p className="font-medium">
                {formatDate(invoice.issuedAt.split("T")[0])}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Forma de pago</p>
              <p className="font-medium">{invoice.paymentForm}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Método de pago</p>
              <Badge variant="outline">{invoice.paymentMethod}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Moneda</p>
              <p className="font-medium">{invoice.currency}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex justify-between w-48">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMXN(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between w-48 text-success">
                <span>Descuento</span>
                <span>-{formatMXN(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between w-48">
              <span className="text-muted-foreground">IVA Trasladado</span>
              <span>{formatMXN(invoice.totalTax)}</span>
            </div>
            {invoice.retainedTax > 0 && (
              <div className="flex justify-between w-48 text-warning">
                <span>IVA Retenido</span>
                <span>-{formatMXN(invoice.retainedTax)}</span>
              </div>
            )}
            <Separator className="w-48 my-1" />
            <div className="flex justify-between w-48 font-bold text-base">
              <span>Total</span>
              <span>{formatMXN(invoice.total)}</span>
            </div>
            <div className="flex justify-between w-48 text-success">
              <span>Pagado</span>
              <span>{formatMXN(invoice.totalPaid)}</span>
            </div>
            {invoice.balanceDue > 0 && (
              <div className="flex justify-between w-48 text-destructive font-medium">
                <span>Saldo</span>
                <span>{formatMXN(invoice.balanceDue)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Viajes vinculados */}
      {invoice.trips.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Viajes vinculados ({invoice.trips.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoice.trips.map((trip) => (
              <div
                key={trip.tripId}
                className="flex items-center justify-between p-3 bg-muted/40 rounded-md text-sm"
              >
                <div>
                  <Badge variant="secondary" className="mr-2">
                    {trip.tripCode}
                  </Badge>
                  <span className="font-medium">{trip.clientName}</span>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">
                    {trip.origin} → {trip.destination}
                  </p>
                  <p className="font-medium">{formatMXN(trip.totalAmount)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pagos */}
      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Pagos y complementos REP ({invoice.payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoice.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-muted/40 rounded-md text-sm"
              >
                <div>
                  <p className="font-medium">{formatMXN(payment.amountMxn)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(payment.paymentDate)} •{" "}
                    {payment.paymentFormName ?? payment.paymentForm}
                    {payment.reference && ` • Ref: ${payment.reference}`}
                  </p>
                  {payment.repCfdiUuid && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      REP UUID: {payment.repCfdiUuid}
                      {payment.repStampedAt &&
                        ` • ${formatDate(payment.repStampedAt)}`}
                    </p>
                  )}
                </div>
                {payment.createdByName && (
                  <span className="text-xs text-muted-foreground">
                    {payment.createdByName}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notas */}
      {invoice.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas internas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Cancelación */}
      {(invoice.status === "cancelled" ||
        invoice.status === "cancellation_pending") && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-destructive uppercase tracking-wide">
              {invoice.status === "cancellation_pending"
                ? "Cancelación en proceso"
                : "Cancelación"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {invoice.status === "cancellation_pending" && (
              <p>
                <span className="text-muted-foreground">Estatus SAT: </span>
                {invoice.satCancellationMessage ?? "Pendiente de aceptación del receptor"}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Fecha: </span>
              {formatDateTime(
                invoice.status === "cancellation_pending"
                  ? invoice.satCancellationUpdatedAt
                  : invoice.cancelledAt,
              )}
            </p>
            <p>
              <span className="text-muted-foreground">Motivo SAT: </span>
              {invoice.cancellationCode}
            </p>
            <p>
              <span className="text-muted-foreground">Descripción: </span>
              {invoice.cancellationReason}
            </p>
            {invoice.replacementCfdiUuid && (
              <p>
                <span className="text-muted-foreground">UUID sustitución: </span>
                {invoice.replacementCfdiUuid}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </DetailPageShell>
  );
}
