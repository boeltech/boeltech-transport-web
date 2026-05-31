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
    distance: "Distancia",
    duration: "Duración",
    baseRate: "Tarifa base",
    cargoWeightTotal: (kg: number) =>
      `${kg.toLocaleString("es-MX")} kg total`,
  },
  alert: {
    openIncidentTitle: "Incidente operativo abierto",
    openIncidentBody:
      "Hay un incidente sin cerrar en el seguimiento. Revise el tab Seguimiento y el timeline.",
    fiscalAttentionTitle: "Atención fiscal requerida",
    fiscalAttentionBody:
      "Este viaje requiere revisión fiscal. Consulte la sección Fiscal, la factura ligada o los pendientes SAT antes de continuar la operación.",
    assignmentIncompleteTitle: "Viaje programado sin asignación completa",
    assignmentVehicleMissing: "Sin unidad asignada.",
    assignmentDriverMissing: "Sin conductor asignado.",
    assignmentVehicleLabel: "Vehículo",
    assignmentDriverLabel: "Conductor",
    etaPassedTitle: "Tiempo de llegada estimado superado",
    etaPassedLabel: "Llegada estimada",
    operationIncompleteTitle: "Datos de operación incompletos",
    operationVehicleMissing: "Sin datos de unidad en el viaje.",
    operationDriverMissing: "Sin datos de conductor en el viaje.",
    postCancelFiscalTitle: "Acción fiscal pendiente tras la cancelación",
    postCancelFiscalInvoiceStatus: (status: string) => `Estado factura: ${status}`,
    postCancelFiscalCfdiUuid: (uuid: string) => `UUID CFDI: ${uuid}`,
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
