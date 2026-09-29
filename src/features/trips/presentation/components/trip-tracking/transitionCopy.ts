/**
 * Copy de transición explícita para acciones de seguimiento (ADR-0046).
 * Visible debajo de cada botón operativo — frase operativa, sin notación A → B.
 */

export const STOP_TRANSITION_COPY = {
  dispatch: "El viaje pasa a En Ruta",
  start: "El viaje pasa a En Ruta",
  arrive: "La parada queda en curso",
  departOrigin: "El viaje sigue En Ruta",
  depart: "La parada queda completada",
  close: "La parada queda completada y el viaje se cierra",
  quickClose: "El viaje queda completado",
  declareFalseTrip:
    "El viaje queda completado. Se puede facturar el desplazamiento.",
  /** Conductor: sin facturar (D12). */
  declareFalseTripDriver: "El viaje queda completado.",
} as const;

export function resolveDeclareFalseTripTransition(
  isDriverPortal: boolean,
): string {
  return isDriverPortal
    ? STOP_TRANSITION_COPY.declareFalseTripDriver
    : STOP_TRANSITION_COPY.declareFalseTrip;
}

export type StopTransitionAction = keyof typeof STOP_TRANSITION_COPY;

export const CARGO_TRANSITION_COPY = {
  pickup: "La carga queda en tránsito",
  deliver: "La carga queda entregada",
  return: "La carga queda devuelta",
  cancel: "La carga queda cancelada",
} as const;

export type CargoTransitionAction = keyof typeof CARGO_TRANSITION_COPY;

export const legendCopy = {
  stop: {
    title: "Estados de parada",
    expand: "Estados de parada",
    collapse: "Ocultar",
    flow: ["Pendiente", "En curso", "Completado"] as const,
    alternate: "Omitido",
  },
  cargo: {
    title: "Estados de carga",
    expand: "Estados de carga",
    collapse: "Ocultar",
    flow: ["Pendiente", "En tránsito", "Entregada"] as const,
    terminals: ["Devuelta", "Cancelada"] as const,
  },
  nextAction: {
    idle: "Sin acciones pendientes (revisa cargas)",
  },
} as const;
