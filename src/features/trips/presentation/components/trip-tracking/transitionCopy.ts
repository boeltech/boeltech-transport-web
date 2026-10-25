/**
 * Copy de transición explícita para acciones de seguimiento (ADR-0046).
 * Visible debajo de cada botón operativo — frase operativa, sin notación A → B.
 */

export const STOP_TRANSITION_COPY = {
  /** Despacho operativo: aún no implica salida del origen. */
  dispatch: "El viaje queda listo para operar",
  start: "El viaje queda listo para operar",
  arrive: "La parada queda en curso",
  departOrigin: "Queda registrada la salida del origen",
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
  /** PD8 — CTA único bajo el riel (consola A). */
  states: {
    expand: "¿Qué significan los estados?",
  },
  stop: {
    title: "Estados de parada",
    expand: "¿Qué significan los estados?",
    collapse: "Ocultar",
    /** Catálogo canónico (F2 / PRD); «En espera» es fase derivada aparte. */
    flow: ["Pendiente", "En sitio", "Completada"] as const,
    alternate: "Omitida",
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
