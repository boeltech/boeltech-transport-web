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
    costs: "Dinero del viaje",
    history: "Historial",
    trackingLive: "En vivo",
    trackingIncident: "Incidente",
    openIncident: "Incidente",
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
    openIncidentTitle: "Incidente registrado en el viaje",
    openIncidentBody:
      "Quedó en la bitácora de Seguimiento. La marca se limpia al finalizar o cancelar el viaje.",
    openIncidentCta: "Ir a Seguimiento",
    fiscalAttentionTitle: "Revisión de facturación pendiente",
    fiscalAttentionBody:
      "Hubo cambios operativos después de facturar. Si falta flota válida (p. ej. docs vencidos), reasigna en Operación; luego sustituye la factura al cerrar o antes de cobrar el ajuste. No bloquea la operación del viaje.",
    fiscalAttentionCta: "Sustituir factura",
    fiscalAttentionChip: "Atención fiscal",
    fiscalAttentionNoInvoiceBody:
      "Hay un pendiente de facturación en este viaje. Revísalo en Facturación cuando corresponda.",
    /** ADR-0081: prorrateo — no pretender un solo documento de flete. */
    fiscalAttentionSplitBody:
      "Hubo cambios operativos después de facturar. Si falta flota válida (p. ej. docs vencidos), reasigna en Operación; luego sustituye cada porción facturada pendiente al cerrar o antes de cobrar el ajuste. No bloquea la operación del viaje.",
    fiscalAttentionSplitCta: "Abrir factura de porción",
    fiscalAttentionSplitMenuCta: "Abrir factura de porción…",
    fiscalAttentionSplitLegCta: (label: string) => `Porción · ${label}`,
    fiscalAttentionSplitNoInvoiceBody:
      "Hay un pendiente de facturación en este viaje con prorrateo. Revísalo en Facturación cuando corresponda.",
    falseTripChip: "Viaje en falso",
    falseTripCancelCfdiTitle: "Cancela la factura de flete",
    falseTripCancelCfdiBody:
      "En la factura usa el motivo de operación no realizada. No conserves ni sustituyas esa factura.",
    falseTripCancelCfdiCta: "Abrir factura",
    falseTripReadyTitle: "Listo para facturar el desplazamiento",
    falseTripReadyBody:
      "El viaje quedó en falso. Genera la factura de ingreso desde Facturación.",
    assignmentIncompleteTitle: "Viaje programado sin asignación completa",
    assignmentVehicleMissing: "Sin unidad asignada.",
    assignmentDriverMissing: "Sin conductor asignado.",
    assignmentVehicleLabel: "Unidad",
    assignmentDriverLabel: "Conductor",
    draftReserveTitle: "Reserva guardada",
    draftReserveBody:
      "Para programar captura llegada y tarifa si faltan. Paradas y cargas pueden esperar.",
    draftConfirmCta: "Confirmar reserva",
    draftCompleteRouteCta: "Completar ruta",
    draftCompleteCargoCta: "Completar cargas",
    draftConfirmHint:
      "El viaje pasará a «Programado» y se reservará la unidad y el conductor. Pide tarifa y llegada estimada; no exige domicilio fiscal ni mercancías.",
    draftConfirmMileageLabel: "Kilometraje inicial",
    draftConfirmMileageHint:
      "Odómetro al salir. Si la unidad tiene 0 km, confirma o corrige la lectura.",
    draftConfirmMileageRequired:
      "Captura el kilometraje inicial (odómetro al salir) antes de confirmar.",
    draftConfirmArrivalRequired: "Indica la llegada estimada antes de confirmar.",
    draftConfirmRateRequired: "Indica la tarifa acordada antes de confirmar.",
    draftConfirmArrivalLabel: "Llegada estimada",
    draftConfirmRateLabel: "Tarifa acordada",
    draftConfirmMissingTitle: "Falta para programar",
    draftConfirmFleetBlocked:
      "Asigna unidad y conductor antes de confirmar la reserva.",
    draftConfirmTitle: "¿Confirmar esta reserva?",
    etaPassedTitle: "Tiempo de llegada estimado superado",
    etaPassedLabel: "Llegada estimada",
    operationIncompleteTitle: "Datos de operación incompletos",
    operationVehicleMissing: "Sin datos de unidad en el viaje.",
    operationDriverMissing: "Sin datos de conductor en el viaje.",
    /** Ephemeral tras cancelar viaje (consola facturación). */
    postCancelFiscalTitle: "Acción de facturación pendiente tras la cancelación",
    postCancelFiscalActionLine:
      "Cancela la(s) factura(s) vigente(s) con motivo de operación no realizada.",
    postCancelFiscalInvoiceStatus: (status: string) =>
      `Estado de factura: ${status}`,
    postCancelFiscalInvoiceRef: (ref: string) => `Referencia: ${ref}`,
    /**
     * Banner durable: viaje cancelled + requiresFiscalAttention (no mid-trip).
     * Orientar a cancelar factura / abrir detalle; nunca sustituir ni flota/docs.
     */
    postCancelFiscalAttentionTitle:
      "Acción de facturación pendiente tras la cancelación",
    postCancelFiscalAttentionBody:
      "El viaje está Cancelado y hay una factura vigente. Si no tiene cobros, cancélala con motivo de operación no realizada. Si tiene cobros, ábrela: ahí verás la limitación y el procedimiento.",
    postCancelFiscalAttentionCta: "Abrir factura",
    postCancelFiscalAttentionNoInvoiceBody:
      "El viaje está Cancelado y hay un pendiente de facturación. Revísalo en Facturación cuando corresponda.",
    postCancelFiscalAttentionSplitBody:
      "El viaje está Cancelado y hay factura(s) vigente(s) por porción. 1) Cancela cada factura de porción con motivo de operación no realizada (si tiene cobros, ábrela: ahí verás la limitación). 2) Al cancelar la última, el reparto se cierra solo.",
    postCancelFiscalAttentionSplitCta: "Abrir factura de porción",
    postCancelFiscalAttentionSplitMenuCta: "Abrir factura de porción…",
    postCancelFiscalAttentionSplitNoInvoiceBody:
      "El viaje está Cancelado. Las porciones sin factura no deben emitirse; el reparto se cierra solo o ya quedó cerrado.",
  },
  state: {
    notFoundTitle: "Viaje no encontrado",
    notFoundDescription: "El viaje que buscas no existe o fue eliminado.",
    accessDeniedTitle: "Sin acceso a este viaje",
    accessDeniedDescription:
      "No tienes permiso para ver este viaje o no está disponible para tu cuenta.",
    loadErrorTitle: "No se pudo cargar el viaje",
    loadErrorDescription:
      "Ocurrió un error al obtener los datos. Intenta de nuevo.",
    retryLoad: "Reintentar",
    backToList: "Volver a Viajes",
  },
  format: {
    routeTab: (stopCount: number) =>
      stopCount > 0 ? `Ruta (${stopCount})` : "Ruta",
  },
  /** Portal cliente: enlace read-only al módulo de facturas. */
  action: {
    viewInvoices: "Ver facturas",
    confirmReserve: "Confirmar reserva",
    confirm: "Confirmar",
    cancel: "Cancelar",
    more: "Más",
  },
  toast: {
    scheduledTitle: "Viaje programado",
    scheduledBody: (code: string) => `${code} está listo para iniciar`,
    scheduleError: "No se pudo programar",
    overlapWarningTitle: "Posible traslape con una reserva",
  },
  readiness: {
    title: "Reserva guardada",
    titleScheduled: "Viaje programado",
    hint: "Confirmar pide tarifa y llegada. Paradas y cargas pueden seguir pendientes.",
    hintScheduled:
      "Origen y destino son necesarios para iniciar. Las cargas no bloquean iniciar.",
    scheduleGroup: "Para programar",
    operateGroup: "Para completar",
    operateHint: "No bloquea confirmar ni iniciar.",
    operateHintScheduled: "Las cargas no bloquean iniciar.",
    goToTracking: "Ir a Seguimiento",
    order: "Pedido",
    fleet: "Flota",
    departure: "Salida",
    arrival: "Llegada",
    route: "Paradas",
    cargo: "Cargas",
    cargoNeedsPickup: "Cargas: primero arma las paradas",
    rate: "Tarifa",
    mileage: "Kilometraje",
    done: "Listo",
    pending: "Pendiente",
    readyToConfirm: (client: string, route: string) =>
      `Reserva de ${client}: ${route}. Lista para confirmar.`,
    readyToStart: (client: string, route: string) =>
      `Viaje de ${client}: ${route}. Puedes iniciar en Seguimiento.`,
    missingToStart: (client: string, route: string) =>
      `Viaje de ${client}: ${route}. Faltan paradas de origen y destino para iniciar.`,
    missingToSchedule: (client: string, route: string, missing: string) =>
      `Reserva de ${client}: ${route}. Para programar falta: ${missing}.`,
    fallbackClient: "este cliente",
    fallbackRoute: "ruta por confirmar",
  },
} as const;
