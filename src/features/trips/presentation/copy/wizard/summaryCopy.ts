/**
 * Namespace: trips.copy.wizard.summary.*
 *
 * Checkout operativo del paso Resumen: confirmar el viaje sin reabrir la
 * captura. Léxico alineado a Cargas («mercancía») y Costos («ruta y unidad»).
 */
export const summaryCopy = {
  page: {
    title: "Confirmar viaje",
    subtitle:
      "Revise cada sección antes de crear o guardar. Use Editar para corregir un paso.",
  },
  alert: {
    baseRatePendingTitle: "Tarifa base pendiente",
    baseRatePendingBody:
      "Los viajes con cobro al cliente requieren tarifa base mayor a cero.",
    marginCriticalTitle: "Margen estimado bajo",
    marginCriticalBody:
      "El margen está por debajo del 10 %. Revise la tarifa o los conceptos antes de confirmar.",
  },
  section: {
    info: "Asignación y programación",
    route: "Ruta",
    cargo: "Mercancías",
    costs: "Dinero del viaje",
    notes: "Notas del viaje",
  },
  sectionSummary: {
    notesFilled: "Hay observaciones capturadas",
    notesEmpty: "Sin observaciones (opcional)",
  },
  confirm: {
    noClient: "Sin cliente",
    stops: (count: number, kmFormatted?: string) =>
      kmFormatted
        ? `${count} parada${count !== 1 ? "s" : ""} · ${kmFormatted}`
        : `${count} parada${count !== 1 ? "s" : ""}`,
    merchandise: (count: number, weightFormatted?: string) =>
      weightFormatted
        ? `${count} mercancía${count !== 1 ? "s" : ""} · ${weightFormatted}`
        : `${count} mercancía${count !== 1 ? "s" : ""}`,
    utility: (amount: string, pctFormatted?: string) =>
      pctFormatted ? `Utilidad ${amount} · ${pctFormatted}` : `Utilidad ${amount}`,
    marginPct: (pct: number) => `${pct.toFixed(0)} %`,
    hazmat: "Incluye material peligroso",
  },
  label: {
    unit: "Unidad",
    driver: "Conductor",
    scheduledDeparture: "Salida programada",
    estimatedArrival: "Llegada estimada",
    startMileage: "Odómetro al salir",
    totalWeight: "Peso total",
    tripNotes: "Observaciones del viaje",
    noClient: "Sin cliente",
    supportStaff: "Integrante de apoyo",
    supportStaffSecondaryDriver: "Conductor adicional",
    supportStaffHelper: "Ayudante general",
    paymentResponsible: "Responsable de pago",
    supportTeam: (count: number) => `Equipo de apoyo (${count})`,
    baseRate: "Tarifa base",
    operational: "Ruta y unidad",
    indirect: "Operador y extras",
    concepts: (count: number) =>
      `${count} concepto${count !== 1 ? "s" : ""}`,
  },
  badge: {
    hazmatShort: "Material peligroso",
    insured: "Asegurada",
    emptyStop: "Sin mercancías",
  },
  state: {
    noStops: "Sin paradas registradas",
    noCargo: "Sin mercancías registradas",
    captureAtDestination: "Se captura en destino",
    optionalTraslado: "Opcional (solo traslado)",
    notCaptured: "Sin capturar",
  },
  format: {
    ingresoDocument: "Con cobro al cliente",
    trasladoDocument: "Solo traslado",
    stopNumber: (index: number) => `Parada ${index + 1}`,
    stopGroup: (index: number, locationName: string | undefined, count: number) =>
      locationName
        ? `Parada ${index + 1} · ${locationName} · ${count} mercancía${count !== 1 ? "s" : ""}`
        : `Parada ${index + 1} · ${count} mercancía${count !== 1 ? "s" : ""}`,
    deliveryBadge: (stopLabel: string, weight?: number | null) => {
      let text = `Entrega en ${stopLabel}`;
      if (weight != null) text += ` · ${weight} kg`;
      return text;
    },
    kmFromPrevious: (km: number) => `${km} km desde la anterior`,
    distanceKm: (km: number) =>
      `${km.toLocaleString("es-MX")} km`,
    weightKg: (kg: number) =>
      `${kg.toLocaleString("es-MX")} kg`,
    units: (units: number, unitName: string) =>
      `${units.toLocaleString("es-MX")} ${unitName || "unidades"}`,
  },
  hint: {
    hazmat: "Incluye material peligroso. Revise los requisitos del producto.",
    insured: (count: number) =>
      `${count} mercancía${count !== 1 ? "s" : ""} asegurada${count !== 1 ? "s" : ""}.`,
  },
  action: {
    edit: "Editar",
  },
  placeholder: {
    notes: "Instrucciones especiales, comentarios…",
  },
} as const;
