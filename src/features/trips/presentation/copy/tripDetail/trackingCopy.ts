/**
 * Namespace: trips.copy.tripDetail.tracking.*
 * Léxico operativo (handoff Capa 1 — tab Seguimiento).
 */
export const trackingCopy = {
  section: {
    status: "Estado operativo",
    actions: "Acciones de seguimiento",
    objective: "Qué sigue",
    metrics: "Avance del viaje",
    itinerary: "Itinerario operativo",
    stopsAndCargos: "Paradas y cargas",
    /** Detalle del hub tracking (léxico operativo; no «mercancía»). */
    cargosAtStop: "Cargas en esta parada",
    timeline: "Bitácora del viaje",
    map: "Mapa operativo",
  },
  action: {
    start: "Iniciar viaje",
    arrive: "Registrar llegada",
    depart: "Registrar salida",
    departOrigin: "Salida de origen",
    close: "Finalizar viaje",
    note: "Nota",
    incident: "Incidente",
    refresh: "Actualizar",
    cancel: "Cancelar",
    now: "Ahora",
    goToCargos: "Ver cargas de la parada",
    /** CTA footer del sheet de parada (corto, sin «Parada N · …»). */
    confirmArrival: "Registrar llegada",
    confirmDeparture: "Registrar salida",
  },
  label: {
    departureAt: "Fecha y hora de salida",
    startMileage: "Kilometraje al salir",
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
    overdue: "Va tarde",
    cargoCount: (count: number) =>
      count === 1 ? "1 carga" : `${count} cargas`,
    evidenceAtStop: "Nota o incidente",
    locationSaved: "Ubicación guardada",
    locationFromStop: "Ubicación de la parada",
    locationFromDevice: "Mi ubicación",
    occurredAtArrival: "¿A qué hora llegó?",
    occurredAtDeparture: "¿A qué hora salió?",
  },
  sheet: {
    /** Confirmación de arranque: una línea; sin itinerario futuro. */
    startDescription: "Confirma hora y kilometraje. El viaje pasará a «En curso».",
    startMileagePlaceholder: "Ej: 150000",
    loadingVehicleMileage: "Cargando kilometraje…",
    /** Un solo hint operativo cuando hay sugerencia. */
    suggestedMileageHint: (km: string) => `Sugerido: ${km} km`,
    vehicleLabel: "Unidad",
    driverLabel: "Conductor",
    loadingResource: "Cargando…",
    resourceBlockedVehicle: (status: string) =>
      `La unidad no puede iniciar el viaje (${status}).`,
    resourceBlockedDriver: (status: string) =>
      `El conductor no puede iniciar el viaje (${status}).`,
    departOriginDescription:
      "Confirma la hora de salida. El viaje quedará en tránsito.",
    civilTimeHint: "Hora local de México.",
    arrivalDescription: "Confirma la hora de llegada. La parada quedará en curso.",
    departureDescription:
      "Confirma la hora de salida. La parada quedará completada.",
    closeDescription:
      "Confirma hora y kilometraje final. El viaje quedará completado.",
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
    tripStarted: "Viaje iniciado",
    tripStartedDescription: (tripCode: string) => `${tripCode} está en curso`,
    originDeparted: "Salida de origen registrada",
    originDepartFailed: "Error al registrar salida de origen",
    startFailed: "Error al iniciar",
    startMileageRequired: "Kilometraje requerido",
    startMileageRequiredDescription:
      "Indica el kilometraje al salir. Si hay sugerencia, puedes confirmarla o ajustarla.",
    arrivalRegistered: (stopLabel: string) =>
      `Llegada registrada · ${stopLabel}`,
    departureRegistered: (stopLabel: string) =>
      `Salida registrada · ${stopLabel}`,
    registerFailed: "No se pudo registrar",
    tripClosed: "Viaje finalizado",
    tripClosedDescription: (tripCode: string) =>
      `${tripCode} quedó completado`,
    tripCloseFailed: "No se pudo finalizar el viaje",
    endMileageRequired: "Kilometraje final requerido",
    endMileageRequiredDescription:
      "Indica el kilometraje al llegar. Si hay sugerencia, puedes confirmarla o ajustarla.",
    endMileageBelowStart: (km: string) =>
      `Debe ser mayor o igual al kilometraje al salir (${km} km).`,
    endMileageInvalid: "Kilometraje inválido",
  },
  validation: {
    departureRequired: "Indica la fecha y hora de salida.",
    occurredAtRequired: "Indica la fecha y hora.",
    arrivalAtDestinationRequired: "Indica la fecha y hora de llegada al destino.",
    closureBeforeDeparture: (
      floorLabel: string,
      when: string,
    ) => `La hora de cierre no puede ser anterior a ${floorLabel} (${when}).`,
    closureFloorActualDeparture: "la salida real del viaje",
    closureFloorScheduledDeparture: "la salida programada",
    civilTimeHint: "Hora local de México.",
  },
  state: {
    live: "En vivo",
    syncing: "Sincronizando…",
    readOnly: "Solo lectura",
    noEvents: "Sin eventos",
    noStops: "Sin paradas en la ruta",
    noEta: "Sin llegada estimada",
    locationSaved: "Ubicación guardada",
  },
  hint: {
    map: "Ubicación de paradas y eventos con GPS.",
    itinerary: "Progreso por parada. «Qué sigue» indica dónde actuar.",
    objectiveGuide:
      "Resumen de la siguiente operación y el botón para registrarla.",
    readOnlyGuide:
      "Este viaje ya no admite operaciones de seguimiento. Consulta paradas, bitácora y mapa abajo.",
    idleGuide:
      "No hay una acción de parada pendiente. Puedes revisar cargas o registrar una nota o incidente si aplica.",
    evidenceAtStop:
      "La nota o incidente usará esta parada como referencia de ubicación cuando tenga coordenadas.",
    distancePlanned: "Calculada desde las paradas del viaje.",
    distanceActual: "Distancia real proyectada por el seguimiento.",
    eta: "Basado en la programación del viaje.",
    stopsAndCargos:
      "Elige una parada para operar cargas o registrar nota e incidente.",
    selectStop: "Selecciona una parada de la lista.",
    mobileDetailSheet: "Parada",
    actionsScope:
      "Registra operaciones y evidencia. La parada siguiente se marca en el itinerario.",
    nextStepFallback: "Sin acciones pendientes",
    openIncident: "Hay un incidente abierto. Revisa la bitácora antes de cerrar.",
    cargoBlockedTitle: (stopLabel: string) =>
      `Completa las cargas en ${stopLabel}`,
    cargoBlockedBody: (count: number) =>
      count === 1
        ? "1 carga pendiente en esta parada antes de continuar."
        : `${count} cargas pendientes en esta parada antes de continuar.`,
    cargoActionRequiresArrival:
      "Registra la llegada a esta parada para operar las cargas.",
    cargoBlockedBeforeDeparture:
      "Completa las cargas de esta parada antes de registrar salida o cierre.",
    legendHelp: "¿Qué significan los estados?",
    timelineLocationSaved: "Ubicación registrada",
  },
  error: {
    startRequiresScheduled: "Requiere estado programado.",
    arriveRequiresInProgress: "Requiere viaje en curso y parada pendiente.",
    departRequiresEscala: "Requiere escala con llegada registrada.",
    closeRequiresDestination: "Requiere llegada en destino.",
    registerRequiresInProgress: "Requiere viaje en curso.",
  },
} as const;
