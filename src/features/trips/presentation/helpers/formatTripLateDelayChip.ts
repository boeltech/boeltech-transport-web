/**
 * D33 — chip de retraso En ruta: «Nh de retraso» (horas enteras ≥1).
 * Si el atraso es &lt;1 h → «&lt;1 h de retraso».
 */
export function formatTripLateDelayChip(delayMs: number): string {
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    return "<1 h de retraso";
  }
  if (delayMs < 3_600_000) {
    return "<1 h de retraso";
  }
  const hours = Math.floor(delayMs / 3_600_000);
  return `${hours} h de retraso`;
}

/**
 * Atraso relevante para Qué sigue / chip header (salida o llegada vencida).
 * Prioriza llegada estimada si ya venció; si no, salida programada vencida.
 */
export function resolveTripLateDelayMs(input: {
  readonly nowMs: number;
  readonly scheduledDepartureMs: number | null;
  readonly scheduledArrivalMs: number | null;
  readonly hasActualDeparture: boolean;
  readonly hasActualArrival: boolean;
}): number | null {
  const {
    nowMs,
    scheduledDepartureMs,
    scheduledArrivalMs,
    hasActualDeparture,
    hasActualArrival,
  } = input;

  if (
    scheduledArrivalMs != null &&
    scheduledArrivalMs < nowMs &&
    !hasActualArrival
  ) {
    return nowMs - scheduledArrivalMs;
  }

  if (
    scheduledDepartureMs != null &&
    scheduledDepartureMs < nowMs &&
    !hasActualDeparture
  ) {
    return nowMs - scheduledDepartureMs;
  }

  return null;
}
