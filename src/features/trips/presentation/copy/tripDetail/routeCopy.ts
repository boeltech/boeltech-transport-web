/**
 * Namespace: trips.copy.tripDetail.route.*
 */
export const routeCopy = {
  section: {
    summary: "Resumen de ruta",
    stops: "Paradas del recorrido",
    origin: "Origen",
    waypoints: "Escalas",
    destination: "Destino",
  },
  hint: {
    stops: "Origen, escalas y destino. Operación en ruta desde Seguimiento.",
    origin: "Punto de salida del viaje.",
    waypoints: "Paradas intermedias con operaciones de carga o descarga.",
    destination: "Punto final del recorrido.",
    summaryFallback: "Origen y destino según paradas del viaje.",
    quickEditDistance:
      "Capture distancias entre tramos en edición completa del viaje.",
    pendingAddress:
      "Domicilio incompleto en esta parada. Complételo en edición o con la corrección de domicilio.",
    sheetDescriptionOrigin:
      "Datos del origen. La salida programada del viaje se edita en el tab Operación.",
    sheetDescriptionDestination:
      "Llegada estimada (sincronizada con Operación), distancia y domicilio del destino.",
    sheetDescriptionWaypoint:
      "Llegada y salida estimadas, distancia y domicilio de la escala.",
    sheetOriginDeparture:
      "En origen no aplica hora de llegada. La salida programada se configura en el tab Operación; al iniciar el viaje, Seguimiento registra la salida real de esta parada.",
    deliveryParty:
      "Úselo cuando quien recibe la mercancía en esta parada no sea el mismo que el destinatario del domicilio.",
    deliveryName:
      "Nombre o razón social de quien recibe físicamente la entrega, cuando difiere del nombre del domicilio.",
  },
  alert: {
    incompleteRoute: "Ruta incompleta",
    missingOrigin: "Falta la parada de origen en la secuencia del viaje.",
    missingDestination: "Falta la parada de destino en la secuencia del viaje.",
    missingAddressTitle: "Domicilios incompletos",
    missingAddressBody: (count: number) =>
      `${count} parada(s) con domicilio incompleto. Complételos en edición completa antes de facturar.`,
    segmentDistanceTitle: "Distancias entre tramos",
    missingSegmentBody: (count: number) =>
      `${count} tramo(s) sin distancia registrada desde la parada anterior.`,
    stopNotFoundTitle: "Parada no encontrada",
    stopNotFoundBody: "No se pudo cargar la parada seleccionada.",
    stopSaveFailedTitle: "No se pudo guardar",
    stopValidationSummary: "Revise los datos de la parada.",
    stopDepartureTitle: "Salida del viaje",
  },
  action: {
    openFullEdit: "Abrir edición completa",
    replanRoute: "Replanificar ruta en edición completa",
    saveChanges: "Guardar cambios",
    cancel: "Cancelar",
  },
  label: {
    segmentDistance: "Distancia tramos",
    pickups: "Cargas",
    deliveries: "Descargas",
    waypoints: "Escalas",
    distanceFallback: "Distancia",
    notePrefix: "Nota:",
    contactPrefix: "Contacto:",
    savedAddress: "Domicilio guardado",
    manageInTracking: "Gestionar en Seguimiento",
    actualDeparture: "Salida real",
    scheduledDeparture: "Salida programada",
    scheduledDepartureTrip: "Salida programada",
    actualArrival: "Llegada real",
    estimatedArrival: "Llegada estimada",
    estimatedDeparture: "Salida estimada",
    distanceManual: "Manual",
    distanceMapbox: "Mapa",
    distanceEstimated: "Estimado",
    addressOk: "Domicilio completo",
    addressInvalid: "Domicilio inválido",
    addressPending: "Domicilio incompleto",
    estimatedArrivalDestination: "Llegada estimada",
    estimatedArrivalWaypoint: "Llegada estimada",
    estimatedDepartureWaypoint: "Salida estimada",
    distanceFromPreviousKm: "Distancia desde parada anterior (km)",
    partyId: "Identificación remitente/destinatario",
    partyName: "Nombre remitente/destinatario",
    deliveryIdOptional: "Identificación de entrega (opcional)",
    deliveryNameOptional: "Nombre de entrega (opcional)",
  },
  state: {
    emptyTitle: "Sin paradas en la ruta",
    emptyDescription: "No hay paradas registradas para este viaje.",
    noOrigin: "Sin parada de origen definida.",
    noDestination: "Sin parada de destino definida.",
  },
  toast: {
    stopUpdated: "Parada actualizada",
    stopSaveError: "No se pudo guardar la parada",
  },
  format: {
    stopCount: (count: number) =>
      `${count} ${count === 1 ? "parada" : "paradas"}`,
    stopOrderHash: (order: number) => `#${order}`,
    distanceSegment: (sourceLabel: string, kmFormatted: string) =>
      `${sourceLabel} · ${kmFormatted} km`,
    editStopTitle: (displayOrder: number) => `Editar parada ${displayOrder}`,
    stopFallbackName: (displayOrder: number) => `Parada ${displayOrder}`,
    stopOrderInRoute: (displayOrder: number) =>
      `Orden ${displayOrder} en la ruta`,
  },
} as const;
