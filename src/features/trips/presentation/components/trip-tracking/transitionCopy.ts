/**
 * Copy de transición explícita para acciones de seguimiento (ADR-0046 / ADR-0047).
 * Visible debajo de cada botón operativo — no requiere hover ni docs.
 */

export const STOP_TRANSITION_COPY = {
  dispatch: "Programado → En Progreso",
  start: "Programado → En Progreso",
  arrive: "Pendiente → En Progreso",
  departOrigin: "Salida de origen (inicia tránsito fiscal)",
  depart: "En Progreso → Completado",
  close: "En Progreso → Completado (cierra viaje)",
} as const;

export type StopTransitionAction = keyof typeof STOP_TRANSITION_COPY;

export const CARGO_TRANSITION_COPY = {
  pickup: "Pendiente → En Tránsito",
  deliver: "En Tránsito → Entregada",
  return: "En Tránsito → Devuelta",
  cancel: "→ Cancelada",
} as const;

export type CargoTransitionAction = keyof typeof CARGO_TRANSITION_COPY;

export const legendCopy = {
  stop: {
    title: "Estados de parada",
    expand: "Ver leyenda de estados de paradas",
    collapse: "Ocultar leyenda",
    flow: ["Pendiente", "En Progreso", "Completado"] as const,
    alternate: "Omitido",
  },
  cargo: {
    title: "Estados de carga",
    expand: "Ver leyenda de estados de cargas",
    collapse: "Ocultar leyenda",
    flow: ["Pendiente", "En Tránsito", "Entregada"] as const,
    terminals: ["Devuelta", "Cancelada"] as const,
  },
  nextAction: {
    idle: "Sin acciones pendientes (revisa cargas)",
  },
} as const;
