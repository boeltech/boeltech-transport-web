/**
 * ADR-0096 F0 — predicado UI de mutabilidad del Select Liquidación.
 * Espejo de `canMutateCfdiEmissionIntent` (dominio); draft de factura no bloquea.
 */

import {
  canMutateCfdiEmissionIntent,
  CFDI_EMISSION_INTENT_LOCKED_INVOICE_CODE,
  CFDI_EMISSION_INTENT_LOCKED_OPERATIONAL_CASH_CODE,
} from "@boeltech/cfdi-domain/reglas/cfdi-emission-intent";

import {
  hasOperationalCashCollected,
  TripStatus,
  type CfdiEmissionIntent,
  type OperationalCashSummary,
  type Trip,
  type TripInvoicing,
  type TripStatusType,
} from "@features/trips/domain";

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
  status: TripStatusType;
  cfdiEmissionIntent: CfdiEmissionIntent;
  operationalCashCollectedAt: Date | null | undefined;
  operationalCashAmount?: number | null;
  operationalCash?: OperationalCashSummary | null;
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
    hasOperationalCashCollected: hasOperationalCashCollected(trip),
    operationalOutcome: trip.operationalOutcome ?? "standard",
  });
  return gate.ok;
}

/**
 * Motivo visible cuando el viaje ya tiene factura vigente o abono.
 * El bloqueo solo por estado (en curso, completado) no lleva esta frase.
 * Se consulta el paquete con status en ventana para no tapar abono/factura.
 */
export function tripLiquidacionInvoiceOrCashLockMessage(
  trip: TripLiquidacionMutabilityInput,
): string | null {
  const invoiceLocked = isPrincipalInvoiceLocking(trip.invoicing);
  const cashLocked = hasOperationalCashCollected(trip);
  if (!invoiceLocked && !cashLocked) return null;

  const current = trip.cfdiEmissionIntent ?? "emitir_cfdi";
  const probeNext: CfdiEmissionIntent =
    current === "emitir_cfdi" ? "sin_cfdi_efectivo" : "emitir_cfdi";
  const gate = canMutateCfdiEmissionIntent({
    status: TripStatus.SCHEDULED,
    currentIntent: current,
    nextIntent: probeNext,
    hasLockedPrincipalInvoice: invoiceLocked,
    hasOperationalCashCollected: cashLocked,
    operationalOutcome: trip.operationalOutcome ?? "standard",
  });
  if (gate.ok) return null;
  const failure = gate.error[0];
  if (
    failure?.code === CFDI_EMISSION_INTENT_LOCKED_INVOICE_CODE ||
    failure?.code === CFDI_EMISSION_INTENT_LOCKED_OPERATIONAL_CASH_CODE
  ) {
    return failure.message;
  }
  return null;
}
