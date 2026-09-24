/**
 * ADR-0096 F0 — predicado UI de mutabilidad del Select Liquidación.
 * Espejo de `canMutateCfdiEmissionIntent` (dominio); draft de factura no bloquea.
 */

import { canMutateCfdiEmissionIntent } from "@boeltech/cfdi-domain/reglas/cfdi-emission-intent";

import type { Trip, TripInvoicing, TripStatus } from "@features/trips/domain";
import type { CfdiEmissionIntent } from "@features/trips/domain";

/** Factura principal vigente (excluye draft / cancelled / ausente). */
export function isPrincipalInvoiceLocking(
  invoicing: Pick<TripInvoicing, "hasActivePrincipalInvoice" | "invoiceStatus">,
): boolean {
  if (!invoicing.hasActivePrincipalInvoice) return false;
  const status = invoicing.invoiceStatus;
  if (status == null || status === "draft" || status === "cancelled") {
    return false;
  }
  return true;
}

export type TripLiquidacionMutabilityInput = {
  status: TripStatus;
  cfdiEmissionIntent: CfdiEmissionIntent;
  operationalCashCollectedAt: Date | null | undefined;
  operationalOutcome: Trip["operationalOutcome"];
  invoicing: Pick<TripInvoicing, "hasActivePrincipalInvoice" | "invoiceStatus">;
};

/**
 * ¿Mostrar Select editable? Probe: ¿podría cambiar al intent opuesto?
 * (no-op current===next siempre es allow en dominio).
 */
export function canEditTripLiquidacionIntent(
  trip: TripLiquidacionMutabilityInput,
  opts: { canUpdateTrip: boolean; isLeanTripPortal?: boolean },
): boolean {
  if (!opts.canUpdateTrip || opts.isLeanTripPortal) return false;

  const current = trip.cfdiEmissionIntent ?? "emitir_cfdi";
  const probeNext: CfdiEmissionIntent =
    current === "emitir_cfdi" ? "sin_cfdi_efectivo" : "emitir_cfdi";

  const gate = canMutateCfdiEmissionIntent({
    status: trip.status,
    currentIntent: current,
    nextIntent: probeNext,
    hasLockedPrincipalInvoice: isPrincipalInvoiceLocking(trip.invoicing),
    hasOperationalCashCollected: trip.operationalCashCollectedAt != null,
    operationalOutcome: trip.operationalOutcome ?? "standard",
  });
  return gate.ok;
}
