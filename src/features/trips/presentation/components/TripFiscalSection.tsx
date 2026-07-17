/**
 * TripFiscalSection — resumen fiscal del viaje (detalle).
 * ADR-0068: lista factura primaria + accesorias.
 */

import { Link } from "react-router-dom";
import { Copy, ExternalLink, Receipt } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { useToast } from "@shared/hooks";
import type { Trip } from "@features/trips/domain";
import { getTripInvoicingBadgeConfig } from "../uiHelpers";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";

const sectionCopy = tripFiscalCopy.invoicesSection;

function truncateUuid(uuid: string, head = 8, tail = 4): string {
  if (uuid.length <= head + tail + 1) return uuid;
  return `${uuid.slice(0, head)}…${uuid.slice(-tail)}`;
}

export interface TripFiscalSectionProps {
  trip: Trip;
  /** Aviso puntual (p. ej. tras cancelar con CFDI vigente) */
  postCancelFiscal?: {
    title: string;
    lines: readonly string[];
    onDismiss?: () => void;
  };
}

export function TripFiscalSection({ trip, postCancelFiscal }: TripFiscalSectionProps) {
  const { toast } = useToast();

  const invoicing = trip.invoicing;
  const badge = getTripInvoicingBadgeConfig({
    status: trip.status,
    invoicing,
  });

  const uuid = invoicing.invoiceCfdiUuid?.trim() || null;
  const showUuid = !!uuid;
  const accessoryInvoices = invoicing.accessoryInvoices ?? [];
  const hasPrimaryInvoice = !!invoicing.invoiceId;
  const hasInvoicesList = hasPrimaryInvoice || accessoryInvoices.length > 0;

  const copyUuid = async () => {
    if (!uuid) return;
    try {
      await navigator.clipboard.writeText(uuid);
      toast({ title: "UUID copiado", variant: "success" });
    } catch {
      toast({
        title: "No se pudo copiar",
        description: "Copia el UUID manualmente.",
        variant: "destructive",
      });
    }
  };

  /** Factura ya ligada (borrador, timbrada, etc.): no mostrar `blockReason` del API (suele explicar por qué no se puede *generar otra*). */
  const suppressInvoicingBlockReason =
    invoicing.hasActiveInvoice ||
    !!invoicing.invoiceId ||
    !!invoicing.invoiceFolio ||
    invoicing.invoiceStatus === "draft" ||
    invoicing.invoiceStatus === "stamped" ||
    invoicing.invoiceStatus === "cancellation_pending";

  const showInvoicingBlockReason =
    !!invoicing.blockReason && !invoicing.canGenerateInvoice && !suppressInvoicingBlockReason;

  const hasFiscalContent =
    showUuid ||
    invoicing.invoiceFolio ||
    invoicing.blockReason ||
    postCancelFiscal ||
    invoicing.invoiceStatus !== null ||
    !!invoicing.invoiceId ||
    accessoryInvoices.length > 0;

  if (!hasFiscalContent) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-primary/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" />
          Fiscal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {postCancelFiscal ? (
          <div className="rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-sm">
            <p className="font-medium text-warning-soft-foreground">
              {postCancelFiscal.title}
            </p>
            <ul className="mt-1 list-disc pl-4 text-muted-foreground">
              {postCancelFiscal.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {postCancelFiscal.onDismiss ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-8 px-2"
                onClick={postCancelFiscal.onDismiss}
              >
                Entendido
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          {invoicing.invoiceFolio ? (
            <span className="text-sm text-muted-foreground">
              Folio {invoicing.invoiceFolio}
            </span>
          ) : null}
        </div>

        {showInvoicingBlockReason ? (
          <p className="text-sm text-muted-foreground">{invoicing.blockReason}</p>
        ) : null}

        {showUuid ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{truncateUuid(uuid)}</span>
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={copyUuid}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              Copiar UUID
            </Button>
          </div>
        ) : null}

        {hasInvoicesList ? (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-sm font-medium">{sectionCopy.title}</p>
            <ul className="space-y-2">
              {hasPrimaryInvoice ? (
                <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/70 px-3 py-2 text-sm">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant="secondary">{sectionCopy.primaryLabel}</Badge>
                    {invoicing.invoiceFolio ? (
                      <span className="text-muted-foreground">
                        {sectionCopy.folio(invoicing.invoiceFolio)}
                      </span>
                    ) : null}
                    {invoicing.invoiceStatus ? (
                      <span className="text-xs text-muted-foreground">
                        {invoicing.invoiceStatus}
                      </span>
                    ) : null}
                  </div>
                  <Button variant="link" className="h-auto p-0" asChild>
                    <Link
                      to={`/invoices/${invoicing.invoiceId}`}
                      className="inline-flex items-center gap-1"
                    >
                      {sectionCopy.openInvoice}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                </li>
              ) : null}
              {accessoryInvoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/70 px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant="outline">{sectionCopy.accessoryLabel}</Badge>
                    {inv.folio ? (
                      <span className="text-muted-foreground">
                        {sectionCopy.folio(inv.folio)}
                      </span>
                    ) : null}
                    {inv.status ? (
                      <span className="text-xs text-muted-foreground">{inv.status}</span>
                    ) : null}
                  </div>
                  <Button variant="link" className="h-auto p-0" asChild>
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="inline-flex items-center gap-1"
                    >
                      {sectionCopy.openInvoice}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
