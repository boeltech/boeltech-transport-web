import { billingCopy } from "../copy/tripDetail/billingCopy";

const titles = billingCopy.pendientes.mutationKinds;

/**
 * Título humano de «Qué cambió» a partir de `mutation_kind`.
 * Nunca expone el código ni el `reason` técnico del API.
 */
export function fiscalAttentionMutationTitle(kind: string): string {
  switch (kind) {
    case "stop_replan":
      return titles.stop_replan;
    case "stops":
    case "route":
      return titles.stops;
    case "cargo":
      return titles.cargo;
    case "fleet":
    case "reassignment":
      return titles.fleet;
    case "base_rate":
      return titles.base_rate;
    case "unknown":
      return titles.unknown;
    default:
      return titles.unknown;
  }
}

/** Consejo de flota del banner superior solo para estos kinds (D4). */
export function isFleetFiscalAttentionMutation(kind: string | null | undefined): boolean {
  return kind === "fleet" || kind === "reassignment";
}
