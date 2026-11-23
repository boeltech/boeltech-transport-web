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
    /** D6 / F1: label anticipa Resumen (contenido 2-col = F2). */
    operation: "Resumen",
    operationClient: "Resumen",
    operationDriver: "Resumen",
    route: "Ruta",
    tracking: "Seguimiento",
    cargo: "Cargas",
    costs: "Costos",
    /** D7 / F1: label anticipa Facturación (contenido = F5). */
    billing: "Facturación",
    /** D14 / D15: Sin factura → Cobro. */
    billingSinCfdi: "Cobro",
    history: "Historial",
    /** Polling de timeline; no implica GPS de unidad. */
    trackingLive: "En vivo",
    /** Indicador discreto (punto); no compite con el CTA «Incidente» del feed. */
    trackingIncident: "Incidente",
    trackingIncidentAria: "Con incidente abierto",
    openIncident: "Incidente",
    billingPendingAria: "Pendiente fiscal",
    billingDotAria: "Pendiente en Facturación",
    costsReturnedAria: "Gasto devuelto",
  },
  alertsStack: {
    showMore: (n: number) =>
      n === 1 ? "Ver 1 aviso más" : `Ver ${n} avisos más`,
    showLess: "Ocultar avisos",
  },
  journeyStrip: {
    ariaLabel: "Estado y datos clave del viaje",
  },
  /** F4b R10 — badge outline junto a «Con factura». */
  badge: {
    withReturn: "Con retorno",
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
      "Ciérralo con una nota desde Seguimiento, o la marca se limpia al finalizar o cancelar el viaje.",
    openIncidentCta: "Ir a Seguimiento",
    fiscalAttentionTitle: "Revisión de facturación pendiente",
    /** Genérico (D4 / RP-4): cuerpo corto; detalle en Facturación. */
    fiscalAttentionBody:
      "Hubo cambios después de facturar. Sustituye la factura al cerrar o antes de cobrar.",
    /**
     * Solo si mutation_kind es fleet / reassignment (RP-4).
     * Prohibido «reasigna en Resumen» — flota se corrige en su card / Facturación.
     */
    fiscalAttentionBodyFleet:
      "Hubo cambios de flota después de facturar. Sustituye la factura al cerrar o antes de cobrar.",
    /** Gerente: verbo = trámite (D16 / RP-4). */
    fiscalAttentionManagerBody:
      "Hubo cambios después de facturar. Sustituye o cancela la factura.",
    fiscalAttentionCta: "Sustituir factura",
    /** Contador u otro rol sin escritura SAT: abrir + pide gerente (D9). */
    fiscalAttentionOpenInvoiceCta: "Abrir factura",
    fiscalAttentionAskManagerBody:
      "Hubo cambios después de facturar. Abre la factura y pide a un gerente cancelar o sustituir.",
    /** Sin escritura SAT y sin job fiscal (dispatcher) (D10). */
    fiscalAttentionEscalateBody:
      "Avisa a facturación: hay cambios que deben revisar en la factura.",
    fiscalAttentionChip: "Atención fiscal",
    fiscalAttentionNoInvoiceBody:
      "Hay un pendiente de facturación. Revísalo en Facturación.",
    /** Sustitución parcial (flete con active_replacement): no mid-trip flota/Sustituir. */
    substitutionCancelPendingTitle:
      "Sustituta emitida; original sin cancelar",
    substitutionCancelPendingBody:
      "La factura de flete tiene una sustituta vigente y el original sigue sin cancelar. Abre la factura original y reintenta la cancelación.",
    substitutionCancelPendingCta: "Abrir factura original",
    /** ADR-0081: prorrateo — genérico sin consejo de flota (D4 / RP-4). */
    fiscalAttentionSplitBody:
      "Hubo cambios después de facturar. Sustituye cada porción ya facturada al cerrar o antes de cobrar.",
    fiscalAttentionSplitBodyFleet:
      "Hubo cambios de flota después de facturar. Sustituye cada porción ya facturada al cerrar o antes de cobrar.",
    fiscalAttentionSplitManagerBody:
      "Hubo cambios después de facturar. Sustituye cada porción facturada pendiente.",
    fiscalAttentionSplitCta: "Abrir factura de porción",
    fiscalAttentionSplitMenuCta: "Abrir factura de porción…",
    fiscalAttentionSplitLegCta: (label: string) => `Porción · ${label}`,
    fiscalAttentionSplitNoInvoiceBody:
      "Hay un pendiente de facturación con prorrateo. Revísalo en Facturación.",
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
      "El viaje pasará a «Programado». Quedarán asignados la unidad y el conductor. Pide tarifa y llegada estimada; no exige domicilio fiscal ni mercancías.",
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
    /** F5d-c / PRD: gate Confirmar reserva con gap multi-unload. */
    draftConfirmDeliveryBlocked:
      "No se puede continuar: hay cargas sin entrega planificada.",
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
    /** Conductor 403: no es suyo o falta vínculo user→conductor (D9). */
    accessDeniedDescriptionDriver:
      "Este viaje no es tuyo o tu usuario no está vinculado a un conductor. Pide el vínculo a administración.",
    /** Cliente 403: no es suyo o falta vínculo user→cliente (D9). */
    accessDeniedDescriptionClient:
      "Este envío no es tuyo o tu usuario no está vinculado a un cliente. Pide el vínculo a administración.",
    loadErrorTitle: "No se pudo cargar el viaje",
    loadErrorDescription:
      "Ocurrió un error al obtener los datos. Intenta de nuevo.",
    retryLoad: "Reintentar",
    backToList: "Volver a Viajes",
    backToListDriver: "Volver a Mis viajes",
    backToListClient: "Volver a Mis envíos",
    /** Desde Inicio (`/dashboard`) — léxico del menú. */
    backToDashboard: "Volver a Inicio",
    /** Desde detalle de factura (`/invoices/:id`). */
    backToInvoice: "Volver a la factura",
    /** Desde listado Finanzas facturas. */
    backToInvoices: "Volver a facturas",
    backToApprovals: "Volver a aprobaciones",
    /** Desde Análisis (`/finance/analysis`). */
    backToAnalysis: "Volver al análisis",
    backToInvoiceable: "Volver a Por facturar",
    backToDispatch: "Volver a envíos",
    backToDispatchPeriod: "Volver a Correo del periodo",
    backToDispatchRun: "Volver al envío",
    /** Desde detalle viaje abierto desde liquidaciones (create/detalle). */
    backToSettlementPayment: "Volver al pago",
  },
  format: {
    /** RP-5: el contador va en badge; el label del tab es solo «Ruta». */
    routeTab: (_stopCount?: number) => "Ruta",
  },
  /** Portal cliente: enlace read-only al módulo de facturas. */
  action: {
    viewInvoices: "Ver facturas",
    confirmReserve: "Confirmar reserva",
    confirm: "Confirmar",
    cancel: "Cancelar",
    more: "Más",
    /** D5 / D14: outline en header. */
    invoice: "Facturar",
    /** Q11 / C24: header Sin factura. */
    registerCash: "Registrar cobro",
    /** Legado: el CTA de fase ya no vive en el header (HB-G2-CTA). */
    goToTracking: "Ir a Seguimiento",
    startTrip: "Despachar…",
    closeTrip: "Cerrar viaje",
  },
  toast: {
    scheduledTitle: "Viaje programado",
    scheduledBody: (code: string) => `${code} está listo para iniciar`,
    scheduleError: "No se pudo programar",
    overlapWarningTitle: "Posible traslape con una reserva",
  },
  /**
   * Hard collect-all `FLEET_AVAILABILITY_CONFLICT` (0071).
   * Lista: tipo · identidad · viaje peer.
   */
  fleetAvailability: {
    confirmTitle: "No se puede confirmar: flota en conflicto",
    saveTitle: "No se puede guardar: flota en conflicto",
    createTitle: "No se puede crear: flota en conflicto",
    reassignCta: "Reasignar flota",
    typeVehicle: "Unidad",
    typeTrailer: "Remolque",
    typeDriver: "Operador",
    typeStaff: "Apoyo",
    roleHelper: "ayudante",
    roleSecondaryDriver: "2º conductor",
  },
  readiness: {
    title: "Reserva guardada",
    titleScheduled: "Viaje programado",
    hint: "Confirmar pide tarifa y llegada. Paradas y cargas pueden seguir pendientes.",
    hintScheduled:
      "Origen y destino son necesarios para iniciar. Las cargas no bloquean iniciar.",
    scheduleGroup: "Para programar",
    /** NS4 — Programado: Paradas, Flota, Kilometraje. */
    startGroup: "Para iniciar",
    operateGroup: "Para completar",
    /** NS3 — sufijo muted (minúscula, sin punto). */
    operateHint: "no bloquea confirmar ni iniciar",
    operateHintScheduled: "las cargas no bloquean iniciar",
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
  /**
   * Bloque next-step above-the-fold (D4 / F2 / F8 D15 / F9 D16–D20 · Enmienda NS).
   * Una primaria + ≤2 secundarias; checklist de chips siempre visible en Reserva/Programado.
   */
  nextStep: {
    /** NS8 — Programado / En ruta / Completado. */
    title: "Qué sigue",
    /** NS8 — Reserva (draft_*). */
    titleDraft: "Siguiente paso",
    /**
     * @deprecated F5c / D33 — usar `formatTripLateDelayChip` («Nh de retraso»).
     * Se mantiene solo por compat de imports; no renderizar como chip único.
     */
    lateSuffix: "va tarde",
    completeRouteCargo: "Completar ruta y cargas",
    completeRoute: "Completar ruta",
    /** D57 / F8c — Qué sigue nombra el pendiente concreto (AmbosCiudad). */
    completeOrigin: "Elegir el origen",
    completeDestination: "Elegir el destino",
    completeDomicilio: "Completar domicilio",
    /** Ambos extremos solo ciudad / 0 stops. */
    completeRouteCities: "Elegir el origen",
    completeCargo: "Completar cargas",
    confirmReserve: "Confirmar reserva",
    /** NS7 — CTA flota (Sheet existente vía ?assignFleet=1). */
    assignFleet: "Asignar flota",
    titleAssignFleet: "Asigna unidad y conductor",
    descriptionAssignFleet:
      "Con flota asignada podrás confirmar la reserva. Llegada, tarifa y kilometraje se piden al confirmar.",
    /** HB-G2-CTA: abre StartTripSheet / sheets de parada. */
    openOperate: "Despachar…",
    goToTracking: "Ir a Seguimiento",
    goToStart: "Despachar…",
    invoice: "Facturar",
    goToRoute: "Ir a Ruta",
    goToCargo: "Ir a Cargas",
    adjustRoute: "Ajustar ruta",
    adjustCargo: "Ajustar cargas",
    /** D18: un borrador direccionable (fuera de Qué sigue en F3d-4). */
    openDraft: "Abrir borrador",
    /** D18: varios borradores — reuso léxico listado. */
    viewInvoices: "Ver facturas",
    /** F3d-4: secundaria outline en En ruta. */
    registerNote: "Nota",
    /** F3b desenlaces. */
    declareFalseTrip: "Declarar viaje en falso",
    cancelTrip: "Cancelar viaje",
    planReturn: "Planear retorno",
    descriptionOriginOutcome:
      "Elige: cobrar el desplazamiento (viaje en falso) o cancelar el viaje.",
    descriptionReturnReplan:
      "Hay mercancía devuelta. Planea el retorno antes de cerrar el viaje.",
    /**
     * @deprecated NS2 — chips siempre visibles; no hay botón «Qué falta».
     * Se mantiene por compat de imports / tests de copy.
     */
    whatMissing: "Qué falta",

    descriptionDraftIncomplete:
      "Arma paradas y cargas en el detalle. Llegada, tarifa y kilometraje se piden al confirmar.",
    descriptionDraftReady:
      "Ruta y cargas listas. Confirma para pasar el viaje a Programado. Llegada, tarifa y kilometraje se piden al confirmar.",
    /**
     * @deprecated NS7 — sustituido por `descriptionAssignFleet` + acción `assign_fleet`.
     */
    descriptionDraftReadyFleetBlocked:
      "Asigna unidad y conductor antes de confirmar. Llegada, tarifa y kilometraje se piden al confirmar.",
    descriptionScheduledCreate:
      "Ya puedes facturar el flete; la Carta Porte toma los datos de las paradas. Despacha cuando toque salir.",
    descriptionScheduledWithDraft:
      "Ya hay factura en borrador. Continúa el timbrado desde Facturación o despacha el viaje.",
    descriptionScheduledWithDrafts:
      "Ya hay facturas en borrador. Continúa el timbrado desde Facturación o despacha el viaje.",
    descriptionScheduledOperate:
      "Despacha el viaje para pasarlo a En ruta. Facturar queda en el encabezado si aplica.",
    descriptionInProgressCreate:
      "Registra la siguiente parada. Puedes facturar desde el encabezado si aplica.",
    descriptionInProgressWithDraft:
      "Registra la siguiente parada. Hay factura en borrador en Facturación.",
    descriptionInProgressOperate: "Registra la siguiente acción de la parada en curso.",
    descriptionCompleted: "Emite la factura del viaje cuando corresponda.",
    descriptionScheduledSplitPartial: (invoiced: number, total: number) =>
      `Se facturaron ${invoiced} de ${total} porciones. Puedes seguir con las restantes. Despacha cuando toque salir.`,
    descriptionInProgressSplitPartial: (invoiced: number, total: number) =>
      `Se facturaron ${invoiced} de ${total} porciones. Sigue con las restantes o registra la parada en curso.`,
    descriptionCompletedSplitPartial: (invoiced: number, total: number) =>
      `Se facturaron ${invoiced} de ${total} porciones. Emite las restantes cuando corresponda.`,
    /** NS9 — pie Completado. */
    alsoPrefix: "También:",
    expensesInReview: (count: number) =>
      count === 1 ? "1 gasto en revisión" : `${count} gastos en revisión`,
    lateExpensesUntil: (dateLabel: string) =>
      `Puedes registrar gastos tardíos hasta el ${dateLabel}`,
  },
  /**
   * Sheet elección borradores N≥2 (F9b / D18′). Copy exacto PRD.
   */
  linkedDraftsSheet: {
    title: "Facturas del viaje",
    description: "Elige cuál abrir.",
    rowPrincipal: "Flete",
    rowAccessory: "Servicios adicionales",
    close: "Cerrar",
  },
  /**
   * Strip mid-trip (F4 / D7 · F11b / D22): chips-only — sin tab nuevo.
   * `title` / `description` quedan sin render (D22/D29); si se reintroduce
   * título visible, el label es «Ajustes» (no «Ajustes en ruta»).
   * Deep-links a Ruta (paradas pendientes), Cargas y reasignar flota.
   */
  midTripStrip: {
    title: "Ajustes en ruta",
    description:
      "Paradas pendientes, carga extra o cambio de flota — sin dejar el viaje.",
    pendingStops: "Paradas pendientes",
    pendingStopsCount: (count: number) =>
      count === 1 ? "1 parada pendiente" : `${count} paradas pendientes`,
    addCargo: "Agregar carga",
    reassignFleet: "Reasignar flota",
  },
} as const;
