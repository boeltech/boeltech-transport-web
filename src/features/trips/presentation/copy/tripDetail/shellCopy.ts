/**
 * Namespace: trips.copy.tripDetail.shell.*
 * Copy transversal del detalle (header, tabs, alertas globales).
 */
export const shellCopy = {
  title: {
    fallback: "Viaje",
  },
  tab: {
    operation: "Operación",
    route: "Ruta",
    tracking: "Seguimiento",
    cargo: "Cargas",
    costs: "Costos",
    history: "Historial",
    trackingLive: "En vivo",
    trackingIncident: "Incidente",
    openIncident: "Incidente abierto",
  },
  stat: {
    cargo: "Cargas",
  },
  alert: {
    openIncidentTitle: "Incidente operativo abierto",
    openIncidentBody:
      "Hay un incidente sin cerrar en el seguimiento. Revise el tab Seguimiento y el timeline.",
  },
  state: {
    notFoundTitle: "Viaje no encontrado",
    notFoundDescription: "El viaje que buscas no existe o fue eliminado.",
    backToList: "Volver a Viajes",
  },
  format: {
    routeTab: (stopCount: number) =>
      stopCount > 0 ? `Ruta (${stopCount})` : "Ruta",
  },
} as const;
