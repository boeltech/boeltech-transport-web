/**
 * Copy — detalle de cliente (WS-B histórico / contactos)
 *
 * Ingreso operativo: factura timbrada o tarifa base por viaje; sin costos ni margen
 * (métrica interna L0).
 */

/** Cohorte operativa: excluye borradores y cancelados (alineado en stats e histórico). */
const operationalCohortHint =
  "Excluye viajes con estado borrador y cancelado" as const;

/** Textos compartidos para la métrica de ingreso operativo (antes "L0" en UI). */
const operatingRevenue = {
  label: "Ingresos operativos",
  singular: "Ingreso operativo",
  summaryTooltip: `Factura timbrada o tarifa base por viaje · ${operationalCohortHint} · Sin costos ni margen`,
  historyDescription:
    "Ingreso operativo por viaje (factura timbrada o tarifa base). Sin costos ni margen.",
  perTripHint:
    "Factura timbrada cuando existe; si no, tarifa base del viaje.",
} as const;

export const clientDetailCopy = {
  operatingRevenue,
  contacts: {
    title: "Contactos",
    emptyTitle: "No hay contactos registrados",
    emptyDescription:
      "Agrega personas de contacto con roles operativos (Carta Porte, facturas, pagos).",
    addFirst: "Agregar primer contacto",
    addNew: "Nuevo contacto",
    createTitle: "Nuevo contacto",
    editTitle: "Editar contacto",
    formHint: "Los cambios se guardan al confirmar.",
    createSubmit: "Crear contacto",
    updateSubmit: "Guardar cambios",
    deleteTitle: "¿Eliminar contacto?",
    deleteDescription: (name: string) =>
      `El contacto ${name} se desactivará y dejará de aparecer en la lista.`,
  },
  primaryContact: {
    title: "Contacto principal",
    description: "Persona y canales de comunicación del cliente.",
    empty: "No hay contacto principal registrado.",
    cta: "Ir a Contactos",
  },
  history: {
    tab: "Histórico",
    title: "Histórico de viajes",
    description: operatingRevenue.historyDescription,
    includeExcludedLabel: "Incluir borradores y cancelados",
    table: {
      trip: "Viaje",
      route: "Ruta",
      date: "Salida programada",
      revenue: operatingRevenue.singular,
      source: "Fuente",
      status: "Estatus viaje",
      invoice: "Factura",
      empty: "Este cliente aún no tiene viajes registrados.",
    },
    revenueSource: {
      invoice_subtotal: "Factura timbrada",
      trip_base_rate: "Tarifa base",
    } as Record<string, string>,
    invoiceStatus: {
      none: "Sin factura",
    } as Record<string, string>,
  },
  stats: {
    activeTrips: "Viajes activos",
    lastTrip: "Último viaje",
    lastTripEmpty: "Sin viajes operativos",
    totalTripsHint: (count: number) =>
      `${count} viaje${count === 1 ? "" : "s"} operativo${count === 1 ? "" : "s"}`,
    operationalHint: operationalCohortHint,
    revenue: operatingRevenue.label,
    revenueTooltip: operatingRevenue.summaryTooltip,
    avgPaymentDays: "Días prom. pago",
    avgPaymentHint: "Promedio real desde pagos registrados",
    noPayments: "Sin pagos",
  },
} as const;
