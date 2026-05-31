/**
 * Namespace: trips.copy.tripDetail.tracking.*
 * Migrado desde trip-tracking/trackingCopy.ts (patrón ACC).
 */
export const trackingCopy = {
  section: {
    status: "Estado operativo",
    actions: "Acciones de seguimiento",
    itinerary: "Itinerario operativo",
    timeline: "Timeline operativo",
    map: "Mapa operativo",
  },
  action: {
    start: "Iniciar viaje",
    arrive: "Registrar llegada",
    depart: "Registrar salida",
    close: "Finalizar viaje",
    note: "Nota",
    incident: "Incidente",
    refresh: "Actualizar",
  },
  state: {
    live: "En vivo",
    syncing: "Sincronizando…",
    readOnly: "Solo lectura",
    noEvents: "Sin eventos",
    noStops: "Sin paradas",
  },
  hint: {
    scope: "Seguimiento registra eventos y evidencias operativas.",
    map: "Ubicación de paradas y eventos con GPS.",
    itinerary: "Progreso por parada. «Objetivo actual» indica dónde actuar.",
    actionsScope:
      "Registra operaciones y evidencia. La parada objetivo se marca en el itinerario.",
    nextStepFallback: "Sin acciones pendientes",
    openIncident: "Hay un incidente abierto. Revisa el timeline antes de cerrar.",
  },
  error: {
    startRequiresScheduled: "Requiere estado programado.",
    arriveRequiresInProgress: "Requiere viaje en curso y parada pendiente.",
    departRequiresEscala: "Requiere escala con llegada registrada.",
    closeRequiresDestination: "Requiere llegada en destino.",
    registerRequiresInProgress: "Requiere viaje en curso.",
  },
} as const;
