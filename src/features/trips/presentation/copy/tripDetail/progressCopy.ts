/**
 * Namespace: trips.copy.tripDetail.progress.*
 * KPIs de avance por paradas — compartido entre tabs Ruta y Seguimiento.
 */
export const progressCopy = {
  label: {
    percent: "Progreso",
    completedStops: "Paradas completadas",
    /** Badge por parada (Ruta + itinerario Seguimiento). */
    stopCompleted: "Completada",
    stopAtWaypoint: "En escala",
    stopAtDestination: "En destino",
    stopPending: "Pendiente",
    stopSkippedNotVisited: "Omitido — no se visitó",
  },
  hint: {
    percent: "Paradas completadas sobre el total del itinerario.",
    completedStops: (completed: number, total: number) =>
      `${completed} / ${total} paradas completadas`,
  },
  format: {
    completedRatio: (completed: number, total: number) => `${completed} / ${total}`,
  },
} as const;
