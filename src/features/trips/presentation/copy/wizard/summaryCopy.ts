/**
 * Namespace: trips.copy.wizard.summary.*
 */
export const summaryCopy = {
  alert: {
    baseRatePendingTitle: "Tarifa base pendiente",
    baseRatePendingBody:
      "Los viajes de ingreso con cliente requieren tarifa base mayor a cero.",
    marginCriticalTitle: "Rentabilidad estimada comprometida",
    marginCriticalBody:
      "El margen está por debajo del 10%. Revisa tarifa o conceptos antes de confirmar.",
  },
  section: {
    info: "Información",
    route: "Ruta",
    cargo: "Cargas",
    costs: "Costos",
    notes: "Notas adicionales",
  },
  label: {
    mainClient: "Cliente principal",
    cfdiDocument: "Comprobante",
    scheduledDeparture: "Salida programada",
    estimatedArrival: "Llegada estimada",
    startMileage: "Odómetro al salir",
    totalGrossWeight: "Peso bruto total",
    tripNotes: "Observaciones del viaje",
    noClient: "Sin cliente",
    supportStaff: "Integrante de apoyo",
  },
  state: {
    noStops: "Sin paradas registradas",
    noCargo: "Sin cargas registradas",
    captureAtDestination: "Capturar en destino",
    optionalTraslado: "Opcional (traslado)",
    notCaptured: "Sin capturar",
  },
  format: {
    ingresoDocument: "Ingreso — factura de servicio",
    trasladoDocument: "Traslado — movimiento entre ubicaciones",
  },
  placeholder: {
    notes: "Instrucciones especiales, comentarios, etc...",
  },
} as const;
