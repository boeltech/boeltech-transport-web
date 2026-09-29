/** Copy ACC — listado de viajes (`TripsListPage`). */
export const tripsListCopy = {
  page: {
    title: "Viajes",
    titleClient: "Mis envíos",
    titleDriver: "Mis viajes",
    description: "Consulta y administra los viajes de tu flota",
    /** Despachador: job del día (D7), no «administra tu flota». */
    descriptionDispatcher:
      "Reserva, completa ruta y cargas, confirma e inicia. Aquí está el trabajo del día.",
    /** Contador: lectura para facturar (D8). */
    descriptionAccountant:
      "Lee el viaje para facturar. El primer CFDI está en Por facturar. Aquí, Atención fiscal es la cola de revisión de facturas ya emitidas.",
    /** Gerente: receptor del trámite SAT (D6). No flota, no 4 pasos. */
    descriptionManager:
      "Cuando facturación te pide cancelar o sustituir, entra por Atención fiscal. Tú ejecutas el trámite en la factura.",
    /** Operador: gastos en el detalle (D6). No flota, no patio, no fiscal. */
    descriptionOperator:
      "Los gastos del viaje se cargan en el detalle, en el tab Costos.",
    /** Portal cliente: consulta de envíos propios (sin chrome de flota). */
    descriptionClient:
      "Consulta el estado de tus envíos. Las facturas están en Mis facturas.",
    /** Portal conductor: ciclo operativo de *sus* viajes (D6). No flota. */
    descriptionDriver:
      "Inicia, registra las paradas y completa tus viajes asignados.",
  },

  actions: {
    create: "Reservar viaje",
    viewDrafts: "Ver reservas",
    viewMore: "Ver más",
    clearFilters: "Limpiar filtros",
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
    showFilters: "Filtros",
    hideFilters: "Filtros",
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
    searchPlaceholder: "Código, cliente o ruta",
    searchPlaceholderClient: "Código, origen o destino",
    searchPlaceholderDriver: "Código, origen o destino",
    dateHeading: "Filtrar por fecha de salida",
    datePlaceholder: "Filtrar por fecha",
    originBranchLabel: "Sucursal origen",
    originBranchAll: "Todas",
    originBranchUnassigned: "Sin sucursal",
    originBranchPlaceholder: "Sucursal origen",
  },

  chip: {
    overdue: "Con retraso",
    fiscalAttention: "Solo con atención",
    invoice: (label: string) => `Factura: ${label}`,
    date: (range: string) => `Fecha: ${range}`,
    originBranch: (label: string) => `Sucursal origen: ${label}`,
    originBranchUnassigned: "Sucursal origen: Sin sucursal",
    originBranchUnknown: "Sucursal origen",
  },

  invoiceStatus: {
    draft: "Borrador",
    stamping: "Timbrando",
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
    /** ADR-0081: prorrateo con algunas porciones ya facturadas. */
    partial: "Parcial",
    unavailable: "No disponible",
    /** ADR-0096: liquidación sin CFDI — no implica factura pendiente. */
    sinCfdi: "Sin CFDI",
  },

  refreshSuccess: "Lista actualizada",

  banner: {
    title: "Viajes con retraso",
    body: (count: number) =>
      `${count} viaje${count === 1 ? "" : "s"} En Ruta con la llegada programada vencida. Revísalos o márcalos como finalizados.`,
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
      "Elige un viaje elegible para generar la factura. Incluye flete y viajes en falso sin factura activa.",
    searchPlaceholder: "Buscar por código, origen o destino…",
    empty: "No hay viajes facturables en este momento.",
    loadError: "No se pudo cargar la lista de viajes.",
    selectAction: "Facturar",
    falseTripChip: "Viaje en falso",
    columns: {
      code: "Código",
      route: "Ruta",
      client: "Cliente",
      departure: "Salida",
      baseRate: "Tarifa base",
    },
  },

  /** Strip L1 — 4 pasos del job (D4). Visible solo dispatcher. */
  orientation: {
    title: "El trabajo del día",
    steps: [
      "Reservar el viaje",
      "Completar ruta y cargas en el detalle",
      "Confirmar la reserva",
      "Iniciar en Seguimiento",
    ],
    dismiss: "Entendido",
  },

  /** Alert L1b — dos colas. Visible solo accountant. */
  accountantOrientation: {
    title: "Dos colas distintas",
    body: "El primer CFDI está en Por facturar. Atención fiscal es otra cola: viajes ya facturados que operación pidió revisar. No sustituyes tú la factura.",
    invoiceableLink: "Ir a Por facturar",
    dismiss: "Entendido",
  },

  /** Alert L1a — recepción SAT. Visible solo manager. No reutilizar accountant. */
  managerOrientation: {
    title: "Cuando te piden cancelar o sustituir",
    body: "Facturación te deja el viaje en Atención fiscal. Abre la factura: tú sustituyes o cancelas. No es Por facturar.",
    dismiss: "Entendido",
  },

  /** Alert L1 — 2 tiempos. Visible solo operator. Key propia, no reutilizar hermanos. */
  operatorOrientation: {
    title: "Dónde cargar los gastos",
    body: "Abre el viaje y entra a Costos. Ahí usa Agregar de ruta o Agregar del operador.",
    dismiss: "Entendido",
  },

  /** Alert L1 — 3 tiempos. Visible solo driver. Falso fuera del Alert (D4). */
  driverOrientation: {
    title: "Tus viajes, en tres tiempos",
    body: "Abre un viaje Programado. En Seguimiento: Iniciar, registrar paradas y Completar.",
    dismiss: "Entendido",
  },

  /** Alert L1a — 2 tiempos. Visible solo client. Key propia, no reutilizar hermanos. */
  clientOrientation: {
    title: "Tus envíos y tus facturas",
    body: "Aquí ves el estado de tus envíos. Las facturas emitidas están en Mis facturas.",
    dismiss: "Entendido",
  },

  empty: {
    title: "No se encontraron viajes",
    titleClient: "No se encontraron envíos",
    titleDriver: "No se encontraron viajes",
    filteredDescription: "Prueba ajustando los filtros de búsqueda",
    noDataDescription: "Empieza reservando tu primer viaje",
    jobLead: "Así sale un viaje:",
    noDataDescriptionClient:
      "Cuando te asignen envíos, aparecerán aquí.",
    noDataDescriptionDriver:
      "Cuando te asignen viajes, aparecerán aquí.",
    noDataDescriptionOperator:
      "Aún no hay viajes. Cuando exista uno, ábrelo y entra a Costos.",
    overdueTitle: "No hay viajes con retraso",
    overdueDescription:
      "No hay viajes En Ruta con la llegada programada vencida en este momento.",
    fiscalAttentionManagerTitle: "Nada en Atención fiscal",
    fiscalAttentionManagerDescription:
      "No hay trámites pendientes. Si facturación no te pidió cancelar o sustituir, la cola vacía es correcta.",
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
    falseTripInsteadTitle:
      "Si el cliente canceló en sitio y vas a cobrar el viaje, no canceles.",
    falseTripInsteadBody:
      "Declara viaje en falso en Seguimiento. Cancelar deja el viaje como pérdida y no se factura.",
    falseTripInsteadCta: "Ir a Seguimiento",
  },

  entityLabelPlural: "viajes",
  entityLabelPluralClient: "envíos",
  entityLabelPluralDriver: "viajes",

  // ── Workbench (ADR-0090) ─────────────────────────────────────────
  workbench: {
    buckets: {
      draft: "Reservas",
      scheduled: "Programados",
      in_progress: "En Ruta",
      completed: "Completados",
      cancelled: "Cancelados",
      fiscalAttention: "Atención fiscal",
    },
    bucketDescriptions: {
      draft: "Pedidos anotados pendientes de programar",
      scheduled: "Viajes programados listos para iniciar",
      in_progress: "Viajes actualmente en ruta",
      completed: "Viajes finalizados exitosamente",
      /** Portal cliente: estados del envío, no patio (D7). */
      scheduledClient: "Envíos programados. Aún no salen.",
      inProgressClient: "Envíos en camino.",
      completedClient: "Envíos que ya llegaron.",
      cancelled: "Viajes cancelados",
      fiscalAttention:
        "Revisión o sustitución de factura. No es la cola Por facturar (primer CFDI).",
      /** Dispatcher: escala (D13), no sustituir. */
      fiscalAttentionEscalate:
        "Hay que avisar a facturación. No sustituyas tú la factura.",
      /** Contador: receptor de la escala, no patio (D8). */
      fiscalAttentionAccountant:
        "Ya hay CFDI. Abre la factura; no es Por facturar. El trámite SAT lo pide un gerente.",
      /** Gerente: tú ejecutas el trámite (D7). */
      fiscalAttentionManager:
        "Tú sustituyes o cancelas la factura. Abre el viaje y ejecuta el trámite. No es Por facturar.",
    },
    degradedMessage:
      "No se pudieron cargar los conteos del centro de trabajo. Puedes seguir usando la lista con filtros.",
    degradedLinkLabel: "Recargar",
    scorecardAriaLabel: "Etapas de viaje",
  },
} as const;
