/**
 * Namespace: trips.copy.wizard.route.*
 */
export const routeCopy = {
  label: {
    country: "país",
    state: "estado",
    municipality: "municipio",
    postalCode: "código postal",
    geolocation: "ubicación en el mapa",
    distanceFromPrevious: "kilómetros desde la parada anterior",
    estimatedArrival: "hora estimada de llegada",
    noAddress: "Sin dirección especificada",
    segmentKm: "km",
  },
  format: {
    stopFallback: (index: number) => `Parada ${index + 1}`,
    stopHash: (index: number) => `Parada #${index + 1}`,
    stopCompleteMissing: (stopLabel: string, missing: string) =>
      `${stopLabel}: completa ${missing}`,
    stopMissingGeolocation: (stopLabel: string) =>
      `${stopLabel}: falta ubicar en el mapa`,
    stopMissingDistance: (stopLabel: string) =>
      `${stopLabel}: faltan kilómetros desde la parada anterior`,
    previousStopLabel: (index: number) => `Parada #${index + 1}`,
    completeStop: (label: string, missingJoined: string) =>
      `Completar ${label} (${missingJoined})`,
    statusSummary: (parts: {
      origin: "listo" | "pendiente" | "vacío";
      waypoints: number;
      destination: "listo" | "pendiente" | "vacío";
    }) => {
      const originLabel =
        parts.origin === "listo"
          ? "Origen listo"
          : parts.origin === "pendiente"
            ? "Origen pendiente"
            : "Sin origen";
      const destLabel =
        parts.destination === "listo"
          ? "Destino listo"
          : parts.destination === "pendiente"
            ? "Destino pendiente"
            : "Sin destino";
      const waypointsLabel =
        parts.waypoints === 0
          ? "Sin escalas"
          : parts.waypoints === 1
            ? "1 escala"
            : `${parts.waypoints} escalas`;
      return `${originLabel} · ${waypointsLabel} · ${destLabel}`;
    },
    missingCount: (count: number) =>
      count === 1 ? "Falta 1 dato para dejarla lista" : `Faltan ${count} datos para dejarla lista`,
    allReady: "Lista para guardar",
  },
  toast: {
    insufficientCoordinatesTitle: "Sin ubicación suficiente",
    insufficientCoordinatesBody:
      "Ubica todas las paradas en el mapa para calcular kilómetros entre ellas.",
    partialDistanceTitle: "Kilómetros parciales",
    partialDistanceBody:
      "Algunos tramos no tienen ubicación en ambas paradas; solo se actualizaron los tramos completos.",
    distanceErrorTitle: "Error al calcular kilómetros",
    distanceErrorBody: "No se pudieron actualizar los tramos. Intenta de nuevo.",
    distanceAbortedManualTitle: "Kilómetros no aplicados",
    distanceAbortedManualBody:
      "Hay valores manuales nuevos en la ruta. Confirma recalcular si quieres reemplazarlos.",
  },
  action: {
    addOrigin: "Agregar origen",
    addDestination: "Agregar destino",
    evaluateWaypoints: "Evaluar si requiere escalas",
    routeReady: "Ruta lista. Ya puedes avanzar a Cargas.",
    calculateSegment: "Calcular",
    edit: "Editar",
    complete: "Completar",
  },
  section: {
    origin: "Origen",
    waypoints: "Escalas",
    destination: "Destino",
  },
  state: {
    ready: "Listo",
    pending: "Pendiente",
    pendingCount: (count: number) =>
      count === 1 ? "1 parada pendiente" : `${count} paradas pendientes`,
    allComplete: "Todo listo",
    noOriginTitle: "Sin punto de carga",
    noOriginHint: "Agrega dónde se recoge la mercancía",
    noWaypointsTitle: "Sin escalas intermedias",
    noWaypointsHint:
      "Las escalas son opcionales. Agrégalas si hay carga o entrega en el camino",
    noDestinationTitle: "Sin punto de entrega",
    noDestinationHint: "Agrega dónde se entrega la mercancía",
  },
  hint: {
    trasladoOps:
      "En traslado, revisa en cada parada quién entrega y quién recibe según la operación real.",
    ingresoOps:
      "En servicio con factura, el cliente que contrata suele ser la referencia principal; las demás contrapartes por ubicación se capturan en cada parada.",
  },
  segment: {
    label: "Kilómetros desde la parada anterior",
    placeholder: "0",
    overwriteTitle: "Sobrescribir kilómetros manuales",
    overwriteBody:
      "Al cambiar la ruta, se recalcularán los kilómetros de todos los tramos. Los valores que capturaste manualmente se reemplazarán.",
    overwriteConfirm: "Continuar",
    overwriteCancel: "Cancelar",
  },
  stopForm: {
    title: {
      create: "Agregar parada",
      edit: "Editar parada",
      originCreate: "Agregar punto de carga",
      originEdit: "Editar punto de carga",
      destinationCreate: "Agregar punto de entrega",
      destinationEdit: "Editar punto de entrega",
      waypointCreate: "Agregar escala",
      waypointEdit: "Editar escala",
    },
    description: {
      origin: "Dónde se carga la mercancía al inicio del viaje.",
      destination: "Dónde se entrega la mercancía al final del viaje.",
      waypoint: "Punto intermedio para cargar, entregar o ambas.",
      fallback: "Ubicación, operaciones y contacto de la parada.",
    },
    category: {
      originTitle: "Punto de carga",
      originHint: "Solo carga de mercancía",
      destinationTitle: "Punto de entrega",
      destinationHint: "Solo descarga de mercancía",
      waypointTitle: "Escala intermedia",
      waypointQuestion: "¿Qué se hace aquí?",
      pickup: "Cargar",
      delivery: "Entregar",
      both: "Ambas",
    },
    operation: {
      pickup: "Cargar",
      delivery: "Entregar",
    },
    section: {
      location: "1. Ubicación",
      locationName: "Nombre del lugar",
      domicile: "Domicilio",
      counterparty: {
        origin: "2. Quién entrega aquí",
        destination: "2. Quién recibe aquí",
        waypointPickup: "2. Quién entrega aquí",
        waypointDelivery: "2. Quién recibe aquí",
        waypointBoth: "2. Quién entrega y quién recibe",
        fallback: "2. Quién entrega o recibe",
      },
      contactPlanning: "3. Contacto y horario",
      billingDetails: "RFC de esta parada",
    },
    label: {
      locationName: "Nombre del lugar",
      useAddressFiscalData: "Usar los datos de la dirección guardada",
      legalName: "Nombre o razón social",
      legalNameDelivery: "Nombre o razón social (entrega)",
      contactName: "Nombre contacto",
      contactPhone: "Teléfono",
      notes: "Notas / instrucciones",
      estimatedArrivalDestination: "Hora estimada de llegada",
      estimatedArrivalWaypoint: "Hora estimada en esta escala",
      searchCounterparty: "Buscar empresa o persona",
    },
    placeholder: {
      locationName: "Ej: Bodega Central, CEDIS Norte, Planta Monterrey…",
      contactName: "Nombre del contacto en sitio",
      contactPhone: "Teléfono",
      notes: "Instrucciones especiales de entrega, horarios, acceso…",
    },
    hint: {
      waypointArrivalInterpolation:
        "Se calculará automáticamente si no la capturas.",
      billingOptional:
        "Opcional al armar la ruta. Se pide al timbrar o iniciar.",
      billingCollapsedErrors:
        "Faltan RFC o razón social de esta parada. Ábrelos para completarlos.",
    },
    alert: {
      missingGeolocationTitle: "Falta ubicar esta dirección en el mapa",
      missingGeolocationBody:
        "La dirección precargada no tiene ubicación en el mapa. Confírmala para poder calcular kilómetros entre paradas.",
      branchCrossDockTitle: "La carga se recoge en tu sucursal",
      branchCrossDockBody:
        "Consolidación en sucursal: la mercancía se carga aquí, no en la recolección del cliente. Para flete directo, elige una dirección de cliente.",
      branchOriginMismatchTitle: "Sucursal distinta a la base del viaje",
      branchOriginMismatch:
        "La sucursal precargada no coincide con la base operativa del viaje. Revisa si sigue siendo la correcta.",
    },
    validation: {
      missingField: "Tipo de parada",
      waypointOperation: "Operación de la escala",
      locationName: "Nombre del lugar",
      estimatedArrival: "Hora estimada de llegada",
      geolocation: "Ubicación en el mapa",
      satFieldsFallback:
        "Completa los campos de domicilio obligatorios para este código postal.",
      missingRequiredTitle: "Faltan datos obligatorios en la parada",
      reviewAddressTitle: "Revisa la dirección de la parada",
      fieldRequired: (label: string) => `${label} es obligatorio`,
    },
    action: {
      cancel: "Cancelar",
      save: "Guardar parada",
      add: "Guardar parada",
    },
    toast: {
      persistFailedTitle: "No se pudo actualizar la dirección del cliente",
      persistFailedBody:
        "Revisa los campos del domicilio antes de guardar en el catálogo.",
      persistErrorTitle: "Error al actualizar la dirección",
      persistErrorBody: "La parada no se guardó. Intenta de nuevo.",
      saveErrorTitle: "No se pudo guardar la parada",
      saveErrorSeeInline: "Revisa el mensaje detallado en el formulario.",
    },
    persistDialog: {
      title: "¿Actualizar la dirección del cliente?",
      description:
        "Modificaste el domicilio operativo precargado del cliente. Puedes guardar los cambios en el catálogo o usarlos solo en esta parada. El domicilio fiscal de facturación no se actualiza desde aquí.",
      updateClient: "Actualizar en el cliente",
      stopOnly: "Solo en esta parada",
      backToForm: "Volver al formulario",
      saving: "Guardando…",
    },
    addressOrigin: {
      title: "Dirección guardada",
      description:
        "Se listan lugares de viaje del cliente (bodega, entrega o recolección), sucursal en origen y directorio. El domicilio fiscal de facturación no aparece aquí.",
      pickerLabel: "Buscar dirección existente",
      pickerPlaceholder: "Nombre, calle o código postal…",
    },
  },
} as const;

/** @deprecated Use `routeCopy.label` — alias legacy */
export const LOCATION_CAPTURE_LABELS = {
  country: routeCopy.label.country,
  state: routeCopy.label.state,
  municipality: routeCopy.label.municipality,
  postalCode: routeCopy.label.postalCode,
} as const;

/** @deprecated Use `routeCopy.label` — alias legacy */
export const ROUTE_CAPTURE_LABELS = {
  geolocation: routeCopy.label.geolocation,
  distanceFromPrevious: routeCopy.label.distanceFromPrevious,
  estimatedArrival: routeCopy.label.estimatedArrival,
} as const;
