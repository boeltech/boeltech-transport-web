/**
 * TripFiscalSection — resumen compacto de facturación en el detalle (PD-TD2).
 * Sin UUID prominente; detalle en menú Facturación / ficha de factura.
 * Con `embedded`, vive dentro de TripInvoicingConsole (sin borde propio).
 */

import { Link } from "react-router-dom";
import { ExternalLink, Receipt } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import type { Trip } from "@features/trips/domain";
import {
  getTripInvoicingBadgeConfig,
  toDetailInvoicingBadge,
} from "../uiHelpers";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import { hasTripFiscalSectionContent } from "./shouldShowTripInvoicingConsole";

const sectionCopy = tripFiscalCopy.invoicesSection;

export interface TripFiscalSectionProps {
  trip: Trip;
  /** Aviso puntual (p. ej. tras cancelar con factura vigente) */
  postCancelFiscal?: {
    title: string;
    lines: readonly string[];
    onDismiss?: () => void;
  };
  /** Dentro de TripInvoicingConsole — sin card exterior ni título duplicado. */
  embedded?: boolean;
}

function blockReasonNeedsRouteLink(reason: string): boolean {
  return /ruta|paradas|coordenadas|distancias|carta\s+porte/i.test(reason);
}

function blockReasonNeedsCargoLink(reason: string): boolean {
  return /carga|mercanc/i.test(reason);
}

export function TripFiscalSection({
  trip,
  postCancelFiscal,
  embedded = false,
}: TripFiscalSectionProps) {
  const invoicing = trip.invoicing;
  const badge = toDetailInvoicingBadge(
    getTripInvoicingBadgeConfig({
      status: trip.status,
      invoicing,
      cfdiEmissionIntent: trip.cfdiEmissionIntent,
    }),
  );

  const accessoryInvoices = invoicing.accessoryInvoices ?? [];
  const hasLinkedInvoice = !!invoicing.invoiceId;
  const invoiceCount =
    (hasLinkedInvoice ? 1 : 0) + accessoryInvoices.length;

  const hasLinkedPrincipalEvidence =
    invoicing.hasActiveInvoice ||
    invoicing.hasActivePrincipalInvoice ||
    !!invoicing.invoiceId ||
    !!invoicing.invoiceFolio ||
    invoicing.invoiceStatus === "draft" ||
    invoicing.invoiceStatus === "stamped" ||
    invoicing.invoiceStatus === "cancellation_pending";

  // ADR-0096: el banner del detalle ya explica sin CFDI; no duplicar consola
  // «Pendiente» / block_reason cuando no hay factura ligada.
  if (
    trip.cfdiEmissionIntent === "sin_cfdi_efectivo" &&
    !hasLinkedPrincipalEvidence &&
    !invoicing.hasActiveSplit &&
    accessoryInvoices.length === 0 &&
    !postCancelFiscal
  ) {
    return null;
  }

  const isOperationalBlockReason =
    invoicing.blockReason != null &&
    (blockReasonNeedsRouteLink(invoicing.blockReason) ||
      blockReasonNeedsCargoLink(invoicing.blockReason));

  /**
   * Mostrar bloqueo operativo/SAT; con principal ligada solo D6 (ruta/carga para
   * accesoria). No pintar mutex «ya tiene factura activa» cuando hay evidencia.
   */
  const showInvoicingBlockReason =
    !!invoicing.blockReason &&
    !invoicing.canGenerateInvoice &&
    !invoicing.canGenerateFalseTripInvoice &&
    (!hasLinkedPrincipalEvidence ||
      (!invoicing.canGenerateAccessoryInvoice && isOperationalBlockReason));

  if (!hasTripFiscalSectionContent(invoicing) && !postCancelFiscal) {
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

  const body = (
    <>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {!embedded ? (
            <Receipt
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          ) : null}
          {!embedded ? (
            <span className="text-sm font-medium">{sectionCopy.compactTitle}</span>
          ) : null}
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
        {!embedded ? (
          <p className="text-xs text-muted-foreground">{sectionCopy.openMenuHint}</p>
        ) : null}
      </div>
      {hasLinkedInvoice ? (
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
    </>
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {body}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      {body}
    </div>
  );
}
