/**
 * Totales del riel Cobro (tab Facturación) desde filas linked vigentes.
 * Facturado / Cobrado / Por cobrar = base CFDI con IVA (`total` stamped vigentes).
 * No usar `trip.facturadoVigente` (subtotal API sin IVA).
 */

import {
  summarizeVigente,
  type TripBillingInvoiceRow,
} from "./buildTripBillingInvoiceRows";

export type TripBillingCobroSummary = {
  facturado: number;
  cobrado: number;
  porCobrar: number;
  rowCount: number;
};

export function buildTripBillingCobroSummary(
  rows: readonly TripBillingInvoiceRow[],
): TripBillingCobroSummary {
  const vigente = summarizeVigente(rows);
  return {
    facturado: vigente.total,
    cobrado: vigente.collected,
    porCobrar: Math.max(0, vigente.total - vigente.collected),
    rowCount: vigente.rowCount,
  };
}
