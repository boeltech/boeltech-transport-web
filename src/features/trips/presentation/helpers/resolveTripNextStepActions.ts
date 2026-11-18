/**
 * Consolida next-step above-the-fold del detalle (rediseño F1 · HB-G2-CTA).
 * Pura: status + readiness + flags → 1 primaria + ≤2 secundarias.
 * Programado / En ruta: primaria = open_operate (abre sheet); Facturar en header (D11).
 */

import { TripStatus, type TripStatusType } from "@features/trips/domain";

export type TripNextStepPhase =
  | "draft_incomplete"
  | "draft_ready"
  | "scheduled"
  | "in_progress"
  | "completed";

export type TripNextStepActionId =
  | "complete_route_cargo"
  | "confirm_reserve"
  | "open_operate"
  /** @deprecated Prefer `open_operate` (HB-G2-CTA). Kept for transitional callers. */
  | "go_to_tracking"
  | "invoice"
  | "go_to_route"
  | "go_to_cargo"
  | "open_draft"
  | "view_invoices"
  /** F3d-4: secundaria en En ruta (outline). */
  | "register_note"
  /** F3b desenlaces: declarar viaje en falso (origen sin carga). */
  | "declare_false_trip"
  /** F3b desenlaces: cancelar viaje (mismo dialog del shell). */
  | "cancel_trip"
  /** F3b desenlaces: deep-link a Ruta mid-trip (`intent=plan_return`). */
  | "plan_return";

export type TripNextStepTab = "route" | "cargo" | "tracking";

/** D57 — hueco concreto de ruta para nombrar Qué sigue. */
export type DraftRouteGapHint =
  | "origin"
  | "destination"
  | "domicilio"
  | "route";

export type TripNextStepAction = {
  readonly id: TripNextStepActionId;
  /** Tab objetivo cuando la acción navega. */
  readonly tab?: TripNextStepTab;
  /** Factura a abrir (`open_draft`). */
  readonly invoiceId?: string;
  /** D57 — refina copy de `complete_route_cargo` cuando tab=route. */
  readonly routeGap?: DraftRouteGapHint;
};

export type TripNextStepPlan = {
  readonly phase: TripNextStepPhase;
  readonly primary: TripNextStepAction;
  readonly secondaries: readonly TripNextStepAction[];
};

export type ResolveTripNextStepActionsInput = {
  readonly status: TripStatusType;
  readonly routeReady: boolean;
  readonly cargoReady: boolean;
  /** D57 — pendiente de ruta cuando `!routeReady`. */
  readonly draftRouteGap?: DraftRouteGapHint | null;
  /** Puede mutar/completar reserva (trips.update). */
  readonly canUpdateTrip: boolean;
  /**
   * Eleva Facturar en next-step solo en Completado (D12).
   * En Programado / En ruta Facturar vive en el header (D11 / D5).
   */
  readonly canInvoice: boolean;
  /**
   * Atención fiscal (ATF): el CTA del job (Sustituir / …) no debe competir
   * con Facturar genérico en next-step.
   */
  readonly requiresFiscalAttention?: boolean;
  /** Tab activo del detalle (informativo; ya no suprime open_operate). */
  readonly activeTab?: string | null;
  /**
   * Borradores ligados (D18). Conservado en el input por callers / descripción;
   * F3d-4 ya no eleva open_draft / view_invoices como secundaria de Qué sigue.
   */
  readonly linkedDraftInvoiceIds?: readonly string[];
  /** GET aditivo — modo desenlace origen (CA-02…05). */
  readonly originNoCargoPendingOutcome?: boolean;
  /** GET aditivo — modo planear retorno (CA-06…11). */
  readonly returnReplanRequired?: boolean;
  /** Dominio + UX: puede declarar viaje en falso. */
  readonly canDeclareFalseTrip?: boolean;
};

const MAX_SECONDARIES = 2;

function takeSecondaries(
  actions: readonly TripNextStepAction[],
): TripNextStepAction[] {
  return actions.slice(0, MAX_SECONDARIES);
}

/**
 * Resuelve el plan de acciones next-step. `null` = no hay bloque (portal,
 * sin permiso, o fase sin job above-the-fold).
 */
export function resolveTripNextStepActions(
  input: ResolveTripNextStepActionsInput,
): TripNextStepPlan | null {
  const {
    status,
    routeReady,
    cargoReady,
    draftRouteGap = null,
    canUpdateTrip,
    canInvoice,
    requiresFiscalAttention = false,
  } = input;

  if (status === TripStatus.DRAFT) {
    if (!canUpdateTrip) return null;

    if (!routeReady || !cargoReady) {
      const primaryTab: TripNextStepTab = !routeReady ? "route" : "cargo";
      const primary: TripNextStepAction = {
        id: "complete_route_cargo",
        tab: primaryTab,
        ...(primaryTab === "route" && draftRouteGap
          ? { routeGap: draftRouteGap }
          : {}),
      };
      const secondaries: TripNextStepAction[] = [];
      if (!routeReady && !cargoReady) {
        secondaries.push({ id: "go_to_cargo", tab: "cargo" });
      } else if (!routeReady) {
        secondaries.push({ id: "go_to_cargo", tab: "cargo" });
      } else {
        secondaries.push({ id: "go_to_route", tab: "route" });
      }
      return {
        phase: "draft_incomplete",
        primary,
        secondaries: takeSecondaries(secondaries),
      };
    }

    return {
      phase: "draft_ready",
      primary: { id: "confirm_reserve" },
      secondaries: takeSecondaries([
        { id: "go_to_route", tab: "route" },
        { id: "go_to_cargo", tab: "cargo" },
      ]),
    };
  }

  if (status === TripStatus.SCHEDULED || status === TripStatus.IN_PROGRESS) {
    const phase: TripNextStepPhase =
      status === TripStatus.SCHEDULED ? "scheduled" : "in_progress";

    // D11 / HB-G2-CTA: Despachar / acción de parada = primaria; Facturar en header.
    // F3d-4: borrador fuera de Qué sigue (punto ámbar Facturación / aviso D22/D30).
    // En ruta: secundaria = Nota. Programado: sin secundaria de borrador.
    // F3b: desenlaces sustituyen open_operate (salida/cierre bloqueados).
    if (canUpdateTrip) {
      if (
        phase === "in_progress" &&
        input.originNoCargoPendingOutcome === true
      ) {
        const canFalse = input.canDeclareFalseTrip === true;
        const secondaries: TripNextStepAction[] = canFalse
          ? [{ id: "cancel_trip" }, { id: "register_note" }]
          : [{ id: "register_note" }];
        return {
          phase,
          primary: {
            id: canFalse ? "declare_false_trip" : "cancel_trip",
          },
          secondaries: takeSecondaries(secondaries),
        };
      }
      if (phase === "in_progress" && input.returnReplanRequired === true) {
        return {
          phase,
          primary: { id: "plan_return", tab: "route" },
          secondaries: takeSecondaries([{ id: "register_note" }]),
        };
      }
      const secondaries: TripNextStepAction[] =
        phase === "in_progress" ? [{ id: "register_note" }] : [];
      return {
        phase,
        primary: { id: "open_operate" },
        secondaries: takeSecondaries(secondaries),
      };
    }

    // Sin permiso de operar: Facturar si aplica (fallback).
    if (canInvoice && !requiresFiscalAttention) {
      return {
        phase,
        primary: { id: "invoice" },
        secondaries: [],
      };
    }

    return null;
  }

  if (status === TripStatus.COMPLETED && canInvoice && !requiresFiscalAttention) {
    return {
      phase: "completed",
      primary: { id: "invoice" },
      secondaries: [],
    };
  }

  return null;
}
