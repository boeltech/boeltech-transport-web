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
    stopsMidTrip:
      "Ruta en curso. Puedes modificar, agregar o quitar paradas pendientes. Para ampliar al final, cambia el destino. Origen y paradas ya operadas no se modifican.",
    midTripComposer:
      "Paradas pendientes editables. Origen y paradas ya operadas quedan bloqueadas.",
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
    /** @deprecated E1 — path mid-trip = composer pending-only, no append sheet. */
    sheetDescriptionAppend:
      "La nueva parada queda al final del recorrido. No se reordenan ni eliminan paradas existentes.",
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
    noDestinationTitle: "Falta el destino",
    noDestinationBody:
      "Agrega un destino pendiente para completar la ruta en curso.",
    routeChangedExternally:
      "La ruta cambió mientras confirmabas. Intenta de nuevo.",
  },
  action: {
    openFullEdit: "Abrir edición completa",
    addStop: "Agregar parada",
    /** @deprecated E1 — no es path de producto mid-trip. */
    appendStopAtEnd: "Agregar parada al final",
    expandRoute: "Ampliar ruta",
    replanRoute: "Replanificar ruta en edición completa",
    addWaypoint: "Agregar escala",
    editStop: "Editar parada",
    completeAddress: "Completar domicilio",
    calculateDistances: "Calcular distancias",
    saveChanges: "Guardar cambios",
    cancel: "Cancelar",
    removeWaypoint: "Eliminar escala",
    removeDraftWaypoint: "Quitar escala",
    confirmRemoveWaypoint: "Eliminar",
    keepWaypoint: "Conservar",
    reorderUp: "Subir escala",
    reorderDown: "Bajar escala",
    goToCargoTab: "Ir a Cargas",
    confirmFiscalReplan: "Confirmar",
  },
  confirm: {
    removeWaypointTitle: "¿Eliminar esta escala?",
    removeWaypointBody:
      "La escala saldrá de la ruta. Origen y destino no cambian.",
    removeWaypointBlockedTitle: "No se puede eliminar esta escala",
    removeWaypointBlockedBody:
      "Hay cargas ligadas a esta parada. Reasigna o elimina esas cargas en el tab Cargas y vuelve a intentar.",
    replanFiscalTitle: "¿Confirmar cambio de ruta?",
    replanFiscalBody:
      "Se marcará Atención fiscal. La operación puede continuar; sustituye la factura después.",
  },
  chip: {
    missingAddress: "Sin domicilio",
    missingOperation: "Sin operación",
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
    lockedStop: "Bloqueada",
    labelHatchToggle: "No está en el catálogo",
    labelPlaceholder: "Nombre del lugar (opcional)",
    labelHint: "Escribe un nombre y usa Completar domicilio.",
    corridorTitle: "Corredor frecuente",
    pendingOriginSaved:
      "Origen listo. Elige el destino para guardar la ruta.",
    pendingDestinationSaved:
      "Destino listo. Elige el origen para guardar la ruta.",
    pendingOriginIncomplete:
      "Origen capturado. Completa el domicilio para poder guardar la ruta.",
    pendingDestinationIncomplete:
      "Destino capturado. Completa el domicilio para poder guardar la ruta.",
    needCompleteAddressToSave:
      "Completa el domicilio de origen y destino para guardar la ruta.",
    needBothEnds:
      "Hace falta origen y destino antes de agregar escalas o guardar.",
    duplicateEndpointAddress:
      "Origen y destino no pueden usar la misma dirección.",
    waypointOperationQuestion: "¿Qué se hace aquí?",
    waypointOperationPickup: "Cargar",
    waypointOperationDelivery: "Entregar",
    waypointOperationConfirm: "Agregar escala",
    waypointOperationRequired: "Elige cargar, entregar o ambas.",
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
    emptyMidTripTitle: "Sin paradas en la ruta",
    emptyMidTripDescription:
      "Arma origen y destino pendientes en esta pantalla. No hay corredor frecuente mid-trip.",
    noOrigin: "Sin parada de origen definida.",
    noDestination: "Sin parada de destino definida.",
    readOnlyEmpty: "Este viaje aún no tiene paradas en la ruta.",
    missingDistance: "Falta distancia desde la parada anterior.",
  },
  toast: {
    stopUpdated: "Parada actualizada",
    stopsSaved: "Ruta actualizada",
    /** @deprecated E1 */
    stopAppended: "Parada agregada al final",
    stopSaveError: "No se pudo guardar la parada",
    waypointRemoved: "Escala eliminada",
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
