/**
 * TripFiscalSection — resumen compacto de facturación en el detalle (PD-TD2).
 * Sin UUID prominente; detalle en menú Facturación / ficha de factura.
 */

import { Link } from "react-router-dom";
import { ExternalLink, Receipt } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { TripStatus, type Trip } from "@features/trips/domain";
import {
  getTripInvoicingBadgeConfig,
  getTripInvoicingBlockReason,
  toDetailInvoicingBadge,
} from "../uiHelpers";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";

const sectionCopy = tripFiscalCopy.invoicesSection;

export function shouldShowTripFiscalBand(
  trip: Pick<
    Trip,
    "status" | "requiresFiscalAttention" | "operationalOutcome" | "invoicing"
  >,
  hasPostCancelFiscal: boolean,
): boolean {
  if (hasPostCancelFiscal) return true;
  if (trip.requiresFiscalAttention) return true;
  if (
    trip.operationalOutcome === "false_trip" &&
    trip.invoicing.canGenerateFalseTripInvoice
  ) {
    return true;
  }
  const billableStatus =
    trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED;
  if (!billableStatus || !trip.invoicing.blockReason) return false;
  return getTripInvoicingBlockReason(trip.invoicing) != null;
}

export interface TripFiscalSectionProps {
  trip: Trip;
  /** Aviso puntual (p. ej. tras cancelar con factura vigente) */
  postCancelFiscal?: {
    title: string;
    lines: readonly string[];
    onDismiss?: () => void;
  };
}

function blockReasonNeedsRouteLink(reason: string): boolean {
  return /ruta|paradas|coordenadas|distancias|carta\s+porte/i.test(reason);
}

function blockReasonNeedsCargoLink(reason: string): boolean {
  return /carga|mercanc/i.test(reason);
}

export function TripFiscalSection({ trip, postCancelFiscal }: TripFiscalSectionProps) {
  const invoicing = trip.invoicing;
  const badge = toDetailInvoicingBadge(
    getTripInvoicingBadgeConfig({
      status: trip.status,
      invoicing,
    }),
  );

  const accessoryInvoices = invoicing.accessoryInvoices ?? [];
  const hasPrimaryInvoice = !!invoicing.invoiceId;
  const invoiceCount =
    (hasPrimaryInvoice ? 1 : 0) + accessoryInvoices.length;

  const suppressPrimaryBlockReason =
    invoicing.hasActiveInvoice ||
    !!invoicing.invoiceId ||
    !!invoicing.invoiceFolio ||
    invoicing.invoiceStatus === "draft" ||
    invoicing.invoiceStatus === "stamped" ||
    invoicing.invoiceStatus === "cancellation_pending";

  /** D6: mostrar bloqueo de operación/SAT; también si accesoria está bloqueada por ruta. */
  const showInvoicingBlockReason =
    !!invoicing.blockReason &&
    !invoicing.canGenerateInvoice &&
    (!suppressPrimaryBlockReason || !invoicing.canGenerateAccessoryInvoice);

  const hasFiscalContent =
    invoicing.invoiceFolio ||
    invoicing.blockReason ||
    postCancelFiscal ||
    invoicing.invoiceStatus !== null ||
    !!invoicing.invoiceId ||
    accessoryInvoices.length > 0;

  if (!hasFiscalContent) {
    return null;
  }

  const showRouteLink =
    showInvoicingBlockReason &&
    invoicing.blockReason != null &&
    blockReasonNeedsRouteLink(invoicing.blockReason);
  const showCargoLink =
    showInvoicingBlockReason &&
    invoicing.blockReason != null &&
    blockReasonNeedsCargoLink(invoicing.blockReason);

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">{sectionCopy.compactTitle}</span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
          {invoicing.invoiceFolio ? (
            <span className="text-sm text-muted-foreground">
              {sectionCopy.folio(invoicing.invoiceFolio)}
            </span>
          ) : null}
          {invoiceCount > 1 ? (
            <span className="text-xs text-muted-foreground">
              {invoiceCount} facturas
            </span>
          ) : null}
        </div>
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
        {showInvoicingBlockReason ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{invoicing.blockReason}</p>
            {showRouteLink || showCargoLink ? (
              <div className="flex flex-wrap gap-2">
                {showRouteLink ? (
                  <Button variant="link" size="sm" className="h-auto p-0" asChild>
                    <Link to={`/trips/${trip.id}?tab=route`}>
                      {sectionCopy.goToRouteTab}
                    </Link>
                  </Button>
                ) : null}
                {showCargoLink ? (
                  <Button variant="link" size="sm" className="h-auto p-0" asChild>
                    <Link to={`/trips/${trip.id}?tab=cargo`}>
                      {sectionCopy.goToCargoTab}
                    </Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">{sectionCopy.openMenuHint}</p>
      </div>
      {hasPrimaryInvoice ? (
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link
            to={`/invoices/${invoicing.invoiceId}`}
            className="inline-flex items-center gap-1"
          >
            {sectionCopy.openInvoice}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
