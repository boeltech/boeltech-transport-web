/** Copy ACC — listado de viajes (`TripsListPage`). */
export const tripsListCopy = {
  page: {
    title: "Viajes",
    titleClient: "Mis envíos",
    titleDriver: "Mis viajes",
    description: "Consulta y administra los viajes de tu flota",
    /** Portal cliente: consulta de envíos propios (sin chrome de flota). */
    descriptionClient: "Consulta el estado de tus envíos y su facturación",
    /** Portal conductor: sus viajes asignados + seguimiento. */
    descriptionDriver: "Consulta y actualiza el estado de tus viajes asignados",
  },

  actions: {
    create: "Reservar viaje",
    createFull: "Alta completa",
    viewDrafts: "Ver reservas",
    viewMore: "Ver más",
    clearFilters: "Limpiar filtros",
  },

  createFullHint: {
    label: "Alta completa",
    body: "Captura ruta, paradas, carga y costos en un solo alta. Para anotar un pedido por llamada o mensaje, usa Reservar viaje.",
  },

  reserve: {
    hintTitle: "Reservar viaje",
    hintBody:
      "Anota cliente, ruta, fecha, unidad y conductor. Queda pendiente de programar. Sustituye el apunte en papel o Excel.",
  },

  columns: {
    code: "Código",
    client: "Cliente",
    route: "Ruta",
    vehicle: "Unidad",
    driver: "Conductor",
    departure: "Salida",
    status: "Estado",
    invoice: "Factura",
    emptyCell: "—",
    noClient: "Sin cliente",
  },

  filter: {
    overdue: "Con retraso",
    panelTitle: "Filtros",
    showFilters: "Mostrar filtros",
    hideFilters: "Ocultar filtros",
    statusLabel: "Estado",
    statusAll: "Todos los estados",
    fiscalLabel: "Atención de factura",
    fiscalAll: "Todas",
    fiscalPlaceholder: "Atención",
    fiscalAttention: "Solo con atención",
    invoiceLabel: "Estado de factura",
    invoiceAll: "Todas las facturas",
    invoicePlaceholder: "Estado de factura",
    dateLabel: "Fecha de salida",
    searchPlaceholder: "Buscar por código, cliente, origen, destino…",
    searchPlaceholderClient: "Buscar por código, origen o destino…",
    searchPlaceholderDriver: "Buscar por código, origen o destino…",
    dateHeading: "Filtrar por fecha de salida",
    datePlaceholder: "Filtrar por fecha",
  },

  chip: {
    overdue: "Con retraso",
    fiscalAttention: "Solo con atención",
    invoice: (label: string) => `Factura: ${label}`,
    date: (range: string) => `Fecha: ${range}`,
    originBranch: (label: string) => `Sucursal origen: ${label}`,
    originBranchUnassigned: "Sucursal origen: Sin sucursal",
  },

  invoiceStatus: {
    draft: "Borrador",
    stamped: "Facturado",
    cancellation_pending: "Cancelación en proceso",
    cancelled: "Cancelada",
  },

  invoicingBadge: {
    draft: "Borrador",
    stamped: "Facturado",
    cancellationPending: "Cancelación en proceso",
    cancelled: "Cancelado",
    available: "Disponible",
    unavailable: "No disponible",
  },

  refreshSuccess: "Lista actualizada",

  banner: {
    title: "Viajes con retraso",
    body: (count: number) =>
      `${count} viaje${count === 1 ? "" : "s"} en curso con la llegada programada vencida. Revísalos o márcalos como finalizados.`,
    action: "Ver con retraso",
  },

  badge: {
    overdue: (hours: number) => `${hours}h de retraso`,
    overdueShort: "Con retraso",
    fiscalAttention: "Requiere atención",
  },

  invoiceablePicker: {
    title: "Seleccionar viaje facturable",
    description:
      "Elige un viaje elegible para generar la factura. Solo se muestran viajes sin factura activa.",
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
    title: "No se encontraron viajes",
    titleClient: "No se encontraron envíos",
    titleDriver: "No se encontraron viajes",
    filteredDescription: "Prueba ajustando los filtros de búsqueda",
    noDataDescription: "Empieza creando tu primer viaje",
    noDataDescriptionClient:
      "Cuando tengas envíos registrados, aparecerán aquí.",
    noDataDescriptionDriver:
      "Cuando te asignen viajes, aparecerán aquí.",
    overdueTitle: "No hay viajes con retraso",
    overdueDescription:
      "No hay viajes en curso con la llegada programada vencida en este momento.",
    table: "No se encontraron viajes.",
    tableClient: "No se encontraron envíos.",
    tableDriver: "No se encontraron viajes asignados.",
  },

  toast: {
    deleted: "Viaje eliminado",
    deleteError: "No se pudo eliminar",
    cancelled: "Viaje cancelado",
    cancelError: "No se pudo cancelar",
  },

  dialog: {
    deleteTitle: "¿Eliminar viaje?",
    deleteDescription:
      "Esta acción no se puede deshacer. El viaje y todos sus datos asociados (paradas, cargas y gastos) se eliminarán de forma permanente.",
    deleteCancel: "Cancelar",
    deleteConfirm: "Eliminar",
    cancelTitle: "Cancelar viaje",
    cancelHint:
      "¿Seguro que deseas cancelar este viaje? El estado pasará a «Cancelado».",
    cancelReasonLabel: "Motivo de cancelación",
    cancelReasonOptional: "(opcional)",
    cancelReasonPlaceholder:
      "Ej.: el cliente pidió cancelarlo, clima adverso…",
    cancelBack: "Volver",
    cancelConfirm: "Cancelar viaje",
  },

  entityLabelPlural: "viajes",
  entityLabelPluralClient: "envíos",
  entityLabelPluralDriver: "viajes",
} as const;
