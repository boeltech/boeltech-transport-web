import { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, FileText, FileCode, Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { useRegimenFiscalLabel } from "@features/catalogs";
import {
  useInvoice,
  useOpenInvoicePdf,
  downloadInvoiceXml,
} from "@features/invoicing/application";
import { InvoiceStatusBadge, InvoiceActions } from "../components";

// ============================================================================
// HELPERS
// ============================================================================

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

  const handleBack = () => {
    const from = location.state?.from as string | undefined;
    if (from && !from.startsWith("/invoices/new")) {
      navigate(from);
    } else if (invoice?.trips?.length) {
      navigate(`/trips/${invoice.trips[0].tripId}`);
    } else {
      navigate("/finance?tab=invoices");
    }
  };

  const { data: invoice, isLoading, isError, error } = useInvoice(id!);

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

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          {error ? getErrorMessage(error) : "Factura no encontrada"}
        </p>
        <Button variant="link" onClick={handleBack}>
          Regresar
        </Button>
      </div>
    );
  }

  const isStampedLike =
    invoice.status === "stamped" || invoice.status === "cancellation_pending";

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {invoice.serie}-{invoice.folio}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            {invoice.cfdiUuid && (
              <p className="text-xs text-muted-foreground mt-0.5">
                UUID: {invoice.cfdiUuid}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
              {/* Descargar / ver PDF — usa endpoint autenticado */}
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

              {/* Descargar XML timbrado */}
              {invoice.xmlContent && (
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
              )}
            </>
          )}
        </div>
      </div>

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
              <div className="flex justify-between w-48 text-green-600">
                <span>Descuento</span>
                <span>-{formatMXN(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between w-48">
              <span className="text-muted-foreground">IVA Trasladado</span>
              <span>{formatMXN(invoice.totalTax)}</span>
            </div>
            {invoice.retainedTax > 0 && (
              <div className="flex justify-between w-48 text-amber-600 dark:text-amber-400">
                <span>IVA Retenido</span>
                <span>-{formatMXN(invoice.retainedTax)}</span>
              </div>
            )}
            <Separator className="w-48 my-1" />
            <div className="flex justify-between w-48 font-bold text-base">
              <span>Total</span>
              <span>{formatMXN(invoice.total)}</span>
            </div>
            <div className="flex justify-between w-48 text-green-600">
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
              Pagos registrados ({invoice.payments.length})
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
    </div>
  );
}
