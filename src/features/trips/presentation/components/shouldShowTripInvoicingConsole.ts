/**
 * Gate de visibilidad de la consola de facturación del viaje (Capa 1 PD2).
 * Solo si hay algo que mostrar en banda (sección fiscal y/o línea de reparto);
 * no montar el cascarón vacío solo por «listo para facturar» (CTAs viven en menú).
 */

import type { Trip } from "@features/trips/domain";

type TripInvoicingGate = Pick<Trip, "invoicing">;

/** Señales que alimentan TripFiscalSection (sin postCancel local). */
export function hasTripFiscalSectionContent(
  invoicing: Trip["invoicing"],
): boolean {
  return Boolean(
    invoicing.invoiceFolio ||
      invoicing.blockReason ||
      invoicing.invoiceStatus != null ||
      invoicing.invoiceId ||
      (invoicing.accessoryInvoices?.length ?? 0) > 0 ||
      invoicing.hasActiveSplit,
  );
}

/**
 * Señales de la línea compacta de reparto (sin fetch de borrador).
 * Solo datos existentes (activo o porciones); no `canGenerate*` (eso es menú).
 */
export function hasTripRevenueSplitBandSignal(
  invoicing: Trip["invoicing"],
): boolean {
  return Boolean(
    invoicing.hasActiveSplit || invoicing.splitLegsTotal > 0,
  );
}

/**
 * Mostrar consola solo con contenido de banda: facturas ligadas, bloqueo,
 * reparto, aviso post-cancel — no solo canGenerateInvoice / status billable.
 */
export function shouldShowTripInvoicingConsole(
  trip: TripInvoicingGate,
  hasPostCancelFiscal: boolean,
): boolean {
  if (hasPostCancelFiscal) return true;

  const inv = trip.invoicing;
  return (
    hasTripFiscalSectionContent(inv) || hasTripRevenueSplitBandSignal(inv)
  );
}

/** @deprecated Prefer `shouldShowTripInvoicingConsole` (mismo gate PD2). */
export const shouldShowTripFiscalBand = shouldShowTripInvoicingConsole;
