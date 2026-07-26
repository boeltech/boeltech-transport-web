/**
 * Namespace: trips.copy.tripDetail.tracking.*
 * Migrado desde trip-tracking/trackingCopy.ts (patrón ACC).
 */
export const trackingCopy = {
  section: {
    status: "Estado operativo",
    actions: "Acciones de seguimiento",
    objective: "Objetivo actual",
    evidence: "Evidencia del viaje",
    metrics: "Métricas del viaje",
    itinerary: "Itinerario operativo",
    stopsAndCargos: "Paradas y cargas",
    timeline: "Timeline operativo",
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
    goToCargos: "Ir a cargas de la parada",
  },
  label: {
    departureAt: "Fecha y hora de salida",
    startMileage: "Kilometraje inicial",
    currentTarget: "Objetivo actual",
    distancePlanned: "Dist. planificada",
    distanceActual: "Dist. real",
    eta: "ETA",
    cargoCount: (count: number) =>
      count === 1 ? "1 carga" : `${count} cargas`,
    evidenceAtStop: "Evidencia en esta parada",
  },
  sheet: {
    startDescription:
      "Despacha la unidad: registra hora, odómetro inicial y, si aplica, ubicación. El viaje pasa a «En curso»; la salida fiscal de origen se registra después.",
    startHintLabel: "Iniciar viaje (dispatch)",
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
      "Registra la salida fiscal de la parada origen (inicia tránsito para CP31 y cliente).",
    departOriginHintLabel: "Salida de origen",
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
  },
  validation: {
    departureRequired: "Indica la fecha y hora de salida.",
    civilTimeHint: "Hora civil México.",
  },
  state: {
    live: "En vivo",
    syncing: "Sincronizando…",
    readOnly: "Solo lectura",
    noEvents: "Sin eventos",
    noStops: "Sin paradas en la ruta",
    noEta: "Sin ETA",
  },
  hint: {
    scope: "Seguimiento registra eventos y evidencias operativas.",
    map: "Ubicación de paradas y eventos con GPS.",
    itinerary: "Progreso por parada. «Objetivo actual» indica dónde actuar.",
    objectiveGuide:
      "Resumen de la siguiente operación. Las acciones de parada y carga se ejecutan en Paradas y cargas.",
    readOnlyGuide:
      "Este viaje ya no admite operaciones de seguimiento. Consulta paradas, timeline y mapa abajo.",
    idleGuide:
      "No hay una acción de parada pendiente. Puedes revisar cargas o registrar evidencia si aplica.",
    executeInStopsAndCargos:
      "Ejecuta esta acción en la sección Paradas y cargas.",
    evidenceAtStop:
      "La nota o incidente usará esta parada como referencia de ubicación cuando tenga coordenadas.",
    distancePlanned: "Calculada desde las paradas del viaje.",
    distanceActual: "Distancia real proyectada por el seguimiento.",
    eta: "Basado en la programación del viaje.",
    stopsAndCargos:
      "Selecciona una parada para ver acciones operativas y cargas vinculadas.",
    selectStop: "Selecciona una parada de la lista para operar.",
    mobileDetailSheet: "Detalle de parada",
    actionsScope:
      "Registra operaciones y evidencia. La parada objetivo se marca en el itinerario.",
    nextStepFallback: "Sin acciones pendientes",
    openIncident: "Hay un incidente abierto. Revisa el timeline antes de cerrar.",
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
  },
  error: {
    startRequiresScheduled: "Requiere estado programado.",
    arriveRequiresInProgress: "Requiere viaje en curso y parada pendiente.",
    departRequiresEscala: "Requiere escala con llegada registrada.",
    closeRequiresDestination: "Requiere llegada en destino.",
    registerRequiresInProgress: "Requiere viaje en curso.",
  },
} as const;
