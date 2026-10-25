/**
 * Namespace: trips.copy.tripDetail.tracking.*
 * Léxico operativo (handoff Capa 1 — tab Seguimiento).
 */
export const trackingCopy = {
  section: {
    status: "Estado operativo",
    actions: "Acciones de seguimiento",
    objective: "Qué sigue",
    /**
     * Layout A (consola): zona Operate full-width.
     * @deprecated PD2 — no usar como cabecera de job; preferir `objective`.
     */
    now: "Ahora",
    /** Layout A: zona Operate (aria / landmark). */
    operate: "Operación",
    /** Layout A: mapa + bitácora bajo fold o sub-tabs. */
    consulta: "Consulta",
    contact: "Contacto",
    metrics: "Avance del viaje",
    itinerary: "Paradas",
    stopsAndCargos: "Paradas y cargas",
    /** Detalle del hub tracking (léxico operativo; no «mercancía»). */
    cargosAtStop: "Cargas en esta parada",
    /** Portal cliente: narrativa de estado, no «Qué sigue» operativo (D11). */
    statusClient: "Estado del envío",
    timeline: "Historial del viaje",
    map: "Mapa del viaje",
  },
  action: {
    /** Despacho operativo (no «Iniciar» genérico — CA5 / PD6). */
    start: "Despachar…",
    /** Footer sheet: ya en andén → batch dispatch+llegada (PD6). */
    dispatchAtDock: "Despachar en origen",
    /** Footer sheet: solo trip_dispatched (PD6 / T-START). */
    dispatchEnRoute: "Despachar (va en camino)",
    arrive: "Registrar llegada",
    depart: "Registrar salida",
    departOrigin: "Salida de origen",
    /** Cierre canónico en destino. */
    close: "Finalizar en destino",
    /** ADR-0088: atajo especial — demoted a ⋯ (PD5). */
    quickClose: "Cerrar sin bitácora completa",
    /**
     * Motivo típico de viaje en falso (placeholder / sheet).
     * El CTA del hub usa `declareFalseTrip`, no esta frase.
     */
    clientCancelledCargo: "El cliente canceló la carga",
    declareFalseTrip: "Declarar viaje en falso",
    note: "Nota",
    incident: "Incidente",
    /** Cierre operativo v1 (bandera + nota); no «Resolver». */
    closeIncident: "Cerrar incidente",
    refresh: "Actualizar",
    retry: "Reintentar",
    cancel: "Cancelar",
    now: "Ahora",
    /** Overflow Operate (PD5 / D5). */
    moreActions: "Más acciones",
    /**
     * F3 / D6: CTA Operate cuando hay N cargas pendientes (abre workbench o lista).
     * @deprecated Prefer `registerCargosAtStop` / `markPickup` — no usar «Ver…».
     */
    goToCargos: "Registrar cargas de la parada",
    /** Patio: N cargas en parada en curso (PRD copy table). */
    registerCargosAtStop: (stopLabel: string) =>
      `Registrar cargas en ${stopLabel}`,
    /** Patio: 1 carga pendiente de recogida (PRD). */
    markPickup: "Marcar recogida",
    /** Patio: 1 carga pendiente de entrega. */
    markDeliver: "Marcar entrega",
    /** CTA footer del sheet de parada (corto, sin «Parada N · …»). */
    confirmArrival: "Registrar llegada",
    confirmDeparture: "Registrar salida",
    timelineMore: "Ver más",
    /** F6: tel: del operador cuando hay teléfono en el viaje. */
    call: "Llamar",
  },
  label: {
    departureAt: "Fecha y hora de salida",
    /** Odómetro al despachar (≠ salida de origen / FechaHoraSalida CP). */
    startMileage: "Kilometraje al despachar",
    endMileage: "Kilometraje final",
    currentTarget: "Qué sigue",
    distancePlanned: "Km planeados",
    distanceActual: "Km recorridos",
    eta: "Llegada estimada",
    stopsProgress: (completed: number, total: number) =>
      `Parada ${Math.min(completed + 1, total)} de ${total}`,
    stopsProgressDone: (total: number) =>
      total === 1 ? "1 parada completada" : `${total} paradas completadas`,
    departedAt: (time: string) => `Salió ${time}`,
    arrivesAt: (time: string) => `Llega ~${time}`,
    /** Cabecera Z1: siguiente hito (no duplicar «Parada N de M» del riel). */
    nextStop: (label: string) => `Siguiente: ${label}`,
    /** Cabecera Z1 (F7): unidad ya en la parada (no «Siguiente:»). */
    onSite: "En sitio",
    /** Sheet despacho: hora del evento trip_dispatched (≠ salida de origen). */
    occurredAtDispatch: "¿A qué hora se despacha?",
    /** PD6: leyenda de la elección de ubicación. */
    dispatchLocationIntent: "¿Dónde está la unidad?",
    /**
     * Semáforo operativo derivado (F1-B / PRD). Sustituye el chip binario «Va tarde».
     * Códigos: on_time · at_risk · delayed · stopped · n/a.
     */
    trafficLightAria: "Semáforo operativo",
    trafficLight: {
      on_time: "A tiempo",
      at_risk: "En riesgo",
      delayed: "Retrasado",
      stopped: "Detenido",
      "n/a": "No aplica",
    },
    /** Resumen Z6 bajo fold (1 línea). */
    cargoSummary: (count: number, facts: string | null) =>
      facts
        ? count === 1
          ? `1 carga · ${facts}`
          : `${count} cargas · ${facts}`
        : count === 1
          ? "1 carga"
          : `${count} cargas`,
    /**
     * Estados canónicos de parada en el riel (F2 / PRD).
     * Códigos: pending | in_progress | completed | skipped — no inventar otros.
     */
    stopStatus: {
      pending: "Pendiente",
      in_progress: "En sitio",
      completed: "Completada",
      skipped: "Omitida",
    },
    /**
     * Fase derivada (T6): andén / at_stop — llegada real sin salida.
     * No es status de BD.
     */
    waitingPhase: "En espera",
    planVsRealArrival: (plan: string, real: string) =>
      `Llegada plan ${plan} · real ${real}`,
    planVsRealDeparture: (plan: string, real: string) =>
      `Salida plan ${plan} · real ${real}`,
    cargoCount: (count: number) =>
      count === 1 ? "1 carga" : `${count} cargas`,
    evidenceAtStop: "Nota o incidente",
    hazardous: "Peligroso",
    locationSaved: "Ubicación guardada",
    locationFromStop: "Ubicación de la parada",
    locationFromDevice: "Mi ubicación",
    occurredAtArrival: "¿A qué hora llegó?",
    occurredAtDeparture: "¿A qué hora salió?",
    occurredAtDeclare: "¿A qué hora ocurrió?",
    /** F6 contacto flota. */
    operator: "Operador",
    mobile: "Celular",
    /** Vacío de celular en Contacto (PRD F8 — muted, no warning). */
    mobileNotCaptured: "No capturado",
    unit: "Unidad",
  },
  sheet: {
    /** F6: Sheet workbench de la parada en curso. */
    stopWorkbenchTitle: "Parada en curso",
    stopWorkbenchDescription:
      "Opera las cargas de esta parada. Las demás paradas son solo lectura en el mapa.",
    /**
     * Sheet despacho (PD6): despacho ≠ salida de origen.
     * La elección de ubicación va en el body.
     */
    startDescription:
      "Despachar pone el viaje en ruta. La salida de origen es otro paso, después de las cargas.",
    /** PD6 — opción batch (intención explícita). */
    dispatchIntentAtDock: "Ya está en el andén de carga",
    dispatchIntentAtDockHint:
      "Registra despacho y llegada a origen en un solo paso. La salida sigue aparte.",
    /** PD6 — solo dispatch. */
    dispatchIntentEnRoute: "Va en camino al origen",
    dispatchIntentEnRouteHint:
      "Solo despacha. Después registra la llegada a origen.",
    /** Sugerencia default cuando origen≈sucursal. */
    dispatchIntentSuggested: "Sugerido",
    startMileagePlaceholder: "Ej: 150000",
    loadingVehicleMileage: "Cargando kilometraje…",
    /** Un solo hint operativo cuando hay sugerencia. */
    suggestedMileageHint: (km: string) => `Sugerido: ${km} km`,
    /**
     * Cierre de viaje: desglose km inicial + distancia planificada = final.
     * `fmt` ya viene con locale (p. ej. "3,200").
     */
    suggestedEndMileageHint: (args: {
      startKm: string;
      distanceKm: string;
      endKm: string;
    }) =>
      `Sugerido: ${args.startKm} km (inicial) + ${args.distanceKm} km (distancia planificada) = ${args.endKm} km (final)`,
    vehicleLabel: "Unidad",
    driverLabel: "Conductor",
    loadingResource: "Cargando…",
    resourceBlockedVehicle: (status: string) =>
      `La unidad no puede iniciar el viaje (${status}).`,
    resourceBlockedDriver: (status: string) =>
      `El conductor no puede iniciar el viaje (${status}).`,
    departOriginDescription:
      "Confirma la hora de salida del origen. El tránsito hacia el destino queda registrado.",
    civilTimeHint: "Hora de México",
    arrivalDescription: "Confirma la hora de llegada. La parada quedará en curso.",
    departureDescription:
      "Confirma la hora de salida. La parada quedará completada.",
    closeDescription:
      "Confirma hora y kilometraje final. El viaje quedará completado.",
    quickCloseDescription:
      "Completa el viaje sin registrar cada parada. Confirma hora y kilometraje final.",
    noteTitle: "Registrar nota",
    noteDescription: "Queda en el historial del viaje.",
    notePlaceholder: "Detalle operativo, instrucciones, contexto…",
    noteRegistered: "Nota registrada",
    noteFailed: "No se pudo registrar la nota",
    /** PD10 — preasociación a parada en curso. */
    willAssociateToStop: (parada: string) => `Se asociará a ${parada}`,
    incidentTitle: "Registrar incidente",
    incidentDescription:
      "Queda en el historial. Marca si requiere asistencia inmediata.",
    incidentSeverityPlaceholder: "Selecciona severidad",
    incidentPlaceholder: "Qué ocurrió, dónde y acciones tomadas…",
    incidentRegistered: "Incidente registrado",
    incidentFailed: "No se pudo registrar el incidente",
    /** Popup del mapa: última posición conocida de la unidad en este viaje. */
    lastKnownPosition: "Última posición reportada",
    mapFallbackLastKnown: "Última posición conocida",
    mapFallbackNoCoords: "Aún no hay eventos con coordenadas registradas.",
    mapFallbackStopsTitle: "Coordenadas por parada",
    mapFallbackNoStopCoords: "Sin paradas con coordenadas para trazar.",
    mapLegendStop: "Parada",
    mapLegendEvent: "Evento con GPS",
    mapLegendRoute: "Ruta planificada",
    mapLoading: "Cargando mapa",
    quickCloseWarningTitle: "Antes de confirmar",
    quickCloseWarningStops:
      "Paradas no visitadas: se registrará una hora de llegada estimada.",
    quickCloseWarningCargos:
      "Cargas no operadas: se marcarán como entregadas.",
    quickCloseFiscalAttention:
      "Hay atención fiscal pendiente. Puedes cerrar el viaje; sustituye la factura al cobrar el ajuste.",
    /** Soft-warn al finalizar/completar con incidente en bitácora (solo aviso; no bloquea). */
    closeOpenIncidentWarning:
      "Este viaje tiene un incidente en bitácora. Puedes cerrarlo con una nota en Seguimiento; al finalizar, la marca también se limpia. El incidente permanece en la bitácora.",
    closeIncidentTitle: "Cerrar incidente",
    closeIncidentDescription:
      "Apaga la marca de incidente abierto y deja una nota en la bitácora. El incidente registrado no se borra.",
    closeIncidentNotesLabel: "Nota de cierre",
    closeIncidentNotesPlaceholder:
      "Qué se hizo o por qué se cierra la marca del incidente…",
    closeIncidentNotesHint:
      "Obligatoria. Queda como nota en la bitácora; el incidente no se elimina.",
    closeIncidentNotesRequired: "Indica una nota de cierre.",
    closeIncidentNotesMax: "La nota no puede superar 1000 caracteres.",
    /** Soft guard al cerrar: Alert cuando km final === km de salida (oficina). */
    closeZeroKmTitle: "Kilometraje sin recorrido",
    closeZeroKmBody:
      "El km final es igual al de salida (0 km). Si la unidad se movió, captura el odómetro real; si no, la liquidación pagará solo el mínimo garantizado de la tarifa (o $0 si no tiene).",
    /** Soft guard al cerrar (conductor). */
    closeZeroKmTitleDriver: "Mismo kilometraje de salida",
    closeZeroKmBodyDriver:
      "Quedará sin kilómetros recorridos. Si la unidad sí se movió, corrige el km final antes de cerrar.",
    quickCloseOccurredAtLabel: "¿A qué hora terminó el viaje?",
    quickCloseNotesLabel: "Motivo (recomendado)",
    quickCloseNotesPlaceholder:
      "Ej. La unidad ya regresó; no se registró escala por escala.",
    quickCloseNotesHint: "Ayuda a auditar por qué se usó este cierre.",
    declareFalseTripTitle: "Declarar viaje en falso",
    declareFalseTripDescription:
      "El viaje queda completado y se puede facturar el desplazamiento.",
    /** Conductor: declara, no factura (D12). */
    declareFalseTripDescriptionDriver:
      "El viaje queda completado. Tu parte termina al declarar.",
    declareFalseTripCauseLabel: "¿Por qué se cancela la carga?",
    declareFalseTripCausePlaceholder:
      "Ej. El cliente canceló en sitio al llegar la unidad.",
    declareFalseTripCauseRequired:
      "Describe la causa (al menos 10 caracteres).",
    declareFalseTripEffectsTitle: "Al declarar",
    declareFalseTripEffectCompleted: "El viaje queda completado.",
    declareFalseTripEffectDestination:
      "El destino no visitado se omite. No se registra llegada a destino.",
    declareFalseTripEffectCargos:
      "Las cargas pendientes se cancelan. No hace falta cancelarlas antes.",
    declareFalseTripEffectInvoice:
      "Después puedes facturar el desplazamiento.",
    declareFalseTripExpensesTitle: "Conviene capturar los gastos ahora",
    declareFalseTripExpensesBody:
      "Tras cerrar aún puedes registrarlos unos días; si faltan casetas o combustible, hazlo ya desde Costos.",
    declareFalseTripExpensesCta: "Ir a Costos",
    /** Soft guard: hint permanente bajo km final (oficina). */
    declareFalseTripMileagePaymentHint:
      "Este kilometraje alimenta el pago por km en la liquidación. Si la unidad sí se movió, ajusta el km final al odómetro real.",
    /** Soft guard: hint permanente (conductor). */
    declareFalseTripMileagePaymentHintDriver:
      "Captura el odómetro al cerrar. Si la unidad sí se movió, no dejes el mismo kilometraje del inicio.",
    /** Soft guard: Alert cuando end === start (oficina). */
    declareFalseTripZeroKmTitle: "Kilometraje sin recorrido",
    declareFalseTripZeroKmBody:
      "El km final es igual al de salida (0 km). Si la unidad se movió, captura el odómetro real; si no, la liquidación pagará solo el mínimo garantizado de la tarifa (o $0 si no tiene).",
    /** Soft guard: Alert cuando end === start (conductor). */
    declareFalseTripZeroKmTitleDriver: "Mismo kilometraje de salida",
    declareFalseTripZeroKmBodyDriver:
      "Quedará registrado sin kilómetros recorridos. Si la unidad sí se movió, corrige el km final antes de declarar.",
    notesOptional: "Notas (opcional)",
    notesPlaceholder: "Observaciones operativas…",
    closeNotesPlaceholder: "Observaciones al finalizar…",
    loadingVehicle: "Cargando kilometraje…",
    locationOptional: "¿Dónde ocurrió? (opcional)",
    /** Variante quiet del sheet Iniciar: sin párrafo largo. */
    locationOptionalQuiet: "Ubicación (opcional)",
    locationHint:
      "Opcional. Puedes usar la ubicación del dispositivo o la de la parada.",
    useMyLocation: "Usar mi ubicación",
    useStopLocation: "Usar ubicación de la parada",
    clearLocation: "Quitar",
  },
  toast: {
    tripStarted: "Viaje despachado",
    tripStartedDescription: (tripCode: string) =>
      `${tripCode} listo para seguimiento`,
    tripDispatchedAtDock: "Despachado en origen",
    tripDispatchedAtDockDescription: (tripCode: string) =>
      `${tripCode}: despacho y llegada a origen registrados`,
    originDeparted: "Salida de origen registrada",
    originDepartFailed: "Error al registrar salida de origen",
    startFailed: "Error al despachar",
    startMileageRequired: "Kilometraje requerido",
    startMileageRequiredDescription:
      "Indica el kilometraje al despachar. Si hay sugerencia, puedes confirmarla o ajustarla.",
    arrivalRegistered: (stopLabel: string) =>
      `Llegada registrada · ${stopLabel}`,
    departureRegistered: (stopLabel: string) =>
      `Salida registrada · ${stopLabel}`,
    registerFailed: "No se pudo registrar",
    incidentClosed: "Incidente cerrado",
    incidentCloseFailed: "No se pudo cerrar el incidente",
    tripClosed: "Viaje finalizado",
    tripClosedDescription: (tripCode: string) =>
      `${tripCode} quedó completado`,
    tripCloseFailed: "No se pudo finalizar el viaje",
    quickCloseFailed: "No se pudo cerrar el viaje",
    falseTripDeclared: "Viaje en falso declarado",
    falseTripDeclaredDescription: (tripCode: string) =>
      `${tripCode} quedó completado. Se puede facturar el desplazamiento.`,
    falseTripDeclaredDescriptionDriver: (tripCode: string) =>
      `${tripCode} quedó completado.`,
    falseTripDeclareFailed: "No se pudo declarar el viaje en falso",
    endMileageRequired: "Kilometraje final requerido",
    endMileageRequiredDescription:
      "Indica el kilometraje al llegar. Si hay sugerencia, puedes confirmarla o ajustarla.",
    endMileageBelowStart: (km: string) =>
      `Debe ser mayor o igual al kilometraje al salir (${km} km).`,
    endMileageInvalid: "Kilometraje inválido",
  },
  validation: {
    departureRequired: "Indica la fecha y hora de despacho.",
    occurredAtRequired: "Indica la fecha y hora.",
    dispatchIntentRequired: "Indica si la unidad ya está en el andén o va en camino.",
    dispatchOriginStopRequired:
      "Falta la parada origen para registrar la llegada. Elige «Va en camino» o revisa la ruta.",
    arrivalAtDestinationRequired: "Indica la fecha y hora de llegada al destino.",
    quickCloseOccurredAtRequired:
      "Indica la fecha y hora de cierre del viaje.",
    closureBeforeDeparture: (
      floorLabel: string,
      when: string,
    ) => `La hora de cierre no puede ser anterior a ${floorLabel} (${when}).`,
    closureFloorActualDeparture: "la salida real del viaje",
    closureFloorScheduledDeparture: "la salida programada",
    civilTimeHint: "Hora de México",
  },
  state: {
    /** Polling de timeline; no implica GPS de unidad. PD4: «En vivo» (no «Al día»). */
    live: "En vivo",
    syncing: "Sincronizando…",
    readOnly: "Solo lectura",
    skippedNotVisited: "Omitido — no se visitó",
    noEvents: "Sin eventos operativos registrados.",
    timelineEmpty: "Todavía no hay eventos para este viaje.",
    loadError: "No se pudo cargar la información de seguimiento.",
    noStops: "Sin paradas en la ruta.",
    noEta: "Sin llegada estimada",
    locationSaved: "Ubicación guardada",
  },
  hint: {
    map: "Paradas y eventos de este viaje.",
    itinerary: "Progreso por parada con plan y hora real.",
    /** Riel: parada seleccionada que no es la operable. */
    railMapOnly:
      "Esta parada es solo consulta. Opera la parada en curso arriba.",
    /** PD12: mid-trip — deep-link a tab Ruta (sin tab nuevo). */
    midTripRouteChanges: "Cambios de ruta → tab Ruta",
    objectiveGuide: "La siguiente operación y el botón para registrarla.",
    readOnlyGuide:
      "Este viaje ya no admite operaciones de seguimiento. Consulta paradas, historial y mapa abajo.",
    idleGuide:
      "No hay una acción de parada pendiente. Puedes revisar cargas o registrar una nota o incidente si aplica.",
    evidenceAtStop:
      "La nota o incidente usará esta parada como referencia de ubicación cuando tenga coordenadas.",
    evidenceNow: "Nota o incidente del viaje.",
    distancePlanned: "Calculada desde las paradas del viaje.",
    distanceActual: "Distancia real proyectada por el seguimiento.",
    eta: "Basado en la programación del viaje.",
    stopsAndCargos: "Elige una parada para operar cargas o registrar evidencia.",
    selectStop: "Selecciona una parada de la lista.",
    mobileDetailSheet: "Parada",
    actionsScope: "Registra la operación de la parada siguiente.",
    nextStepFallback: "Sin acciones pendientes",
    /** Portal cliente: lectura de estado (D11). Sin Iniciar/Registrar/Completar/falso. */
    clientScheduledTitle: "Programado",
    clientScheduledBody: "Tu envío está programado. Aún no sale.",
    clientInProgressTitle: "En camino",
    clientInProgressBody: "Tu envío está en camino.",
    clientCompletedTitle: "Completado",
    clientCompletedBody: "Tu envío ya llegó.",
    clientCancelledTitle: "Cancelado",
    clientCancelledBody: "Este envío fue cancelado.",
    clientDraftTitle: "En preparación",
    clientDraftBody: "Este envío aún no está programado. Consulta a tu oficina.",
    /** Título Z3a (F5/F7): no «Estado operativo» genérico. */
    openIncidentTitle: "Incidente abierto",
    openIncident:
      "Hay un incidente en bitácora. Ciérralo con una nota o revísalo antes de finalizar el viaje.",
    /**
     * F7.6: cuerpo de la franja; usa detalle del último incidente en timeline
     * cuando existe (sin endpoint nuevo).
     */
    openIncidentSummary: (detail?: string | null) => {
      const trimmed = detail?.trim();
      return trimmed && trimmed.length > 0
        ? trimmed
        : "Hay un incidente en bitácora. Ciérralo con una nota o revísalo antes de finalizar el viaje.";
    },
    incidentLabel: "Incidente",
    /** Chip de proyección T5 en eventos incident cuando ya no hay marca abierta. */
    incidentClosedChip: "Cerrado",
    timelineHasEvents: "Registro de operaciones del viaje.",
    stopRoleOrigin: "Llegada, cargas y salida de origen",
    stopRoleWaypoint: "Llegada y salida",
    stopRoleDestination: "Llegada y cierre en destino",
    cargoBlockedTitle: (stopLabel: string) =>
      `Completa las cargas en ${stopLabel}`,
    cargoBlockedBody: (count: number) =>
      count === 1
        ? "1 carga pendiente en esta parada antes de continuar."
        : `${count} cargas pendientes en esta parada antes de continuar.`,
    /** Conductor / sin trips.update: operación registra la carga (D11). */
    cargoBlockedTitleDriver: (stopLabel: string) =>
      `Operación registra la carga en ${stopLabel}`,
    cargoBlockedBodyDriver:
      "Operación registra la carga. Avísales para continuar.",
    cargoActionRequiresArrival:
      "Registra la llegada a esta parada para operar las cargas.",
    cargoBlockedBeforeDeparture:
      "Completa las cargas de esta parada antes de registrar salida o cierre.",
    cargoBlockedBeforeDepartureDriver:
      "Operación registra las cargas. Avísales para continuar.",
    /** Iniciar bloqueado: copy de dominio + escala (D10). Sin asignar/Confirmar. */
    startBlockedEscalatePatio: "Avisa a operación.",
    /**
     * PD7: no re-llegar si app/office ya registró stop_arrived en origen.
     */
    dispatchOriginAlreadyArrived:
      "La llegada a origen ya está registrada (app u oficina). No se vuelve a enviar; solo se despacha.",
    legendHelp: "¿Qué significan los estados?",
    timelineLocationSaved: "Ubicación registrada",
    timelineCause: (cause: string) => `Causa: ${cause}`,
    timelineMileage: (km: string) => `Km final: ${km}`,
    timelineActor: (actor: string) => `Registró: ${actor}`,
    updatedAgo: (ago: string) => `Actualizado ${ago}`,
    quickCloseTransition:
      "Completa sin registrar cada parada. Las no visitadas se completan automáticamente.",
    /** T4-043: mutex false_trip vs split activo (API 409 SPLIT_INCOMPATIBLE_WITH_FALSE_TRIP). */
    declareFalseTripBlockedBySplit:
      "Cancela el prorrateo activo antes de declarar viaje en falso.",
  },
  format: {
    cargoWeight: (kg: number) => `${kg.toLocaleString("es-MX")} kg`,
    cargoUnits: (count: number) => `${count} uds`,
    cargoFacts: (
      kg: number | null | undefined,
      units: number | null | undefined,
    ) => {
      const parts: string[] = [];
      if (kg != null && Number.isFinite(kg)) {
        parts.push(`${kg.toLocaleString("es-MX")} kg`);
      }
      if (units != null && Number.isFinite(units)) {
        parts.push(`${units} uds`);
      }
      return parts.length > 0 ? parts.join(" · ") : null;
    },
  },
  error: {
    startRequiresScheduled: "Requiere estado Programado.",
    arriveRequiresInProgress: "Requiere viaje En Ruta y parada pendiente.",
    departRequiresEscala: "Requiere escala con llegada registrada.",
    closeRequiresDestination: "Requiere llegada en destino.",
    registerRequiresInProgress: "Requiere viaje En Ruta.",
  },
} as const;
