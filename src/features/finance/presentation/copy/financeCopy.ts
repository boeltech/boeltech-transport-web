const exportCopy = {
  exportCsv: "Exportar CSV",
  toasts: {
    exportedTitle: "Archivo exportado",
    profitability: "Margen por viaje (CSV).",
    profitabilityTruncated: (exported: number, total: number) =>
      `Muestra de ${exported} de ${total} viajes (CSV).`,
    aging: "Antigüedad de saldos por cliente (CSV).",
    expenses: (groupLabel: string) =>
      `Gastos por ${groupLabel.toLowerCase()} (CSV).`,
  },
  files: {
    profitability: "finance-margen",
    aging: "finance-antiguedad",
    /** Prefijo + slug de agrupación (unidad|operador|cliente|ruta). */
    expensesPrefix: "finance-gastos",
  },
} as const;

const cobrosCopy = {
  taskTitle: "Registrar un cobro",
  taskDescription:
    "Cola de cartera PPD con saldo. Elige facturas del mismo RFC que cubre el depósito. Aquí cada factura se cobra por el saldo completo. Un cobro parcial de una sola factura se registra en su detalle.",
  receiverRfcLabel: "RFC del cliente",
  rfcPlaceholder: "XAXX010101000",
  search: "Filtrar",
  changeRfc: "Cambiar RFC",
  rfcChip: (rfc: string) => `RFC ${rfc}`,
  summaryLink:
    "Si buscas un cliente concreto, ábrelo desde Resumen → estado de cuenta → Cobrar.",
  summaryLinkCta: "Ir a Resumen",
  retry: "Reintentar",
  loadErrorTitle: "No se pudo consultar",
  loadError: "No se pudieron cargar las facturas.",
  emptyTitle: "Sin facturas abiertas",
  empty: "No hay facturas a crédito con saldo pendiente en la cola.",
  emptyWithRfc: "No hay facturas a crédito con saldo pendiente para este RFC.",
  metrics: {
    openInvoices: "Facturas abiertas",
    openBalance: "Por cobrar",
    pendingCredit: "A crédito con saldo pendiente",
    thisPage: "En esta página",
  },
  tableTitle: "Facturas abiertas a crédito",
  tableDescription:
    "Selecciona facturas del mismo RFC que cubre el depósito. Se aplicará el por cobrar completo de cada una (no una parcialidad).",
  selectAllAria: "Seleccionar todas las facturas del mismo RFC en esta página",
  sameRfcOnlyHint:
    "Solo puedes registrar un cobro con facturas del mismo RFC.",
  register: "Registrar cobro",
  registerCta: (count: number, total: string) =>
    `Registrar cobro · ${count} factura${count === 1 ? "" : "s"} · ${total}`,
  selectedHint:
    "El cobro aplicará el por cobrar completo de cada factura seleccionada. Para una parcialidad, abre el detalle de esa factura.",
  entityLabelPlural: "facturas",
  sheetTitle: "Confirmar cobro",
  sheetDescription:
    "Se registrará un cobro por el total y se aplicará el por cobrar completo de cada factura. No es un cobro parcial.",
  sheetTotal: "Total a cobrar",
  sheetClient: "Cliente",
  sheetPaymentDate: "Fecha del cobro",
  sheetPaymentTime: "Hora",
  sheetPaymentTimeValue: "12:00",
  sheetPaymentForm: "Forma de pago",
  sheetInvoicesTitle: "Facturas incluidas",
  sheetBalanceFull: "Saldo completo",
  sheetNoticeTitle: "Comprobante de pago",
  sheetNoticeDescription:
    "El comprobante de pago se genera en segundo plano. Si hay que actualizar comprobantes anteriores, el sistema te pedirá confirmarlo.",
  sheetReference: "Referencia (opcional)",
  sheetReferencePlaceholder: "Número de transferencia…",
  confirm: (total: string) => `Registrar cobro de ${total}`,
  cancel: "Cancelar",
  submitting: "Guardando…",
  toastSuccessTitle: "Cobro registrado",
  toastSuccessDescription: (total: string) =>
    `Cobro de ${total} registrado. El comprobante de pago se genera en segundo plano.`,
  followThrough: {
    title: "Cobro registrado",
    description: (total: string) =>
      `Cobro de ${total}. Revisa el estado del comprobante y abre cada factura si hace falta.`,
    invoicesTitle: "Facturas del cobro",
    openInvoice: (folio: string) => `Abrir factura ${folio}`,
    repStatusLabel: "Comprobante de pago",
    hint: "Si el sello falla o se acerca el plazo, el cobro aparece abajo en Comprobantes por atender.",
    dismissAriaLabel: "Cerrar aviso de cobro registrado",
  },
  exceptions: {
    title: "Comprobantes por atender",
    description:
      "Pagos con comprobante pendiente, fallido, en reparación o con plazo por vencer. El reintento del sello se hace en el detalle de la factura.",
    emptyTitle: "Sin comprobantes por atender",
    empty: "No hay comprobantes de pago pendientes de sello para este alcance.",
    loadErrorTitle: "No se pudieron cargar los comprobantes",
    loadError: "Intenta de nuevo. Si persiste, abre el detalle de la factura.",
    retry: "Reintentar",
    entityLabelPlural: "comprobantes",
    openInvoice: (folio: string) => `Abrir factura ${folio}`,
    amount: "Importe",
    client: "Cliente",
    date: "Fecha del cobro",
    status: "Estado",
    deadline: "Plazo",
    invoices: "Facturas",
    deadlineOk: "En plazo",
    deadlineApproaching: "Por vencer",
    deadlineOverdue: "Plazo vencido",
    daysUntil: (days: number) =>
      days === 1 ? "1 día" : `${days} días`,
    daysOverdue: (days: number) =>
      days === 1 ? "vencido hace 1 día" : `vencido hace ${days} días`,
    statusLabels: {
      pending: "Pendiente de sello",
      failed: "Sello fallido",
      restamp_pending: "Reparando sello",
      cancelling: "Cancelando comprobante",
    },
  },
  workbench: {
    title: "Cobros",
    description:
      "Cola de cartera a crédito: registra depósitos por el mismo RFC y revisa comprobantes de pago pendientes.",
    bucketsAriaLabel: "Estado de cobranza",
    rfcFilterPlaceholder: "Filtrar por RFC…",
    rfcChipLabel: (rfc: string) => `RFC: ${rfc}`,
    buckets: {
      open: "Por cobrar",
      partial: "Pago parcial",
      rep_exceptions: "Excepciones REP",
    },
    bucketDescriptions: {
      open: "Facturas PPD abiertas con saldo pendiente",
      partial: "Con pagos registrados y saldo remanente",
      rep_exceptions: "Comprobantes por atender",
    },
    emptyByBucket: {
      open: {
        title: "Nada por cobrar",
        description:
          "No hay facturas a crédito con saldo pendiente en la cola actual.",
      },
      partial: {
        title: "Sin pagos parciales",
        description:
          "No hay facturas con pagos registrados y saldo remanente.",
      },
      rep_exceptions: {
        title: "Sin excepciones REP",
        description:
          "No hay comprobantes de pago pendientes de sello en este alcance.",
      },
    },
    emptyWithFilters: {
      title: "Sin resultados para este RFC",
      description:
        "No hay facturas abiertas para el RFC filtrado. Quita el filtro para ver la cola completa.",
      clearFilters: "Quitar filtro RFC",
    },
    degradedMessage:
      "No se pudo cargar la cola de cobros. Consulta Facturas o el Resumen mientras tanto.",
    degradedLinkLabel: "Ir a facturas",
    relatedConfig: {
      label: "Ver resumen de cartera",
      description:
        "Indicadores de cobro y estado de cuenta por cliente.",
    },
  },
  toastError: "No se pudo registrar el cobro",
  overlayErrorSeeInline: "Revisa el mensaje detallado en el diálogo.",
  chainRepair: {
    title: "Actualizar comprobantes de pago anteriores",
    description:
      "Este cobro cambia el orden de pagos ya sellados. Se cancelarán y volverán a sellar los comprobantes de pago afectados.",
    affectedTitle: "Comprobantes afectados",
    confirm: "Confirmar y registrar",
    cancel: "Volver",
  },
  selectInvoice: (folio: string) => `Seleccionar factura ${folio}`,
  selectInvoiceDisabled: (folio: string) =>
    `No seleccionable: factura ${folio} es de otro RFC`,
  columns: {
    invoice: "Factura",
    client: "Cliente",
    issuedAt: "Emisión",
    trips: "Viajes",
    total: "Total",
    balance: "Por cobrar",
  },
} as const;

export const financeCopy = {
  page: {
    title: "Finanzas",
    subtitle: "Cobros, facturas, margen y gastos del negocio.",
    portal: {
      title: "Mis facturas",
      subtitle: "Consulta las facturas de tus envíos.",
      invoicesTab: "Facturas",
    },
    sections: {
      summary: {
        title: "Resumen",
        subtitle: "Indicadores de cobro, antigüedad de saldos y estado de cuenta por cliente.",
      },
      cobros: {
        title: "Cobros",
        subtitle:
          "Cola de cartera a crédito y comprobantes de pago pendientes.",
      },
      analysis: {
        title: "Análisis",
        subtitle: "Margen por viaje y concentración de gastos operativos aprobados.",
      },
      approvals: {
        title: "Aprobaciones",
        subtitle: "Bandeja centralizada de solicitudes pendientes de revisión.",
      },
    },
    analysisViews: {
      margin: "Margen",
      expenses: "Gastos",
      ariaLabel: "Tipo de análisis",
    },
    clearFilters: "Limpiar filtros",
  },
  cobros: cobrosCopy,
  /** Alias de compatibilidad para imports existentes. */
  cobranza: cobrosCopy,
  summary: {
    sections: {
      indicators: "Indicadores",
      accountStatement: "Estado de cuenta por cliente",
    },
    accountStatement: {
      description:
        "Por cobrar es el pendiente de cartera (mismo criterio que Cobros y el detalle). Pagado es facturado menos por cobrar; en PUE liquidada coincide con el total.",
      collectAction: "Cobrar",
      collectActionAria: (clientName: string) =>
        `Cobrar a ${clientName}`,
    },
    dsoTitle: "Días promedio de cobro (30 días)",
    daysSuffix: "días",
    agingBuckets: {
      "0-30": "0–30 días",
      "31-60": "31–60 días",
      "61-90": "61–90 días",
      "90+": "Más de 90 días",
    },
    exportAging: "Exportar antigüedad (CSV)",
    invoicesCountLabel: (count: number) => `${count} facturas`,
    errors: {
      summary: "Error al cargar resumen financiero",
      statement: "Error al cargar estado de cuenta",
      aging: "Error al cargar antigüedad de saldos",
      incomeByMonth: "Error al cargar ingresos por mes",
      invoicesByStatusMonth: "Error al cargar facturas por estado y mes",
    },
    empty: {
      title: "Sin datos de cobro",
      description:
        "Aún no hay facturas emitidas con saldo para mostrar por cliente.",
    },
    table: {
      client: "Cliente",
      rfc: "RFC",
      invoiced: "Facturado",
      paid: "Pagado",
      balance: "Por cobrar",
      overdue: "Vencido",
      invoices: "Facturas",
      actions: "Acciones",
    },
    charts: {
      empty: {
        title: "Sin datos para graficar",
      },
      agingBuckets: {
        title: "Antigüedad de saldos",
        description: "Por cobrar pendiente por rango de días vencidos",
        balanceLabel: "Por cobrar",
        footer: (totalReceivable: string) =>
          `Cartera total por antigüedad: ${totalReceivable}`,
      },
      /** Conservado para charts legacy no montados en Resumen. */
      amounts: {
        title: "Cartera por cobrar",
        description: "Distribución de montos: por cobrar, cobrado y vencido",
        centerLabel: "Por cobrar",
        receivable: "Por cobrar",
        collected: "Cobrado este mes",
        overdue: "Vencido",
        emptyDescription: "No hay montos registrados en cartera para este periodo.",
        footer: (receivable: string, overdue: string) =>
          `Saldo por cobrar ${receivable} · Vencido ${overdue}`,
      },
      invoiceStatus: {
        title: "Facturas por estado",
        description: "Conteo de facturas en cada estatus del ciclo de vida",
        centerLabel: "Total facturas",
        emptyDescription: "No hay facturas registradas con los filtros actuales.",
      },
      incomeByMonth: {
        title: "Ingresos cobrados por mes",
        description: "Pagos registrados en los últimos meses",
        footer: (latestCollected: string) =>
          `Último mes registrado: ${latestCollected}`,
      },
      invoicesByStatusMonth: {
        title: "Facturas por estado y mes",
        description: "Conteo mensual de facturas por estatus",
        footer: (legend: string) => `Series: ${legend}`,
      },
    },
  },
  invoices: {
    title: "Facturas",
    searchPlaceholder: "Buscar por cliente, RFC o folio…",
    searchPlaceholderClient: "Buscar por folio…",
    filters: {
      statusPlaceholder: "Estado",
      all: "Todos los estados",
      chipLabel: (value: string) => `Estado: ${value}`,
    },
    toasts: {
      loadError: "Error al cargar facturas",
      refreshed: "Lista actualizada",
    },
    empty: {
      title: "No hay facturas",
      withFilters:
        "No hay resultados con los filtros actuales. Prueba otro criterio o limpia los filtros.",
      clearFilters: "Limpiar filtros",
      noDataClient: "Cuando haya facturas de tus envíos, aparecerán aquí.",
    },
    entityLabelPlural: "facturas",
    kpi: {
      stamped: { label: "Emitidas", description: "facturas" },
      draft: {
        label: "Borradores",
        description: "incluye en timbrado",
      },
      cancellationPending: {
        label: "Cancelación en proceso",
        description: "facturas",
      },
      cancelled: { label: "Canceladas", description: "facturas" },
    },
    /** Labels operativos staff (alineados al portal; D7). */
    statusLabels: {
      draft: "Borrador",
      stamping: "Timbrando…",
      stamped: "Emitida",
      cancellation_pending: "Cancelación en proceso",
      cancelled: "Cancelada",
    },
    /** Labels del portal client (consulta). */
    statusLabelsClient: {
      draft: "Borrador",
      stamping: "En proceso",
      stamped: "Facturado",
      cancellation_pending: "Cancelación en proceso",
      cancelled: "Cancelada",
    },
    table: {
      folio: "Folio",
      client: "Cliente",
      date: "Fecha",
      method: "Cómo se cobra",
      total: "Total",
      balance: "Por cobrar",
      settled: "Pagado",
      settledPue: "Liquidada",
      trips: "Viajes",
      tripsClient: "Envíos",
      dispatch: "Envío",
      status: "Estado",
      paid: "Pagado",
      empty: "No se encontraron facturas.",
    },
    fromTripCta: {
      label: "Facturar desde viaje",
      tooltip:
        "Abre el listado de viajes para generar una factura desde un viaje con facturación disponible",
      emptyDescription:
        "Genera una factura desde un viaje elegible en el módulo Viajes.",
    },
    newInvoiceCta: {
      label: "Nueva factura",
      tooltip: "Selecciona un viaje facturable para generar una nueva factura",
      emptyDescription:
        "Crea tu primera factura seleccionando un viaje facturable.",
    },
    workbench: {
      bucketsAriaLabel: "Estado de facturas",
      bucketDescriptions: {
        draft: "Pendientes de timbrar",
        stamping: "En proceso con el PAC",
        stamped: "Vigentes timbradas",
        cancellation_pending: "Esperando respuesta del SAT",
        cancelled: "Historial canceladas",
      },
      relatedConfig: {
        label: "Viajes por facturar",
        description: "Cola de candidatos fiscales sin factura emitida.",
      },
    },
  },
  invoiceable: {
    title: "Viajes por facturar",
    description:
      "Candidatos fiscales sin factura pendiente de emitir. «Facturar» aparece cuando la operación y los datos SAT lo permiten; si falta ruta, cargas o el flete está prorrateado, abre el viaje.",
    searchPlaceholder: "Buscar por folio de viaje, cliente o ruta…",
    entityLabelPlural: "viajes por facturar",
    invoiceAction: "Facturar",
    goToTripInvoicing: "Ir a facturación del viaje",
    noClient: "Sin cliente",
    table: {
      trip: "Viaje",
      client: "Cliente",
      route: "Ruta",
      departure: "Salida programada",
      baseRate: "Importe del viaje",
      empty: "No hay viajes por facturar.",
      falseTripChip: "Viaje en falso",
      splitShareChip: "Flete prorrateado",
      splitLegsProgress: (invoiced: number, total: number) =>
        `${invoiced} de ${total} porciones facturadas`,
    },
    empty: {
      title: "Nada por facturar",
      description:
        "No hay candidatos fiscales pendientes en la cola.",
      withFilters:
        "No hay resultados con la búsqueda actual. Prueba otro folio o cliente.",
      clearFilters: "Limpiar búsqueda",
    },
    loadError: "Error al cargar viajes por facturar",
    workbench: {
      bucketsAriaLabel: "Etapas de la cola de facturación",
      buckets: {
        ready: "Listos para facturar",
        proration_pending: "Prorrateo pendiente",
        blocked: "Bloqueados",
      },
      bucketDescriptions: {
        ready: "CTA Facturar disponible desde Finanzas",
        proration_pending:
          "Porciones de prorrateo listas para facturar en el viaje",
        blocked:
          "Completa ruta, cargas o datos SAT (incluye prorrateo aún no listo)",
      },
      emptyByBucket: {
        ready: {
          title: "Nada listo para facturar",
          description:
            "No hay viajes con todos los requisitos cumplidos en la cola actual.",
        },
        proration_pending: {
          title: "Sin prorrateos pendientes",
          description:
            "No hay viajes con flete prorrateado esperando porciones por facturar.",
        },
        blocked: {
          title: "Sin bloqueados",
          description:
            "No hay viajes bloqueados en la cola actual.",
        },
      },
      degradedMessage:
        "No se pudo cargar la cola de facturación. Consulta el registro de facturas mientras tanto.",
      degradedLinkLabel: "Ir a facturas",
      relatedConfig: {
        label: "Ver registro de facturas",
        description:
          "Historial completo de facturas emitidas y canceladas.",
      },
    },
  },
  profitability: {
    scope: {
      label: "Alcance",
      operational: "Operativo",
      with_in_progress: "Con viajes en curso",
      pipeline: "Estimado (viajes por iniciar)",
      cancelled: "Cancelados",
      all: "Todos",
    },
    context: {
      heading: "Fuera de operación · no incluido en el margen",
      projected: "Ingreso estimado",
      projectedHint: "Ingreso estimado de viajes en borrador y programados.",
      cancellationLoss: "Pérdida por cancelaciones",
      cancellationLossHint:
        "Gastos aprobados de viajes cancelados (no incluye facturas canceladas).",
      cancelledInvoiceRevenue: "Ingreso no reconocido (factura cancelada)",
      cancelledInvoiceRevenueHint:
        "Subtotales acumulados de facturas canceladas vinculadas a viajes.",
    },
    buckets: {
      realized: "Realizado",
      in_progress: "En curso",
      pipeline: "Estimado",
      cancellation_loss: "Cancelación",
    },
    bucketBar: {
      title: "Composición financiera",
      description:
        "Distribución global de ingresos reconocidos, estimado, gasto en curso y pérdidas por cancelación.",
      footer: "Los segmentos fuera de realizado no entran en el margen operativo.",
      emptyDescription: "No hay datos de composición financiera.",
    },
    barList: {
      title: "Top grupos",
      description:
        "Ranking de los cinco grupos con mayor métrica según el alcance activo.",
      emptyDescription: "No hay agregados para mostrar ranking.",
    },
    chartsSection: {
      title: "Gráficas",
      show: "Ver gráficas",
      hide: "Ocultar gráficas",
    },
    metrics: {
      totalRevenue: "Ingreso",
      totalRevenueHint:
        "Importe de factura emitida o tarifa del viaje (sin impuestos).",
      projectedRevenue: "Ingreso estimado",
      cancellationLoss: "Pérdida por cancelación",
      tripCount: "Viajes",
      totalActual: "Gasto real",
      blendedMargin: "Margen",
      blendedMarginHint: "Ingreso menos gasto real",
      blendedMarginPct: "Margen %",
      tripSample: {
        title: "Viajes en muestra",
        subtitle: "Top 20 por margen % con filtros actuales",
      },
    },
    filters: {
      statusPlaceholder: "Filtrar por rentabilidad",
      allStatuses: "Todas",
      dimensionPlaceholder: "Agrupar por",
      chipScope: (value: string) =>
        `Alcance: ${financeCopy.profitability.scope[value as keyof typeof financeCopy.profitability.scope] ?? value}`,
      chipDimension: (value: string) =>
        `Agrupar por: ${financeCopy.profitability.filters.dimensions[value as keyof typeof financeCopy.profitability.filters.dimensions] ?? value}`,
      chipStatus: (value: string) =>
        `Rentabilidad: ${financeCopy.profitability.statuses[value as keyof typeof financeCopy.profitability.statuses] ?? value}`,
      dimensions: {
        client: "Cliente",
        vehicle: "Unidad",
        driver: "Operador",
        route: "Ruta",
        month: "Mes",
      },
    },
    table: {
      trip: "Viaje",
      client: "Cliente",
      revenue: "Ingreso",
      actualTotal: "Gasto real",
      margin: "Margen",
      marginPct: "Margen %",
      projected: "Estimado",
      bucket: "Etapa",
      status: "Estado",
      noClient: "Sin cliente",
      revenueSourceInvoice: "Facturado (subtotal)",
      revenueSourceBaseRate: "Tarifa base",
      cancelledInvoiceRevenue: (amount: string) =>
        `Factura cancelada: ${amount}`,
    },
    aggregateTable: {
      title: "Margen por grupo",
      description:
        "Agregados por cliente, unidad, operador, ruta o mes. Expande una fila para ver viajes del grupo; el código de viaje abre su detalle.",
      trips: "Viajes",
      revenue: "Ingreso",
      actualTotal: "Gasto real",
      margin: "Margen",
      marginPct: "Margen %",
    },
    masterDetail: {
      expandRow: "Ver viajes del grupo",
      collapseRow: "Ocultar viajes del grupo",
      detailEmpty: "Sin viajes en este grupo para los filtros actuales.",
      viewTrip: (tripCode: string) => `Ver detalle del viaje ${tripCode}`,
    },
    empty: {
      title: "Sin viajes para margen",
      description: "No hay viajes que cumplan los filtros actuales.",
    },
    statuses: {
      high: "Alta",
      medium: "Media",
      low: "Baja",
      breakeven: "Equilibrio",
      loss: "Pérdida",
    },
    charts: {
      empty: {
        title: "Sin datos para graficar",
      },
      monthlyTrend: {
        title: "Ingreso vs gasto real por mes",
        description: "Tendencia mensual de margen agregado",
        comboDescription:
          "Barras: ingreso y gasto. Línea: margen % (solo viajes realizados).",
        footer: (monthCount: number) =>
          monthCount > 0
            ? `${monthCount} mes(es) en la serie`
            : "Sin meses con datos de margen",
        emptyDescription: "No hay agregados mensuales para mostrar.",
      },
      statusDistribution: {
        title: "Viajes por rentabilidad",
        description: "Conteo de viajes en cada banda de margen",
        centerLabel: "Total viajes",
        footer: (tripCount: number) => `${tripCount} viaje(s) en la muestra`,
        emptyDescription: "No hay viajes en la muestra para los filtros actuales.",
      },
    },
    exportCsv: "Exportar muestra (CSV)",
  },
  expenses: {
    alert: {
      summary:
        "Solo costos de viaje ya aprobados. Los pendientes no aparecen hasta la aprobación.",
      includesShow: "¿Qué incluye?",
      includesHide: "Ocultar detalle",
      body: "Se incluyen conceptos de costo del viaje ya aprobados. Los pendientes aparecen cuando un gerente o administrador los aprueba en el detalle del viaje.",
      bodyRoutePrefix: "Registra conceptos en",
      bodyRouteLink: "Viajes → detalle → Dinero del viaje",
      bodyRouteSuffix:
        ". La tarifa base y los costos presupuestados no alimentan este análisis.",
    },
    metrics: {
      totalExpense: "Gasto total",
      topConcentration: {
        title: "Mayor concentración",
        empty: "Sin agrupación con gasto",
        subtitle: (dimensionLabel: string) => `Por ${dimensionLabel}`,
      },
    },
    filters: {
      granularity: "Ver por",
      granularityValues: {
        day: "Día",
        week: "Semana",
        month: "Mes",
      },
      chipGranularity: (value: string) =>
        `Ver por: ${financeCopy.expenses.filters.granularityValues[value as keyof typeof financeCopy.expenses.filters.granularityValues] ?? value}`,
      chipDimension: (value: string) =>
        `Agrupar por: ${financeCopy.expenses.filters.dimensionValues[value as keyof typeof financeCopy.expenses.filters.dimensionValues] ?? value}`,
      chipFrom: (value: string) => `Desde: ${value}`,
      chipTo: (value: string) => `Hasta: ${value}`,
      chipVehicle: "Unidad seleccionada",
      dateRangeHeading: "Rango de fechas",
      dateRangePlaceholder: "Seleccionar fechas",
      dimension: "Agrupar por",
      dimensionValues: {
        vehicle: "Unidad",
        driver: "Operador",
        client: "Cliente",
        route: "Ruta",
      },
      exportFileSlug: {
        vehicle: "unidad",
        driver: "operador",
        client: "cliente",
        route: "ruta",
      },
    },
    table: {
      title: "¿Dónde se concentra el gasto?",
      description:
        "Totales y promedio por viaje según la agrupación (solo costos aprobados).",
      category: "Concepto",
      amount: "Monto",
      dimensionTripCount: "Viajes",
      totalExpense: "Gasto total",
      avgExpensePerTrip: "Promedio por viaje",
      viewVehicle: (label: string) => `Ver detalle de la unidad ${label}`,
      dimensionColumn: {
        vehicle: "Unidad",
        driver: "Operador",
        client: "Cliente",
        route: "Ruta",
      },
    },
    empty: {
      title: "Sin datos de gastos",
      description:
        "No hay costos aprobados para los filtros actuales. Revisa que existan conceptos en Viajes → Dinero del viaje y que estén aprobados.",
    },
    chartsSection: {
      show: "Ver tendencia y composición",
      hide: "Ocultar tendencia y composición",
    },
    charts: {
      empty: {
        title: "Sin datos para graficar",
      },
      timeSeries: {
        title: "Cómo cambian los conceptos",
        description: "Evolución de costos aprobados en el tiempo",
        footer: (periodCount: number, categoryCount: number) =>
          `${periodCount} tramo(s) · ${categoryCount} concepto(s)`,
      },
      latestPeriod: {
        title: (periodLabel: string) =>
          periodLabel
            ? `En qué se fue el gasto (${periodLabel})`
            : "En qué se fue el gasto",
        description: "Distribución por concepto",
        centerLabel: "Total",
        footer: (referencePeriod: string) => referencePeriod,
        emptyDescription:
          "No hay costos aprobados en este tramo del rango.",
      },
    },
    exportCsv: "Exportar listado (CSV)",
  },
  exports: exportCopy,
  paymentMethods: {
    ppd: "A crédito",
    pue: "De contado",
  },
  kpis: {
    totalReceivable: {
      title: "Por cobrar",
      description: "Total con saldo pendiente de cobro",
    },
    collectedThisMonth: {
      title: "Cobrado este mes",
      description: "Pagos registrados en el mes actual",
    },
    totalOverdue: {
      title: "Vencido",
      description: "Parte del saldo que ya pasó la fecha de pago",
    },
    expensesThisMonth: {
      title: "Gastos del mes",
      description: "Gastos operativos aprobados",
    },
  },
} as const;
