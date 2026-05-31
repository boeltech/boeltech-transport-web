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
  },
  hint: {
    savedAddress:
      "Ubicación ligada a un domicilio guardado; la configuración fiscal se toma de ese registro.",
    trasladoFiscal:
      "En traslado, revise en cada parada quién entrega y quién recibe según la operación real.",
    ingresoFiscal:
      "En ingreso, el cliente que contrata el viaje suele ser la referencia principal; las demás contrapartes por ubicación se capturan en cada parada.",
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
