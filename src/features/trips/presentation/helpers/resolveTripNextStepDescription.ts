/**
 * Description del bloque next-step (F8 / D15 · F9 / D16–D20 · F11c / D28).
 * Enriquecer con blocker duro (Flota), variantes create/borrador o progreso split.
 */

import { tripDetailCopy } from "../copy";
import type { TripNextStepPhase } from "./resolveTripNextStepActions";

const copy = tripDetailCopy.shell.nextStep;

export type ResolveTripNextStepDescriptionInput = {
  readonly phase: TripNextStepPhase;
  /** false → menciona Flota como bloqueo de Confirmar (draft_ready). */
  readonly fleetReady?: boolean;
  /**
   * Elevate Facturar create (D10) — variante A Programado / En ruta.
   * Caller: mismo booleano que alimenta `canInvoice` en el plan sin ATF.
   */
  readonly elevateInvoice?: boolean;
  /** Conteo de borradores ligados (F9). */
  readonly linkedDraftCount?: number;
  /** Porciones facturadas del prorrateo (F11c / D28). */
  readonly splitLegsInvoiced?: number;
  /** Total de porciones del prorrateo (F11c / D28). */
  readonly splitLegsTotal?: number;
};

function isSplitPartial(
  invoiced: number | undefined,
  total: number | undefined,
): boolean {
  return (
    typeof invoiced === "number" &&
    typeof total === "number" &&
    invoiced > 0 &&
    invoiced < total
  );
}

export function resolveTripNextStepDescription(
  input: ResolveTripNextStepDescriptionInput,
): string {
  const {
    phase,
    fleetReady = true,
    elevateInvoice = false,
    linkedDraftCount = 0,
    splitLegsInvoiced,
    splitLegsTotal,
  } = input;

  const splitPartial = isSplitPartial(splitLegsInvoiced, splitLegsTotal);

  switch (phase) {
    case "draft_incomplete":
      return copy.descriptionDraftIncomplete;
    case "draft_ready":
      return fleetReady
        ? copy.descriptionDraftReady
        : copy.descriptionDraftReadyFleetBlocked;
    case "scheduled":
      if (splitPartial) {
        return copy.descriptionScheduledSplitPartial(
          splitLegsInvoiced as number,
          splitLegsTotal as number,
        );
      }
      if (elevateInvoice) return copy.descriptionScheduledCreate;
      if (linkedDraftCount > 1) return copy.descriptionScheduledWithDrafts;
      if (linkedDraftCount === 1) return copy.descriptionScheduledWithDraft;
      return copy.descriptionScheduledOperate;
    case "in_progress":
      if (splitPartial) {
        return copy.descriptionInProgressSplitPartial(
          splitLegsInvoiced as number,
          splitLegsTotal as number,
        );
      }
      if (elevateInvoice) return copy.descriptionInProgressCreate;
      if (linkedDraftCount >= 1) return copy.descriptionInProgressWithDraft;
      return copy.descriptionInProgressOperate;
    case "completed":
      if (splitPartial) {
        return copy.descriptionCompletedSplitPartial(
          splitLegsInvoiced as number,
          splitLegsTotal as number,
        );
      }
      return copy.descriptionCompleted;
  }
}
