/** Copy mínimo del canvas de alta (ADR-0078). Namespace: trips.copy.canvas.* */
export const canvasCopy = {
  page: {
    title: "Reservar viaje",
    subtitle: "Anota el pedido del cliente y deja unidad y conductor listos.",
    backLabel: "Volver a viajes",
  },
  columns: {
    pedido: "Pedido",
    flota: "Flota",
    pedidoHint: "Cliente, corredor o ciudades y fecha de salida.",
    flotaHint: "Unidad, remolque si aplica y conductor.",
  },
  /** PD3: anti-colisión con «Confirmar reserva» del detalle. */
  confirmLater: {
    title: "Opcional ahora",
    hint: "No hace falta para reservar. Llegada, tarifa y km si ya los tienes.",
  },
  corridor: {
    label: "Corredor frecuente",
    /** PD5: ≤ ~1 línea en superficie. */
    hint: "Clona las paradas del trayecto frecuente.",
    /** Detalle largo → hint-icon. */
    hintDetail:
      "Trayecto frecuente del cliente: clona las paradas. No es tarifa de pago a operadores. No copia flota, fecha, mercancía ni tarifa.",
    empty: "Sin corredores previos; captura ciudades.",
    loading: "Cargando corredores…",
    stopCount: (count: number) =>
      `${count} parada${count === 1 ? "" : "s"}`,
    tripCount: (count: number) =>
      `${count} viaje${count === 1 ? "" : "s"}`,
  },
  estimate: {
    title: "Estimado interno",
    fuel: "Combustible",
    tolls: "Peaje",
    total: "Total",
    basedOn: (n: number) =>
      `Con base en ${n} viaje${n === 1 ? "" : "s"} completados`,
    adjusted: "Ajustado al rendimiento de la unidad",
    distance: (km: number) => `${km} km`,
    compactLine: (total: string) =>
      `${total}. No es precio al cliente. No bloquea reservar.`,
    disclaimer:
      "Estimado interno de combustible y peaje. No es precio al cliente ni cotización. Percances no incluidos.",
    doesNotBlock: "No bloquea reservar.",
    showBreakdown: "Ver desglose",
    hideBreakdown: "Ocultar desglose",
  },
  /** Campos del canvas (antes mezclados con wizardCopy.shell.reserve / basicInfo). */
  fields: {
    section: {
      routeApprox: "Ruta aproximada",
      schedule: "Fecha de salida",
    },
    label: {
      client: "Cliente",
      originCity: "Ciudad de origen",
      destinationCity: "Ciudad de destino",
      routeType: "Clase de ruta",
      notes: "Notas del pedido",
      baseRate: "Tarifa acordada (opcional)",
      scheduledDeparture: "Salida programada",
      scheduledArrival: "Llegada estimada",
      startMileage: "Kilometraje inicial",
    },
    placeholder: {
      selectClient: "Seleccionar cliente",
      originCity: "Ej. CDMX",
      destinationCity: "Ej. Monterrey",
      notes: "Ej. Llamada · WhatsApp · Pedido verbal",
      routeType: "Seleccionar clase de ruta",
      startMileage: "0",
    },
    hint: {
      notes: "Cómo lo pidieron y cualquier detalle útil para la operación.",
      baseRate: "Si ya la acordaron; si no, la capturas al confirmar.",
      startMileage:
        "Captura el odómetro al salir; se usa al confirmar e iniciar el viaje.",
      newClient: "Si el cliente no aparece en la lista,",
      newClientEscalate:
        "Si no está en la lista, pide el alta a administración.",
      arrival: "Opcional; puedes completarla al confirmar.",
      client: "Quién solicita el viaje.",
      routeType:
        "Define cómo se paga al operador: entrega urbana (Local), trayecto foráneo, o maniobra patio↔patio (Transfer / Patio). No es el CFDI.",
    },
    hintLabel: {
      scheduledArrival: "Llegada estimada",
    },
    action: {
      newClient: "regístralo aquí",
    },
    format: {
      currentMileage: (km: number) =>
        `Kilometraje actual: ${km.toLocaleString()} km`,
    },
    preset: {
      todayAtEight: "Hoy 08:00",
      tomorrowAtEight: "Mañana 08:00",
    },
  },
  toast: {
    serverValidationTitle: "El viaje no cumple la validación del servidor",
    tripReserved: "Reserva guardada",
    overlapWarningTitle: "Posible traslape de asignación",
    createError: "Error al crear viaje",
    unknownError: "Error desconocido",
  },
  submit: {
    label: "Reservar viaje",
    pending: "Guardando reserva…",
    validationTitle: "Revisa el pedido y la flota",
  },
} as const;
