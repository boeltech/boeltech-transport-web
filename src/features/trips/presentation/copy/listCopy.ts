/** Copy ACC — listado de viajes (`TripsListPage`). */
export const tripsListCopy = {
  filter: {
    overdue: "Sin finalizar",
    panelTitle: "Filtros",
    statusLabel: "Estado",
    statusAll: "Todos los estados",
    fiscalLabel: "Situación fiscal",
    fiscalAll: "Todos (fiscal)",
    fiscalPlaceholder: "Fiscal",
    fiscalAttention: "Solo atención fiscal",
    invoiceLabel: "Estado de factura",
    invoiceAll: "Todas las facturas",
    invoicePlaceholder: "Estado factura",
    dateLabel: "Fecha de salida",
    searchPlaceholder: "Buscar por código, origen, destino...",
    dateHeading: "Filtrar por fecha de salida",
    datePlaceholder: "Filtrar por fecha",
  },
  chip: {
    overdue: "Sin finalizar",
    fiscalAttention: "Atención fiscal",
    invoice: (label: string) => `Factura: ${label}`,
    date: (range: string) => `Fecha: ${range}`,
    originBranch: (label: string) => `Sucursal origen: ${label}`,
    originBranchUnassigned: "Sucursal origen: Sin sucursal",
  },
  invoiceStatus: {
    draft: "Borrador",
    stamped: "Timbrada",
    cancellation_pending: "Pend. cancelación SAT",
    cancelled: "Cancelada",
  },
  refreshSuccess: "Lista actualizada",
  banner: {
    title: "Viajes sin finalizar",
    body: (count: number) =>
      `${count} viaje${count === 1 ? "" : "s"} en curso con llegada programada vencida. Finalízalos o revisa el retraso operativo.`,
    action: "Ver listado filtrado",
  },
  badge: {
    overdue: (hours: number) => `${hours}h de retraso`,
    overdueShort: "Sin finalizar",
  },
  invoiceablePicker: {
    title: "Seleccionar viaje facturable",
    description:
      "Elige un viaje elegible para generar CFDI. Solo se muestran viajes sin factura activa.",
    searchPlaceholder: "Buscar por código, origen o destino…",
    empty: "No hay viajes facturables en este momento.",
    loadError: "No se pudo cargar la lista de viajes.",
    selectAction: "Facturar",
    columns: {
      code: "Código",
      route: "Ruta",
      client: "Cliente",
      departure: "Salida",
      baseRate: "Tarifa base",
    },
  },
  empty: {
    overdueTitle: "No hay viajes sin finalizar",
    overdueDescription:
      "No hay viajes en curso con llegada programada vencida en este momento.",
  },
} as const;
