/**
 * Borradores de factura ligados al viaje (F9 / D16–D18 / F9b D18′).
 * Señales locales del GET viaje — sin endpoint nuevo.
 */

import type { TripInvoicing } from "@features/trips/domain";

export type LinkedTripInvoiceDraft = {
  readonly id: string;
  readonly source: "principal" | "accessory";
  /** Folio del payload si viene; null si vacío/ausente. */
  readonly folio: string | null;
};

function normalizeFolio(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Ids de facturas en `draft` ligadas al viaje (principal + accesorias).
 * Split legs sin `invoiceStatus` en el GET: no se inventan; ver handoff BLD F9.
 */
export function listLinkedTripInvoiceDrafts(
  invoicing: Pick<
    TripInvoicing,
    "invoiceId" | "invoiceStatus" | "invoiceFolio" | "accessoryInvoices"
  >,
): readonly LinkedTripInvoiceDraft[] {
  const drafts: LinkedTripInvoiceDraft[] = [];

  if (invoicing.invoiceStatus === "draft" && invoicing.invoiceId) {
    drafts.push({
      id: invoicing.invoiceId,
      source: "principal",
      folio: normalizeFolio(invoicing.invoiceFolio),
    });
  }

  for (const accessory of invoicing.accessoryInvoices ?? []) {
    if (accessory.status === "draft" && accessory.id) {
      drafts.push({
        id: accessory.id,
        source: "accessory",
        folio: normalizeFolio(accessory.folio),
      });
    }
  }

  return drafts;
}
