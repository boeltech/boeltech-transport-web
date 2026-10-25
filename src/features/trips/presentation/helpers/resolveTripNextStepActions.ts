/**
 * Consolida next-step above-the-fold del detalle (pedido claridad flujo · F2/F9).
 * Pura: status + readiness + flags → 1 primaria + ≤2 secundarias.
 * No navega ni consulta permisos por sí misma: el caller pasa booleans.
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
  | "go_to_tracking"
  | "invoice"
  | "go_to_route"
  | "go_to_cargo"
  | "open_draft"
  | "view_invoices";

export type TripNextStepTab = "route" | "cargo" | "tracking";

export type TripNextStepAction = {
  readonly id: TripNextStepActionId;
  /** Tab objetivo cuando la acción navega. */
  readonly tab?: TripNextStepTab;
  /** Factura a abrir (`open_draft`). */
  readonly invoiceId?: string;
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
  /** Puede mutar/completar reserva (trips.update). */
  readonly canUpdateTrip: boolean;
  /**
   * Eleva Facturar en next-step (D10 / F6): ≥1 scope freight-family
   * (`primary_transport` | `false_trip` | `split_share`).
   * Accessory-only → false; create accesoria queda en header/menú (D12).
   * El caller deriva con `hasFreightFamilyTripInvoiceScope`.
   */
  readonly canInvoice: boolean;
  /**
   * Atención fiscal (ATF): el CTA del job (Sustituir / …) no debe competir
   * con Facturar genérico en next-step (F4 / PRD).
   */
  readonly requiresFiscalAttention?: boolean;
  /** Tab activo del detalle; evita CTA «Ir a Seguimiento» redundante. */
  readonly activeTab?: string | null;
  /**
   * Borradores ligados (F9 / D18). Caller deriva con `listLinkedTripInvoiceDrafts`.
   * Con elevate Facturar (D10) no se usan para secundaria fiscal create.
   */
  readonly linkedDraftInvoiceIds?: readonly string[];
};

const MAX_SECONDARIES = 2;

function takeSecondaries(
  actions: readonly TripNextStepAction[],
): TripNextStepAction[] {
  return actions.slice(0, MAX_SECONDARIES);
}

function trackingSecondary(
  activeTab: string | null | undefined,
): TripNextStepAction | null {
  if (activeTab === "tracking") return null;
  return { id: "go_to_tracking", tab: "tracking" };
}

function draftSecondary(
  linkedDraftInvoiceIds: readonly string[] | undefined,
): TripNextStepAction | null {
  const ids = linkedDraftInvoiceIds ?? [];
  if (ids.length === 0) return null;
  if (ids.length === 1) {
    return { id: "open_draft", invoiceId: ids[0] };
  }
  return { id: "view_invoices" };
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
    canUpdateTrip,
    canInvoice,
    requiresFiscalAttention = false,
    activeTab,
    linkedDraftInvoiceIds,
  } = input;

  if (status === TripStatus.DRAFT) {
    if (!canUpdateTrip) return null;

    if (!routeReady || !cargoReady) {
      const primaryTab: TripNextStepTab = !routeReady ? "route" : "cargo";
      const primary: TripNextStepAction = {
        id: "complete_route_cargo",
        tab: primaryTab,
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
    const tracking = trackingSecondary(activeTab);
    /** Con ATF, Facturar genérico cede al banner/CTA del job fiscal. */
    const elevateInvoice = canInvoice && !requiresFiscalAttention;

    if (elevateInvoice) {
      const secondaries = tracking ? [tracking] : [];
      return {
        phase,
        primary: { id: "invoice" },
        secondaries: takeSecondaries(secondaries),
      };
    }

    if (tracking) {
      const draft = draftSecondary(linkedDraftInvoiceIds);
      const secondaries = draft ? [draft] : [];
      return {
        phase,
        primary: tracking,
        secondaries: takeSecondaries(secondaries),
      };
    }

    return null;
  }

  if (status === TripStatus.COMPLETED && canInvoice) {
    return {
      phase: "completed",
      primary: { id: "invoice" },
      secondaries: [],
    };
  }

  return null;
}
