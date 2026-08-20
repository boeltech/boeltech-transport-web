/**
 * Namespace: trips.copy.tripDetail.route.*
 * Léxico operativo (Capa 1 D3) — sin SAT/RFC/remitente/Mapbox en superficie.
 */
export const routeCopy = {
  section: {
    stops: "Paradas del recorrido",
    origin: "Origen",
    waypoints: "Escalas",
    destination: "Destino",
  },
  hint: {
    stops: "Origen, escalas y destino. El avance en ruta se opera en Seguimiento.",
    origin: "Punto de salida del viaje.",
    waypoints: "Paradas intermedias con carga o descarga.",
    destination: "Punto final del recorrido.",
    pendingAddress: "Falta el domicilio. Usa Completar domicilio.",
    captureHint: "Elige una dirección guardada. El domicilio se completa después.",
    captureHintOrigin:
      "Cliente, sucursal o directorio de la empresa. El domicilio se completa después.",
    captureHintStop:
      "Cliente o directorio de la empresa. El domicilio se completa después.",
    selectRow: "Selecciona origen, una escala o destino.",
    sheetDescriptionComplete:
      "Domicilio, mapa y contacto. La secuencia de la ruta no cambia.",
    sheetDescriptionEdit:
      "Cambia domicilio, contacto u operación. La secuencia de la ruta no cambia.",
    sheetDescriptionOrigin:
      "Datos del origen. La salida programada del viaje se edita en el tab Operación.",
    sheetDescriptionDestination:
      "Llegada estimada (sincronizada con Operación) y domicilio del destino.",
    sheetDescriptionWaypoint:
      "Llegada y salida estimadas y domicilio de la escala.",
    sheetOriginDeparture:
      "En origen no aplica hora de llegada. La salida programada se configura en el tab Operación; al iniciar el viaje, Seguimiento registra la salida real de esta parada.",
    deliveryParty:
      "Úsalo cuando quien recibe la mercancía en esta parada no sea el mismo que el del domicilio.",
    deliveryName:
      "Nombre o razón social de quien recibe físicamente la entrega, cuando difiere del nombre del domicilio.",
  },
  alert: {
    missingAddressTitle: "Falta domicilio",
    missingAddressBody: (count: number) =>
      count === 1
        ? "1 parada sin domicilio. Usa Completar domicilio."
        : `${count} paradas sin domicilio. Usa Completar domicilio.`,
    missingDistanceTitle: "Faltan distancias",
    missingDistanceBody: (count: number) =>
      count === 1
        ? "Falta la distancia desde la parada anterior. Calcúlala para poder facturar."
        : `Faltan ${count} distancias entre paradas. Calcúlalas para poder facturar.`,
    missingDistanceNeedsCoordsBody:
      "Faltan coordenadas en una o más paradas. Completa el domicilio con mapa para calcular la distancia.",
    captureTitle: "Revisa la ruta",
    stopNotFoundTitle: "Parada no encontrada",
    stopNotFoundBody: "No se pudo cargar la parada seleccionada.",
    stopSaveFailedTitle: "No se pudo guardar",
    stopValidationSummary: "Revisa los datos de la parada.",
    stopDepartureTitle: "Salida del viaje",
  },
  action: {
    openFullEdit: "Abrir edición completa",
    replanRoute: "Replanificar ruta en edición completa",
    addStop: "Agregar parada",
    addWaypoint: "Agregar escala",
    editStop: "Editar parada",
    completeAddress: "Completar domicilio",
    calculateDistances: "Calcular distancias",
    saveChanges: "Guardar cambios",
    cancel: "Cancelar",
  },
  chip: {
    missingAddress: "Sin domicilio",
  },
  composer: {
    title: "Elige origen y destino",
    description:
      "Elige origen y destino. El domicilio se completa después.",
    originSlot: "Origen",
    destinationSlot: "Destino",
    waypointSlot: "Escala",
    pickerLabel: "Dirección guardada",
    selectedStop: "En la ruta",
    cityHint: (city: string) => `Sugerencia: ${city}`,
    emptySlot: "Sin domicilio",
    labelHatchToggle: "No está en el catálogo",
    labelPlaceholder: "Nombre del lugar (opcional)",
    labelHint: "Escribe un nombre y usa Completar domicilio.",
    corridorTitle: "Corredor frecuente",
    pendingOriginSaved:
      "Origen listo. Elige el destino para guardar la ruta.",
    pendingDestinationSaved:
      "Destino listo. Elige el origen para guardar la ruta.",
    needBothEnds:
      "Hace falta origen y destino antes de agregar escalas o guardar.",
    duplicateEndpointAddress:
      "Origen y destino no pueden usar la misma dirección.",
  },
  label: {
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
    distanceMap: "Mapa",
    distanceEstimated: "Estimado",
    distanceFallback: "Distancia",
    addressPending: "Sin domicilio",
    estimatedArrivalDestination: "Llegada estimada",
    estimatedArrivalWaypoint: "Llegada estimada",
    estimatedDepartureWaypoint: "Salida estimada",
    distanceFromPreviousKm: "Kilómetros desde la parada anterior",
    partyId: "Identificación de quien entrega o recibe",
    partyName: "Nombre de quien entrega o recibe",
    deliveryIdOptional: "Identificación de entrega (opcional)",
    deliveryNameOptional: "Nombre de entrega (opcional)",
  },
  state: {
    emptyTitle: "Sin paradas en la ruta",
    emptyDescription:
      "Arma origen y destino en esta pantalla. El domicilio puede ir después.",
    noOrigin: "Sin parada de origen definida.",
    noDestination: "Sin parada de destino definida.",
    readOnlyEmpty: "Este viaje aún no tiene paradas en la ruta.",
    missingDistance: "Falta distancia desde la parada anterior.",
  },
  toast: {
    stopUpdated: "Parada actualizada",
    stopsSaved: "Paradas actualizadas",
    stopSaveError: "No se pudo guardar la parada",
  },
  format: {
    stopCount: (count: number) =>
      `${count} ${count === 1 ? "parada" : "paradas"}`,
    stopOrderHash: (order: number) => `#${order}`,
    distanceKm: (kmFormatted: string) => `${kmFormatted} km`,
    completeAddressTitle: (displayOrder: number) =>
      `Completar domicilio · parada ${displayOrder}`,
    editStopTitle: (displayOrder: number) => `Editar parada ${displayOrder}`,
    stopFallbackName: (displayOrder: number) => `Parada ${displayOrder}`,
    stopOrderInRoute: (displayOrder: number) =>
      `Orden ${displayOrder} en la ruta`,
  },
} as const;
