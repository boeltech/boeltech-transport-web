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
  },
  label: {
    departureAt: "Fecha y hora de salida",
    startMileage: "Kilometraje inicial",
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
    evidenceAtStop: "Registrar nota o incidente",
    locationSaved: "Ubicación guardada",
    locationFromStop: "Ubicación de la parada",
    locationFromDevice: "Mi ubicación",
    occurredAtArrival: "¿A qué hora llegó?",
    occurredAtDeparture: "¿A qué hora salió?",
  },
  sheet: {
    startDescription:
      "Despacha la unidad: registra hora, odómetro inicial y, si aplica, ubicación. El viaje pasa a «En curso»; la salida de origen se registra después.",
    startHintLabel: "Iniciar viaje",
    startHint: (tripCode: string) =>
      `El viaje ${tripCode} pasará a «En curso» al despachar. Registra el kilometraje del odómetro al arrancar; después podrás marcar llegada a origen, carga y salida de origen.`,
    startMileagePlaceholder: "Ej: 150000",
    loadingVehicleMileage: "Cargando kilometraje del vehículo…",
    vehicleMileageHint: (km: string) =>
      `Kilometraje actual del vehículo: ${km} km`,
    tripMileageHint: (km: string) =>
      `Kilometraje programado en el viaje: ${km} km`,
    resourcesTitle: "Recursos asignados",
    vehicleLabel: "Unidad:",
    driverLabel: "Conductor:",
    loadingResource: "Cargando…",
    resourcesHint:
      "El vehículo y el conductor deben estar disponibles o reservados para despachar este viaje.",
    resourceBlockedVehicle: (status: string) =>
      `El vehículo no puede despacharse (estado: ${status}).`,
    resourceBlockedDriver: (status: string) =>
      `El conductor no puede despacharse (estado: ${status}).`,
    departOriginDescription:
      "Registra la salida de la parada origen para iniciar el tránsito.",
    departOriginHintLabel: "Salida de origen",
    civilTimeHint: "Hora local de México.",
    arrivalDescription:
      "Registra la llegada a la parada con la fecha y hora en que ocurrió.",
    departureDescription:
      "Registra la salida de la escala con la fecha y hora en que ocurrió.",
    notesOptional: "Notas (opcional)",
    notesPlaceholder: "Observaciones operativas…",
    locationOptional: "¿Dónde ocurrió? (opcional)",
    locationHint:
      "Opcional. Puedes usar la ubicación del dispositivo o la de la parada.",
    useMyLocation: "Usar mi ubicación",
    useStopLocation: "Usar ubicación de la parada",
    clearLocation: "Quitar",
  },
  toast: {
    tripStarted: "Viaje despachado",
    tripStartedDescription: (tripCode: string) => `${tripCode} está en curso`,
    originDeparted: "Salida de origen registrada",
    originDepartFailed: "Error al registrar salida de origen",
    startFailed: "Error al iniciar",
    startMileageRequired: "Kilometraje requerido",
    startMileageRequiredDescription:
      "Ingresa el odómetro al iniciar el viaje. Se sugiere el kilometraje actual del vehículo cuando está disponible.",
    arrivalRegistered: (stopLabel: string) =>
      `Llegada registrada · ${stopLabel}`,
    departureRegistered: (stopLabel: string) =>
      `Salida registrada · ${stopLabel}`,
    registerFailed: "No se pudo registrar",
  },
  validation: {
    departureRequired: "Indica la fecha y hora de salida.",
    occurredAtRequired: "Indica la fecha y hora.",
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
      "Selecciona una parada para ver cargas y registrar nota o incidente.",
    selectStop: "Selecciona una parada de la lista.",
    mobileDetailSheet: "Detalle de parada",
    actionsScope:
      "Registra operaciones y evidencia. La parada siguiente se marca en el itinerario.",
    nextStepFallback: "Sin acciones pendientes",
    openIncident: "Hay un incidente abierto. Revisa la bitácora antes de cerrar.",
    cargoBlockedTitle: (stopLabel: string) =>
      `Completa las cargas en ${stopLabel}`,
    cargoBlockedBody: (count: number) =>
      count === 1
        ? "1 mercancía pendiente de operar en esta parada antes de continuar."
        : `${count} mercancías pendientes de operar en esta parada antes de continuar.`,
    cargoActionRequiresArrival:
      "Registra la llegada a esta parada para operar las mercancías.",
    cargoBlockedBeforeDeparture:
      "Completa las acciones de carga en esta parada antes de registrar salida o cierre.",
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
