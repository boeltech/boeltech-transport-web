/**
 * Namespace: trips.copy.tripDetail.route.*
 */
export const routeCopy = {
  section: {
    scope: "Alcance de Ruta",
    summary: "Resumen de ruta",
    stops: "Paradas del recorrido",
    origin: "Origen",
    waypoints: "Escalas",
    destination: "Destino",
  },
  hint: {
    stops:
      "Origen, escalas y destino en el mismo orden que el wizard. Operación en ruta desde Seguimiento.",
    origin: "Punto de salida del viaje.",
    waypoints: "Paradas intermedias con operaciones de carga o descarga.",
    destination: "Punto final del recorrido.",
    summaryFallback: "Origen y destino según paradas del viaje.",
    scopeEditable:
      "Consulta la ruta y su progreso. Reordenar o reconfigurar paradas en edición completa.",
    scopeEditableFields:
      "RFC y distancias por parada. Llegada estimada en destino y escalas; salida del origen en Operación. Tiempos reales en Seguimiento.",
    scopeReadOnly:
      "Ruta en solo lectura. Modificaciones estructurales solo en borrador o programado.",
    quickEditDistance:
      "Use «Edición rápida» en cada parada para capturar distancias sin abrir el wizard.",
    originDeparture:
      "La salida programada del viaje se edita en Operación; al iniciar el viaje se registra la salida real en Seguimiento.",
    waypointTimes:
      "Llegada y salida estimadas de la escala; al operar el viaje, Seguimiento registra los tiempos reales.",
    pendingRfc: "RFC remitente/destinatario pendiente para esta parada.",
    sheetDescriptionOrigin:
      "Datos fiscales del origen. La salida programada del viaje se edita en el tab Operación.",
    sheetDescriptionDestination:
      "Llegada estimada (sincronizada con Operación), distancia y datos fiscales del destino.",
    sheetDescriptionWaypoint:
      "Llegada y salida estimadas, distancia y datos fiscales de la escala.",
    sheetOriginDeparture:
      "En origen no aplica hora de llegada. La salida programada se configura en el tab Operación; al iniciar el viaje, Seguimiento registra la salida real de esta parada.",
    deliveryRfc:
      "Úselo cuando quien recibe la mercancía en esta parada no sea el mismo que el destinatario fiscal de «RFC remitente/destinatario».",
    deliveryName:
      "Nombre o razón social de quien recibe físicamente la entrega, cuando difiere del «Nombre remitente/destinatario».",
  },
  alert: {
    incompleteRoute: "Ruta incompleta",
    missingOrigin: "Falta la parada de origen en la secuencia del viaje.",
    missingDestination: "Falta la parada de destino en la secuencia del viaje.",
    missingRfcTitle: "Datos fiscales pendientes",
    missingRfcBody: (count: number) =>
      `${count} parada(s) sin RFC remitente/destinatario. Use «Edición rápida» o edición completa antes de facturar.`,
    segmentDistanceTitle: "Distancias entre tramos",
    missingSegmentBody: (count: number) =>
      `${count} tramo(s) sin distancia registrada desde la parada anterior.`,
    stopNotFoundTitle: "Parada no encontrada",
    stopNotFoundBody: "No se pudo cargar la parada seleccionada.",
    stopSaveFailedTitle: "No se pudo guardar",
    stopValidationSummary: "Revise los datos operativos y fiscales de la parada.",
    stopDepartureTitle: "Salida del viaje",
  },
  action: {
    openFullEdit: "Abrir edición completa",
    replanRoute: "Replanificar ruta en edición completa",
    quickEdit: "Edición rápida",
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
    savedAddress: "Domicilio guardado",
    manageInTracking: "Gestionar en Seguimiento",
    actualDeparture: "Salida real",
    scheduledDeparture: "Salida programada",
    scheduledDepartureTrip: "Salida programada (viaje)",
    actualArrival: "Llegada real",
    estimatedArrival: "Llegada estimada",
    estimatedDeparture: "Salida estimada",
    distanceManual: "Manual",
    distanceMapbox: "Mapbox",
    distanceEstimated: "Estimado",
    fiscalOk: "Fiscal OK",
    fiscalInvalid: "RFC inválido",
    fiscalPending: "RFC pendiente",
    estimatedArrivalDestination: "Llegada estimada al destino",
    estimatedArrivalWaypoint: "Llegada estimada en escala",
    estimatedDepartureWaypoint: "Salida estimada de escala",
    distanceFromPreviousKm: "Distancia desde parada anterior (km)",
    rfcRemitenteDestinatario: "RFC remitente/destinatario",
    nombreRemitenteDestinatario: "Nombre remitente/destinatario",
    deliveryRfcOptional: "RFC de entrega (opcional)",
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
