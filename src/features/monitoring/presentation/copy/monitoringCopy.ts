/**
 * Copy — Monitoreo GPS / mapa de flota.
 */

export const monitoringCopy = {
  fleet: {
    title: "Mapa de flota",
    searchPlaceholder: "Buscar eco o placa…",
    searchAria: "Buscar unidad por eco o placa",
    collapsePanel: "Ocultar panel",
    expandPanel: "Mostrar panel",
    panelTitle: "Unidades",
    emptyTitle: "Sin dispositivos vinculados",
    emptyDescription:
      "Vincula un dispositivo GPS a un vehículo desde el detalle de la unidad para verla en el mapa.",
    emptyCta: "Ir a Vehículos",
    errorTitle: "No se pudo conectar al servicio de rastreo",
    errorDisabled:
      "El monitoreo GPS está desactivado en este entorno. Actívalo en la API o contacta a soporte.",
    retry: "Reintentar",
    loadingAria: "Cargando posiciones de flota",
    summary: (online: number, total: number) =>
      `${online} en línea · ${total} vinculadas`,
    noSignal: "Sin señal",
    speed: (kmh: number) => `${Math.round(kmh)} km/h`,
    course: (deg: number) => `${String(Math.round(deg)).padStart(3, "0")}°`,
    viewVehicle: "Ver vehículo",
    mapUnavailable:
      "Configura VITE_MAPBOX_PUBLIC_TOKEN para mostrar el mapa de flota.",
    status: {
      online: "En línea",
      stale: "Señal intermitente",
      offline: "Sin señal",
    },
  },
  relativeTime: {
    justNow: "Hace un momento",
    minutes: (n: number) => (n === 1 ? "Hace 1 min" : `Hace ${n} min`),
    hours: (n: number) => (n === 1 ? "Hace 1 h" : `Hace ${n} h`),
    days: (n: number) => (n === 1 ? "Hace 1 día" : `Hace ${n} días`),
    unknown: "—",
  },
  device: {
    title: "Dispositivo GPS",
    unlinkedTitle: "Sin dispositivo vinculado",
    unlinkedDescription:
      "Vincula un dispositivo para rastrear esta unidad en el mapa de flota.",
    linkCta: "Vincular dispositivo",
    unlinkMenu: "Desvincular dispositivo",
    viewOnMap: "Ver en mapa de flota",
    waitingSignal: "Esperando primera señal",
    label: {
      imei: "IMEI",
      status: "Estado",
      lastPosition: "Última posición",
      speed: "Velocidad",
      signal: "Señal",
      linked: "Vinculado",
    },
    status: {
      online: "En línea",
      stale: "Señal intermitente",
      offline: "Sin señal",
    },
    noReport: "Sin reportar",
    emptyValue: "—",
    linkedBy: (date: string, name: string | null) =>
      name ? `${date} por ${name}` : date,
    disabledMessage:
      "El monitoreo GPS no está disponible en este entorno.",
    loadError: "No se pudo cargar el estado del GPS.",
    retry: "Reintentar",
  },
  linkSheet: {
    title: "Vincular dispositivo GPS",
    description: (unit: string) => `Vehículo: ${unit}`,
    imeiLabel: "IMEI",
    imeiHint: "15 dígitos del dispositivo",
    imeiRequired: "Ingresa el IMEI del dispositivo",
    imeiInvalid: "El IMEI debe tener exactamente 15 dígitos numéricos",
    cancel: "Cancelar",
    submit: "Vincular",
    submitting: "Vinculando…",
    success: "Dispositivo GPS vinculado",
    errorGeneric: "No se pudo vincular el dispositivo",
    errorAlreadyLinked: "Esta unidad ya tiene un dispositivo vinculado",
    errorImeiAssigned: "Este IMEI ya está asignado a otra unidad",
    errorNotInTraccar:
      "Este IMEI no está registrado en el servicio de rastreo",
    errorDisabled: "El monitoreo GPS está desactivado",
  },
  unlinkDialog: {
    title: "Desvincular dispositivo",
    description: (unit: string) =>
      `¿Desvincular el dispositivo GPS de ${unit}?`,
    consequence: "La unidad dejará de aparecer en el mapa de flota.",
    cancel: "Cancelar",
    confirm: "Desvincular",
    confirming: "Desvinculando…",
    success: "Dispositivo GPS desvinculado",
    errorGeneric: "No se pudo desvincular el dispositivo",
  },
} as const;
