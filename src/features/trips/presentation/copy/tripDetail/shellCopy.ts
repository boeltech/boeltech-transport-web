/**
 * Namespace: trips.copy.tripDetail.shell.*
 * Copy transversal del detalle (header, tabs, alertas globales).
 * Léxico operativo (PD-TD1 / PD-TD7) — sin CFDI/UUID/SAT como labels primarios.
 */
export const shellCopy = {
  title: {
    fallback: "Viaje",
  },
  tab: {
    operation: "Operación",
    operationClient: "Resumen",
    operationDriver: "Resumen",
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
    baseRate: "Tarifa",
    baseRateClient: "Tarifa del envío",
    baseRateDriver: "Tarifa",
    departure: "Salida",
    arrival: "Llegada est.",
    vehicle: "Unidad",
    driver: "Conductor",
    noRate: "Sin tarifa",
    cargoWeightTotal: (kg: number) =>
      `${kg.toLocaleString("es-MX")} kg total`,
  },
  alert: {
    openIncidentTitle: "Incidente operativo abierto",
    openIncidentBody:
      "Hay un incidente sin cerrar. Revise el tab Seguimiento.",
    fiscalAttentionTitle: "Revisión de facturación pendiente",
    fiscalAttentionBody:
      "Este viaje tiene un pendiente de facturación. Use el menú Facturación para continuar.",
    assignmentIncompleteTitle: "Viaje programado sin asignación completa",
    assignmentVehicleMissing: "Sin unidad asignada.",
    assignmentDriverMissing: "Sin conductor asignado.",
    assignmentVehicleLabel: "Unidad",
    assignmentDriverLabel: "Conductor",
    draftReserveTitle: "Reserva pendiente",
    draftReserveBody:
      "Confirma cuando tengas tarifa y llegada estimada. Completa ruta y cargas antes de continuar.",
    draftConfirmCta: "Confirmar reserva",
    draftCompleteRouteCta: "Completar ruta",
    draftCompleteCargoCta: "Completar cargas",
    etaPassedTitle: "Tiempo de llegada estimado superado",
    etaPassedLabel: "Llegada estimada",
    operationIncompleteTitle: "Datos de operación incompletos",
    operationVehicleMissing: "Sin datos de unidad en el viaje.",
    operationDriverMissing: "Sin datos de conductor en el viaje.",
    postCancelFiscalTitle: "Acción de facturación pendiente tras la cancelación",
    postCancelFiscalInvoiceStatus: (status: string) =>
      `Estado de factura: ${status}`,
    postCancelFiscalInvoiceRef: (ref: string) => `Referencia: ${ref}`,
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
  /** Portal cliente: enlace read-only al módulo de facturas. */
  action: {
    viewInvoices: "Ver facturas",
  },
} as const;
