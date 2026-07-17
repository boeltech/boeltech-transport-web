/**
 * Namespace: trips.copy.wizard.route.*
 */
export const routeCopy = {
  label: {
    country: "país",
    state: "estado",
    municipality: "municipio",
    postalCode: "código postal",
    geolocation: "geolocalización confirmada",
    distanceFromPrevious: "distancia desde parada anterior",
    estimatedArrival: "hora estimada de llegada",
    noAddress: "Sin dirección especificada",
    originBranch: "Sucursal de origen",
  },
  format: {
    stopFallback: (index: number) => `Parada ${index + 1}`,
    stopHash: (index: number) => `Parada #${index + 1}`,
    stopCompleteMissing: (stopLabel: string, missing: string) =>
      `${stopLabel}: completa ${missing}`,
    stopMissingGeolocation: (stopLabel: string) =>
      `${stopLabel}: falta geolocalización`,
    stopMissingDistance: (stopLabel: string) =>
      `${stopLabel}: falta distancia desde parada anterior`,
    previousStopLabel: (index: number) => `Parada #${index + 1}`,
    completeStop: (label: string, missingJoined: string) =>
      `Completar ${label} (${missingJoined})`,
  },
  toast: {
    insufficientCoordinatesTitle: "Sin coordenadas suficientes",
    insufficientCoordinatesBody:
      "Confirma geolocalización en todas las paradas para calcular distancias.",
    partialDistanceTitle: "Distancia parcial",
    partialDistanceBody:
      "Algunos tramos no tienen coordenadas en ambas paradas; solo se actualizaron los tramos completos.",
    distanceErrorTitle: "Error al calcular distancias",
    distanceErrorBody: "No se pudieron actualizar los tramos. Intenta de nuevo.",
  },
  action: {
    addOrigin: "Agregar origen",
    addDestination: "Agregar destino",
    evaluateWaypoints: "Evaluar si requiere escalas",
    routeReady: "Ruta lista. Ya puedes avanzar a Cargas.",
    createBranch: "Crear sucursal",
  },
  placeholder: {
    selectOriginBranch: "Seleccionar sucursal",
  },
  section: {
    quickGuide: "Guía rápida de ruta",
    routeRules: "Reglas de la ruta",
    origin: "Origen",
    waypoints: "Escalas",
    destination: "Destino",
  },
  state: {
    allComplete: "Todo completo",
    pendingCount: (count: number) => `${count} pendientes`,
    noOriginTitle: "Sin parada de origen",
    noOriginHint: "Agregue el punto de inicio del viaje",
    noWaypointsTitle: "Sin escalas intermedias",
    noWaypointsHint:
      "Las escalas son opcionales. Puedes agregarlas para carga o descarga parcial",
    noDestinationTitle: "Sin parada de destino",
    noDestinationHint: "Agregue el punto final del viaje",
    noBranches: "No hay sucursales activas",
  },
  hint: {
    savedAddress:
      "Ubicación ligada a un domicilio guardado; la configuración fiscal se toma de ese registro.",
    trasladoFiscal:
      "En traslado, revise en cada parada quién entrega y quién recibe según la operación real.",
    ingresoFiscal:
      "En ingreso, el cliente que contrata el viaje suele ser la referencia principal; las demás contrapartes por ubicación se capturan en cada parada.",
    originBranch:
      "Base operativa del viaje: filtra la flota sugerida y queda registrada para reportes. No es, por defecto, el punto de carga fiscal de la mercancía.",
  },
  stopForm: {
    title: {
      create: "Agregar parada",
      edit: "Editar parada",
    },
    description: "Ubicación, operaciones y datos fiscales de la parada.",
    operation: {
      pickup: "Carga",
      delivery: "Descarga",
    },
    section: {
      locationName: "Nombre del lugar",
      domicile: "Domicilio",
      fiscalData: "Datos fiscales",
      contactPlanning: "Contacto y planificación",
    },
    label: {
      locationName: "Nombre del lugar",
      useAddressFiscalData: "Usar datos fiscales de la dirección",
      legalName: "Nombre / razón social",
      legalNameDelivery: "Nombre / razón social (descarga)",
      contactName: "Nombre contacto",
      contactPhone: "Teléfono",
      notes: "Notas / instrucciones",
      estimatedArrivalDestination: "Hora estimada de llegada",
      estimatedArrivalWaypoint: "Hora estimada en esta escala",
    },
    placeholder: {
      locationName:
        "Ej: Bodega Central, CEDIS Norte, Planta Monterrey…",
      contactName: "Nombre del contacto en sitio",
      contactPhone: "Teléfono",
      notes: "Instrucciones especiales de entrega, horarios, acceso…",
    },
    hint: {
      waypointArrivalInterpolation:
        "Se interpolará automáticamente si no se captura.",
    },
    alert: {
      missingGeolocationTitle: "Falta geolocalización en la dirección precargada",
      missingGeolocationBody:
        "Esta dirección precargada no tiene latitud / longitud registradas. Captúralas desde el mapa o ingrésalas manualmente para calcular distancias y cumplir Carta Porte 3.1.",
      branchCrossDockTitle: "Carga en sucursal (cross-dock)",
      branchCrossDockBody:
        "Consolidación en sucursal: la mercancía se carga aquí, no en la recolección del cliente. Para flete directo, elige una dirección de cliente.",
      branchOriginMismatchTitle: "Sucursal distinta a la de origen del viaje",
      branchOriginMismatch:
        "La sucursal precargada no coincide con la sucursal de origen del viaje. Revisa si el tag operativo sigue siendo el correcto.",
    },
    validation: {
      missingField: "Tipo de parada",
      waypointOperation: "Operación de escala",
      locationName: "Nombre del lugar",
      estimatedArrival: "Hora estimada de llegada",
      geolocation: "Confirmación Geográfica",
      satFieldsFallback:
        "Completa los campos SAT obligatorios para este código postal.",
      missingRequiredTitle: "Faltan datos obligatorios en la parada",
      reviewAddressTitle: "Revisa la dirección de la parada",
      fieldRequired: (label: string) => `${label} es obligatorio`,
    },
    action: {
      cancel: "Cancelar",
      save: "Guardar Cambios",
      add: "Agregar Parada",
    },
    toast: {
      persistFailedTitle: "No se pudo actualizar la dirección del cliente",
      persistFailedBody:
        "Revisa los campos del domicilio antes de guardar en el catálogo.",
      persistErrorTitle: "Error al actualizar la dirección",
      persistErrorBody: "La parada no se guardó. Intenta de nuevo.",
    },
    persistDialog: {
      title: "¿Actualizar la dirección del cliente?",
      description:
        "Modificaste el domicilio precargado del cliente. Puedes guardar los cambios en el catálogo del cliente o usar esta versión solo para esta parada del viaje.",
      updateClient: "Actualizar en el cliente",
      stopOnly: "Solo en esta parada",
      backToForm: "Volver al formulario",
      saving: "Guardando…",
    },
    addressOrigin: {
      title: "Origen de la dirección",
      description:
        "Busca un domicilio del catálogo (cliente, sucursal en origen o directorio del tenant). Al seleccionar se copia a esta parada; editar aquí no modifica la fuente.",
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
