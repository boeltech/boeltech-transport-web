/**
 * Gate de visibilidad de la consola de facturación del viaje (Capa 1 PD2).
 * Solo si hay algo que mostrar en banda (sección fiscal y/o línea de reparto);
 * no montar el cascarón vacío solo por «listo para facturar» (CTAs viven en menú).
 *
 * F4 (claridad flujo): en `in_progress` sin Atención fiscal (ATF) la consola
 * arranca colapsada / secundaria — no compite con operación/seguimiento.
 *
 * F10 / D21 + F11a / D25: si el next-step **visible** posee la guía de
 * facturación (`primary.id === "invoice"` o tips `open_draft` | `view_invoices`
 * en primary/secondaries), no montar la banda — el next-step + menú bastan.
 * Excepción: ATF o post-cancel.
 */

import type { Trip } from "@features/trips/domain";
import { TripStatus } from "@features/trips/domain";
import type { TripNextStepPlan } from "../helpers/resolveTripNextStepActions";

type TripInvoicingGate = Pick<Trip, "invoicing" | "cfdiEmissionIntent">;

type TripInvoicingDensityGate = Pick<
  Trip,
  "status" | "requiresFiscalAttention"
>;

const DRAFT_NEXT_STEP_ACTION_IDS = new Set(["open_draft", "view_invoices"]);

/**
 * True si el plan visible ya guía facturación (D21 drafts + D25 primary invoice).
 * Consola = evidencia; no compite con S1.
 */
export function nextStepPlanOwnsInvoicing(
  plan: TripNextStepPlan | null | undefined,
): boolean {
  if (!plan) return false;
  if (plan.primary.id === "invoice") return true;
  if (DRAFT_NEXT_STEP_ACTION_IDS.has(plan.primary.id)) return true;
  return plan.secondaries.some((a) => DRAFT_NEXT_STEP_ACTION_IDS.has(a.id));
}

export type ShouldMountTripInvoicingConsoleInput = {
  readonly trip: TripInvoicingGate;
  readonly hasPostCancelFiscal: boolean;
  /** ATF: excepción — consola puede montarse aunque next-step guíe facturación. */
  readonly requiresFiscalAttention: boolean;
  /** Plan next-step del detalle (`null` = no visible; p. ej. D19 en Seguimiento). */
  readonly nextStepPlan: TripNextStepPlan | null | undefined;
};

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

function hasLinkedInvoiceEvidence(invoicing: Trip["invoicing"]): boolean {
  return Boolean(
    invoicing.hasActiveInvoice ||
      invoicing.hasActivePrincipalInvoice ||
      invoicing.invoiceId ||
      invoicing.invoiceFolio ||
      invoicing.invoiceStatus != null ||
      (invoicing.accessoryInvoices?.length ?? 0) > 0 ||
      invoicing.hasActiveSplit,
  );
}

/**
 * Mostrar consola solo con contenido de banda: facturas ligadas, bloqueo,
 * reparto, aviso post-cancel — no solo canGenerateInvoice / status billable.
 *
 * ADR-0096: `sin_cfdi_efectivo` sin factura ligada no abre consola solo por
 * `block_reason` (el banner del detalle ya explica el modo).
 */
export function shouldShowTripInvoicingConsole(
  trip: TripInvoicingGate,
  hasPostCancelFiscal: boolean,
): boolean {
  if (hasPostCancelFiscal) return true;

  const inv = trip.invoicing;
  if (
    trip.cfdiEmissionIntent === "sin_cfdi_efectivo" &&
    !hasLinkedInvoiceEvidence(inv)
  ) {
    return false;
  }

  return (
    hasTripFiscalSectionContent(inv) || hasTripRevenueSplitBandSignal(inv)
  );
}

/**
 * Densidad mid-flight (F4 / D7): colapsar por defecto solo en En ruta
 * **sin** job ATF. Con ATF la consola permanece expandida (banners/CTAs del job).
 */
export function shouldCollapseTripInvoicingConsoleByDefault(
  trip: TripInvoicingDensityGate,
): boolean {
  return (
    trip.status === TripStatus.IN_PROGRESS && !trip.requiresFiscalAttention
  );
}

/**
 * Gate de montaje en detalle (PD2 + D21 + D25).
 * Base PD2; luego oculta si next-step posee facturación, salvo ATF / post-cancel.
 */
export function shouldMountTripInvoicingConsole(
  input: ShouldMountTripInvoicingConsoleInput,
): boolean {
  const {
    trip,
    hasPostCancelFiscal,
    requiresFiscalAttention,
    nextStepPlan,
  } = input;

  if (!shouldShowTripInvoicingConsole(trip, hasPostCancelFiscal)) {
    return false;
  }

  if (hasPostCancelFiscal || requiresFiscalAttention) {
    return true;
  }

  if (nextStepPlanOwnsInvoicing(nextStepPlan)) {
    return false;
  }

  return true;
}

/** @deprecated Prefer `shouldShowTripInvoicingConsole` (mismo gate PD2). */
export const shouldShowTripFiscalBand = shouldShowTripInvoicingConsole;
