/**
 * Copy — Monitoreo GPS / mapa de flota / historial.
 */

export const monitoringCopy = {
  /** Página de presentación (DC4 · X8) — ancla GPS-Admin / GPS-Equipo. */
  presentation: {
    badgeType: "Complemento",
    badgeNotIncluded: "No incluido en tu plan",
    title: "Monitoreo GPS",
    lead: "Ve dónde está cada unidad, revisa su recorrido y recibe alertas cuando algo sale de lo normal, sin salir de tlamx.",
    ctaRequest: "Solicitar activación",
    ctaSecondary: "Ver mis complementos",
    mailtoHint:
      "Se abre tu correo con un mensaje para billing@boeltech.com con el nombre de tu empresa y tu usuario. Boeltech te contacta para cotizar según tu flota.",
    askAdminTitle: "Pide a un administrador que lo active",
    askAdminBody:
      "Solo un administrador de tu empresa puede solicitar complementos a Boeltech. Compártele esta pantalla.",
    includesTitle: "Qué incluye",
    includes: {
      fleetMap: {
        title: "Mapa de flota",
        body: "Todas tus unidades en un mapa, con su estado: en movimiento, detenida o sin señal.",
      },
      history: {
        title: "Historial de recorrido",
        body: "Por dónde pasó cada unidad y cuándo, para aclarar retrasos con tu cliente.",
      },
      alerts: {
        title: "Alertas GPS",
        body: "Exceso de velocidad, parada prolongada y pérdida de señal, con umbrales por empresa.",
      },
    },
    howTitle: "Cómo se activa",
    how: {
      step1: {
        title: "Solicitas la activación",
        body: "Desde esta pantalla. Solo un administrador puede hacerlo.",
      },
      step2: {
        title: "Boeltech te da e instala el dispositivo",
        body: "Cotizamos según tu flota, te entregamos el GPS y lo instalamos. Un equipo tuyo solo se vincula si es compatible con nuestro servidor (sujeto a revisión de compatibilidad).",
      },
      step3: {
        title: "Vinculas cada unidad",
        body: "En la ficha de la unidad, con el IMEI del dispositivo.",
      },
    },
  },
  /** Kill-switch (DC7 · X9) — sin API/entorno. */
  unavailable: {
    title: "Monitoreo GPS no está disponible por ahora",
    body: "Tu información y la configuración de tus unidades se conservan. Si lo necesitas con urgencia, escribe a soporte.",
  },
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
      "Monitoreo GPS no está disponible por ahora. Tu información y la configuración de tus unidades se conservan.",
    errorNotEntitled:
      "El complemento Monitoreo GPS no está contratado.",
    retry: "Reintentar",
    loadingAria: "Cargando posiciones de flota",
    summary: (online: number, total: number) =>
      `${online} en línea · ${total} vinculadas`,
    noSignal: "Sin señal",
    speed: (kmh: number) => `${Math.round(kmh)} km/h`,
    course: (deg: number) => `${String(Math.round(deg)).padStart(3, "0")}°`,
    viewVehicle: "Ver vehículo",
    viewHistory: "Ver historial",
    mapUnavailable:
      "Configura VITE_MAPBOX_PUBLIC_TOKEN para mostrar el mapa de flota.",
    status: {
      online: "En línea",
      stale: "Señal intermitente",
      offline: "Sin señal",
    },
    movement: {
      moving: "En movimiento",
      stopped: "Detenido",
      empty: "—",
    },
    addressUnavailable: "Dirección no disponible",
    sats: (n: number) => `#Sats: ${n}`,
    satsEmpty: "#Sats: —",
    battery: (pct: number) => `Batería: ${Math.round(pct)}%`,
    batteryEmpty: "Batería: —",
    phone: (value: string) => `Tel: ${value}`,
    odometer: (km: number) =>
      `Odómetro: ${km.toLocaleString("es-MX", { maximumFractionDigits: 1 })} km`,
    odometerEmpty: "Odómetro: —",
  },
  relativeTime: {
    justNow: "Hace un momento",
    minutes: (n: number) => (n === 1 ? "Hace 1 min" : `Hace ${n} min`),
    hours: (n: number) => (n === 1 ? "Hace 1 h" : `Hace ${n} h`),
    days: (n: number) => (n === 1 ? "Hace 1 día" : `Hace ${n} días`),
    unknown: "—",
  },
  parity: {
    label: {
      timestamp: "Última señal",
      address: "Dirección",
      course: "Rumbo",
      sats: "#Sats",
      battery: "Batería",
      phone: "Teléfono",
      odometer: "Odómetro",
      movement: "Movimiento",
    },
    empty: "—",
    addressUnavailable: "Dirección no disponible",
    batteryPct: (pct: number) => `${Math.round(pct)}%`,
    odometerKm: (km: number) =>
      `${km.toLocaleString("es-MX", { maximumFractionDigits: 1 })} km`,
    movement: {
      moving: "En movimiento",
      stopped: "Detenido",
    },
  },
  history: {
    title: "Historial de ruta",
    backToFleet: "← Mapa de flota",
    periodLabel: "Periodo",
    presets: {
      last4h: "Últimas 4 h",
      today: "Hoy",
      yesterday: "Ayer",
      last24h: "Últimas 24 h",
      custom: "Personalizado",
    },
    customFrom: "Desde",
    customTo: "Hasta",
    applyCustom: "Consultar",
    rangeOrderError: "La fecha final debe ser posterior a la inicial.",
    rangeMaxError: "El rango máximo es de 7 días.",
    emptyTitle: "Sin posiciones en este periodo",
    emptyDescription:
      "No hay pings GPS en el rango seleccionado. Prueba otro periodo.",
    errorTitle: "No se pudo cargar el historial",
    errorTraccar:
      "El servicio de rastreo no respondió. Reintenta en unos segundos.",
    errorDisabled: "Monitoreo GPS no está disponible por ahora.",
    errorNotLinked: "Esta unidad no tiene dispositivo GPS vinculado.",
    errorNotEntitled:
      "El complemento Monitoreo GPS no está contratado.",
    retry: "Reintentar",
    loadingAria: "Cargando historial de ruta",
    mapUnavailable:
      "Configura VITE_MAPBOX_PUBLIC_TOKEN para ver la traza en el mapa.",
    sampledNote: (shown: number, raw: number) =>
      `Mostrando ${shown.toLocaleString("es-MX")} de ${raw.toLocaleString("es-MX")} puntos (muestreo).`,
    pointCount: (n: number) =>
      n === 1 ? "1 punto" : `${n.toLocaleString("es-MX")} puntos`,
    scrubberAria: "Recorrer la traza en el tiempo",
    tableTitle: "Detalle de recorrido",
    table: {
      seq: "#",
      time: "Fecha/hora",
      movement: "Estado",
      speed: "km/h",
      course: "Rumbo",
    },
    detail: {
      title: "Punto seleccionado",
      coords: "Coordenadas",
      speed: "Velocidad",
      course: "Rumbo",
      movement: "Estado",
      sats: "#Sats",
      battery: "Batería",
      odometer: "Odómetro",
      address: "Dirección",
      addressLoading: "Buscando dirección…",
    },
    unitFallback: "Unidad",
  },
  device: {
    title: "Dispositivo GPS",
    unlinkedTitle: "Sin dispositivo vinculado",
    unlinkedDescription:
      "Vincula un dispositivo para rastrear esta unidad en el mapa de flota.",
    linkCta: "Vincular dispositivo",
    unlinkMenu: "Desvincular dispositivo",
    viewOnMap: "Ver en mapa de flota",
    viewHistory: "Ver historial",
    waitingSignal: "Esperando primera señal",
    label: {
      imei: "IMEI",
      status: "Estado",
      lastPosition: "Última posición",
      speed: "Velocidad",
      signal: "Señal",
      linked: "Vinculado",
      address: "Dirección",
      course: "Rumbo",
      sats: "#Sats",
      battery: "Batería",
      phone: "Teléfono",
      odometer: "Odómetro",
      movement: "Movimiento",
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
      "Monitoreo GPS no está disponible por ahora.",
    notEntitledMessage:
      "El complemento Monitoreo GPS no está contratado.",
    teaserTitle: "Monitoreo GPS",
    teaserBadge: "Complemento",
    teaserBody:
      "Ve dónde está esta unidad y su recorrido. No está incluido en tu plan.",
    teaserCta: "Conocer Monitoreo GPS",
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
    successDescription:
      "Si el IMEI era nuevo, el servicio de rastreo lo registró automáticamente. La primera señal puede tardar unos minutos.",
    errorGeneric: "No se pudo vincular el dispositivo",
    errorAlreadyLinked: "Esta unidad ya tiene un dispositivo vinculado",
    errorImeiAssigned: "Este IMEI ya está asignado a otra unidad",
    errorNotInTraccar:
      "Este IMEI no está registrado en el servicio de rastreo",
    errorDisabled: "Monitoreo GPS no está disponible por ahora",
    errorNotEntitled:
      "El complemento Monitoreo GPS no está contratado",
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
  overlay: {
    title: "Posición GPS",
    viewOnMap: "Ver en mapa de flota",
    viewHistory: "Ver historial",
    waitingSignal: "Esperando primera señal",
    mapUnavailable:
      "Configura VITE_MAPBOX_PUBLIC_TOKEN para ver el mini-mapa.",
    label: {
      speed: "Velocidad",
      address: "Dirección",
      lastSignal: "Última señal",
      course: "Rumbo",
      sats: "#Sats",
      battery: "Batería",
      phone: "Teléfono",
      odometer: "Odómetro",
      movement: "Movimiento",
      status: "Señal",
    },
    emptyValue: "—",
  },
  alerts: {
    title: "Alertas GPS",
    description: "Últimos 7 días de alertas de la flota.",
    emptyTitle: "Sin alertas en este periodo",
    emptyDescription:
      "No hay alertas registradas con los filtros actuales.",
    errorTitle: "No se pudieron cargar las alertas",
    errorNotEntitled:
      "El complemento Monitoreo GPS no está contratado",
    retry: "Reintentar",
    viewOnMap: "Ver en mapa",
    settingsLink: "Configuración de alertas",
    unread: "Sin leer",
    filters: {
      type: "Tipo",
      vehicle: "Vehículo",
      period: "Periodo",
      allTypes: "Todos los tipos",
      allVehicles: "Todas las unidades",
      last7d: "Últimos 7 días",
      unreadOnly: "Solo sin leer",
    },
    types: {
      overspeed: "Exceso de velocidad",
      long_stop: "Parada prolongada",
      signal_lost: "Pérdida de señal",
      low_battery: "Batería baja",
      geofence_exit: "Salida de geocerca",
    },
  },
  alertSettings: {
    title: "Configuración de alertas GPS",
    description:
      "Umbrales por tenant. Aplican a toda la flota con dispositivo vinculado.",
    save: "Guardar",
    saving: "Guardando…",
    saved: "Configuración de alertas actualizada",
    errorGeneric: "No se pudo guardar la configuración",
    loadError: "No se pudo cargar la configuración de alertas",
    errorNotEntitled:
      "El complemento Monitoreo GPS no está contratado",
    retry: "Reintentar",
    unconfigured: "Sin configurar",
    unconfiguredHint:
      "No hay geocercas en el servicio de rastreo. Configúralas en Traccar para habilitar esta alerta.",
    thresholdLabel: "Umbral",
    enabledLabel: "Activa",
    types: {
      overspeed: {
        title: "Exceso de velocidad",
        description: "Cuando la unidad supera el límite configurado.",
        unit: "km/h",
      },
      long_stop: {
        title: "Parada prolongada",
        description: "Cuando la unidad permanece detenida más del umbral.",
        unit: "min",
      },
      signal_lost: {
        title: "Pérdida de señal",
        description: "Sin fix GPS durante más del umbral.",
        unit: "min",
      },
      low_battery: {
        title: "Batería baja del GPS",
        description: "Cuando la batería del dispositivo baja del umbral.",
        unit: "%",
      },
      geofence_exit: {
        title: "Salida de geocerca base",
        description: "Cuando la unidad sale de una geocerca definida.",
        unit: "",
      },
    },
  },
} as const;
