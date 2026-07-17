export const financeCopy = {
  page: {
    title: "Finanzas",
    subtitle: "Cobranza, rentabilidad real, analisis de gastos y reporteria.",
    backHref: "/dashboard",
    backLabel: "Volver al dashboard",
    tabs: {
      summary: "Resumen",
      invoices: "Facturas",
      cobranza: "Cobranza",
      profitability: "Rentabilidad",
      expenses: "Gastos",
      reports: "Reportes",
    },
    clearFilters: "Limpiar filtros",
  },
  cobranza: {
    hero: {
      badge: "Cobranza PPD",
      secondaryBadge: "REP en segundo plano",
      title: "Registra cobros multi-factura sin perder la cadena REP",
      description:
        "Busca las facturas PPD abiertas de un receptor, selecciona las que cubre el pago y registra el cobro en una sola operación. Si el pago altera parcialidades ya timbradas, el sistema te pedirá confirmar la reparación.",
      stepPrefix: (step: number) => `Paso ${step}`,
      steps: [
        {
          title: "Busca por RFC",
          description: "Ubica solo la cartera PPD abierta de ese receptor.",
        },
        {
          title: "Selecciona saldos",
          description: "Agrupa una o varias facturas que cubre el mismo cobro.",
        },
        {
          title: "Registra y timbra",
          description: "El pago queda aplicado y el REP se timbra en segundo plano.",
        },
      ],
    },
    searchCard: {
      title: "Buscar cartera del receptor",
      description:
        "Captura el RFC para consultar facturas PPD timbradas con saldo pendiente.",
    },
    receiverRfcLabel: "RFC receptor",
    search: "Buscar facturas PPD",
    loadingTitle: "Consultando cartera",
    loading: "Cargando facturas abiertas…",
    loadErrorTitle: "No se pudo consultar la cartera",
    loadError: "No se pudieron cargar las facturas.",
    emptyTitle: "Sin facturas abiertas",
    empty: "No hay facturas PPD abiertas para este RFC.",
    initialState: {
      title: "Empieza con el RFC del receptor",
      description:
        "Cobranza trabaja sobre facturas PPD abiertas. Después de buscar, podrás seleccionar saldos y registrar el cobro multi-factura.",
    },
    metrics: {
      openInvoices: "Facturas abiertas",
      openBalance: "Saldo abierto",
      selectedInvoices: "Seleccionadas",
      selectedTotal: "Total a cobrar",
      forRfc: (rfc: string) => `RFC ${rfc}`,
      pendingPpd: "PPD con saldo pendiente",
      readyToApply: "Listas para aplicar pago",
      repHint: "Base para el REP",
    },
    tableTitle: "Facturas PPD abiertas",
    tableDescription:
      "Selecciona las facturas que cubre el mismo pago. El sistema aplicará el saldo total de cada documento seleccionado.",
    tableBadge: (count: number) => `${count} factura${count === 1 ? "" : "s"}`,
    register: "Registrar cobro",
    sheetTitle: "Confirmar cobro multi-factura",
    sheetDescription:
      "Se registrará un pago por el total seleccionado y se asignará a las facturas listadas.",
    sheetTotal: "Total a cobrar",
    sheetInvoicesTitle: "Facturas incluidas",
    sheetNoticeTitle: "Timbrado REP",
    sheetNoticeDescription:
      "El complemento de pago se timbra en segundo plano. Si la cadena de parcialidades requiere reparación, confirma el ajuste cuando el sistema lo solicite.",
    chainRepair: {
      title: "Reparar cadena de parcialidades",
      description:
        "Este pago altera el orden de parcialidades REP ya timbradas. Se cancelarán y volverán a timbrar los complementos afectados.",
      confirm: "Confirmar y registrar",
      cancel: "Volver",
    },
    confirm: "Confirmar y registrar",
    cancel: "Cancelar",
    submitting: "Guardando…",
    toastSuccess: "Cobro registrado; el REP se timbrará en segundo plano.",
    toastError: "No se pudo registrar el cobro",
    selectedSummary: (count: number, total: string) =>
      `${count} factura${count === 1 ? "" : "s"} seleccionada${count === 1 ? "" : "s"} · Total ${total}`,
    selectedHint:
      "El cobro aplicará el saldo completo de cada factura seleccionada.",
    selectInvoice: (folio: string) => `Seleccionar factura ${folio}`,
    columns: {
      invoice: "Factura",
      client: "Cliente",
      issuedAt: "Emisión",
      total: "Total",
      balance: "Saldo",
    },
  },
  summary: {
    sections: {
      indicators: "Indicadores financieros",
      visualizations: "Visualizaciones",
      accountStatement: "Estado de cuenta por cliente",
    },
    accountStatement: {
      description:
        "Saldos consolidados por cliente con facturación timbrada y pagos registrados.",
    },
    dsoTitle: "DSO (30 dias)",
    daysSuffix: "dias",
    agingBuckets: {
      "0-30": "0-30 dias",
      "31-60": "31-60 dias",
      "61-90": "61-90 dias",
      "90+": "90+ dias",
    },
    invoicesCountLabel: (count: number) => `${count} facturas`,
    errors: {
      summary: "Error al cargar resumen financiero",
      statement: "Error al cargar estado de cuenta",
      aging: "Error al cargar aging",
      incomeByMonth: "Error al cargar ingresos por mes",
      invoicesByStatusMonth: "Error al cargar facturas por estado y mes",
    },
    empty: {
      title: "Sin datos de cobranza",
      description:
        "Aun no hay facturas timbradas con saldo para mostrar por cliente.",
    },
    table: {
      client: "Cliente",
      rfc: "RFC",
      invoiced: "Facturado",
      paid: "Pagado",
      balance: "Saldo",
      overdue: "Vencido",
      invoices: "Facturas",
    },
    charts: {
      empty: {
        title: "Sin datos para graficar",
      },
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
      agingBuckets: {
        title: "Aging de cobranza",
        description: "Saldo pendiente por bucket de vencimiento",
        balanceLabel: "Saldo",
        footer: (totalReceivable: string) =>
          `Cartera total en aging: ${totalReceivable}`,
      },
      incomeByMonth: {
        title: "Ingresos cobrados por mes",
        description: "Pagos registrados en los ultimos meses",
        footer: (latestCollected: string) =>
          `Ultimo mes registrado: ${latestCollected}`,
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
      withFilters: "No hay resultados con los filtros actuales. Prueba otro criterio o limpia los filtros.",
      clearFilters: "Limpiar filtros",
    },
    entityLabelPlural: "facturas",
    kpi: {
      stamped: { label: "Timbradas", description: "facturas" },
      draft: { label: "Borradores", description: "facturas" },
      receivable: { label: "Por cobrar", description: "Saldo pendiente" },
      cancellationPending: { label: "Cancelación pendiente", description: "facturas" },
      cancelled: { label: "Canceladas", description: "facturas" },
    },
    statusLabels: {
      draft: "Borrador",
      stamped: "Timbrada",
      cancellation_pending: "Cancelación pendiente",
      cancelled: "Cancelada",
    },
    table: {
      folio: "Folio",
      client: "Cliente",
      date: "Fecha",
      method: "Método",
      total: "Total",
      balance: "Saldo",
      trips: "Viajes",
      status: "Estado",
      paid: "Pagado",
      empty: "No se encontraron facturas.",
    },
    fromTripCta: {
      label: "Facturar desde viaje",
      tooltip:
        "Abre el listado de viajes para generar CFDI desde un viaje con facturación disponible",
      emptyDescription:
        "Genera CFDI desde un viaje elegible en el módulo Viajes.",
      tripsPath: "/trips",
    },
    newInvoiceCta: {
      label: "Nueva factura",
      tooltip:
        "Selecciona un viaje facturable para generar un nuevo CFDI",
      emptyDescription:
        "Crea tu primera factura seleccionando un viaje facturable.",
    },
  },
  profitability: {
    scope: {
      label: "Alcance",
      operational: "Operativo",
      with_in_progress: "Con viajes en curso",
      pipeline: "Pipeline (proyectado)",
      cancelled: "Cancelados",
      all: "Todos",
    },
    context: {
      heading: "Fuera de operación · no incluido en el margen",
      projected: "Pipeline proyectado",
      projectedHint: "Ingreso estimado de viajes en borrador y programados.",
      cancellationLoss: "Pérdida por cancelaciones",
      cancellationLossHint:
        "Gastos aprobados de viajes cancelados (no incluye CFDI cancelados).",
      cancelledInvoiceRevenue: "Ingreso no reconocido (CFDI cancelado)",
      cancelledInvoiceRevenueHint:
        "Subtotales acumulados de facturas canceladas vinculadas a viajes.",
    },
    buckets: {
      realized: "Realizado",
      in_progress: "En curso",
      pipeline: "Pipeline",
      cancellation_loss: "Cancelación",
    },
    bucketBar: {
      title: "Composición financiera",
      description:
        "Distribución global de ingresos reconocidos, pipeline, gasto en curso y pérdidas por cancelación.",
      footer: "Los segmentos fuera de realizado no entran en el margen operativo.",
      emptyDescription: "No hay datos de composición financiera.",
    },
    barList: {
      title: "Top dimensiones",
      description: "Ranking de los cinco grupos con mayor métrica según el alcance activo.",
      emptyDescription: "No hay agregados para mostrar ranking.",
    },
    metrics: {
      totalRevenue: "Ingreso reconocido",
      totalRevenueHint: "Subtotal de factura timbrada o tarifa base del viaje (sin IVA).",
      projectedRevenue: "Ingreso proyectado",
      cancellationLoss: "Pérdida por cancelación",
      tripCount: "Viajes",
      totalActual: "Gasto real total",
      blendedMargin: "Margen blended",
      blendedMarginPct: "Margen %",
      tripSample: {
        title: "Viajes en muestra",
        subtitle: "Top 20 por margen % con filtros actuales",
      },
    },
    filters: {
      statusPlaceholder: "Filtrar por rentabilidad",
      allStatuses: "Todas",
      dimensionPlaceholder: "Dimension de agregado",
      chipScope: (value: string) =>
        `Alcance: ${financeCopy.profitability.scope[value as keyof typeof financeCopy.profitability.scope] ?? value}`,
      chipDimension: (value: string) =>
        `Dimension: ${financeCopy.profitability.filters.dimensions[value as keyof typeof financeCopy.profitability.filters.dimensions] ?? value}`,
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
      projected: "Proyectado",
      bucket: "Bucket",
      status: "Estado",
      noClient: "Sin cliente",
      revenueSourceInvoice: "Facturado (subtotal)",
      revenueSourceBaseRate: "Tarifa base",
      cancelledInvoiceRevenue: (amount: string) => `CFDI cancelado: ${amount}`,
    },
    aggregateTable: {
      title: "Rentabilidad por dimension",
      description:
        "Agregados por cliente, unidad, operador, ruta o mes. Expanda una fila para ver viajes del grupo; el codigo de viaje abre su detalle.",
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
      title: "Sin viajes para rentabilidad",
      description: "No hay viajes que cumplan los filtros actuales.",
    },
    statuses: {
      high: "Alta",
      medium: "Media",
      low: "Baja",
      breakeven: "Equilibrio",
      loss: "Perdida",
    },
    charts: {
      empty: {
        title: "Sin datos para graficar",
      },
      monthlyTrend: {
        title: "Ingreso vs gasto real por mes",
        description: "Tendencia mensual de rentabilidad agregada",
        comboDescription:
          "Barras: ingreso y gasto. Línea: margen % (solo viajes realizados).",
        footer: (monthCount: number) =>
          monthCount > 0
            ? `${monthCount} mes(es) en la serie`
            : "Sin meses con datos de rentabilidad",
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
  },
  expenses: {
    alert: {
      title: "Solo gastos aprobados",
      body:
        "Este reporte agrupa conceptos de costos y gastos del viaje (tab Costos) con estado Aprobado. Los pendientes no se incluyen hasta que un gerente o administrador los apruebe en el detalle del viaje.",
      bodyRoutePrefix: "Registre conceptos en",
      bodyRouteLink: "Viajes -> detalle -> Costos",
      bodyRouteSuffix:
        ". La tarifa base y los costos presupuestados del viaje no alimentan este tab.",
    },
    metrics: {
      currentPeriodExpense: "Gasto total del periodo actual",
      referencePeriod: "Periodo de referencia",
      activeCategories: {
        title: "Categorias con gasto",
        subtitle: "Conceptos aprobados en el periodo",
      },
      dimensionRows: {
        title: "Registros por dimension",
        subtitle: (dimensionLabel: string) => `Agrupado por ${dimensionLabel}`,
      },
    },
    filters: {
      granularity: "Granularidad",
      granularityValues: {
        day: "Diaria",
        week: "Semanal",
        month: "Mensual",
      },
      chipGranularity: (value: string) =>
        `Granularidad: ${financeCopy.expenses.filters.granularityValues[value as keyof typeof financeCopy.expenses.filters.granularityValues] ?? value}`,
      chipDimension: (value: string) =>
        `Dimension: ${financeCopy.expenses.filters.dimensionValues[value as keyof typeof financeCopy.expenses.filters.dimensionValues] ?? value}`,
      dimension: "Dimension",
      dimensionValues: {
        vehicle: "Unidad",
        driver: "Operador",
        client: "Cliente",
        route: "Ruta",
      },
    },
    table: {
      title: "Gasto por dimension",
      description:
        "Totales y promedios por viaje segun la dimension seleccionada (solo gastos aprobados).",
      category: "Categoria",
      amount: "Monto",
      dimensionTripCount: "Viajes",
      totalExpense: "Gasto total",
      avgExpensePerTrip: "Promedio por viaje",
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
        "No hay gastos aprobados para los filtros actuales. Revise que existan conceptos en Viajes -> Costos y que esten en estado Aprobado.",
    },
    charts: {
      empty: {
        title: "Sin datos para graficar",
      },
      timeSeries: {
        title: "Gastos por categoria en el tiempo",
        description: "Evolucion de gastos aprobados por periodo",
        footer: (periodCount: number, categoryCount: number) =>
          `${periodCount} periodo(s) · ${categoryCount} categoria(s)`,
      },
      latestPeriod: {
        title: "Composicion del periodo actual",
        description: "Distribucion por categoria en el ultimo periodo",
        centerLabel: "Total periodo",
        footer: (referencePeriod: string) => `Periodo: ${referencePeriod}`,
        emptyDescription:
          "No hay gastos aprobados en el ultimo periodo para este rango.",
      },
    },
  },
  reports: {
    cards: {
      profitability: {
        title: "Rentabilidad por viaje",
        description:
          "Exporta un snapshot de margen, ingreso y gasto real por viaje.",
      },
      aging: {
        title: "Aging de cobranza",
        description: "Exporta bucket de vencimiento por cliente para cobranza.",
      },
      expenses: {
        title: "Gastos por cliente",
        description:
          "Exporta gasto total y promedio por viaje agrupado por cliente.",
      },
      coverage: {
        title: "Cobertura de datos",
        descriptionPrefix: "Registros listos para exportacion en esta sesion:",
      },
    },
    actions: {
      exportCsv: "Exportar CSV",
    },
    toasts: {
      exportedTitle: "Reporte exportado",
      profitability: "Rentabilidad por viaje (CSV).",
      aging: "Aging por cliente (CSV).",
      expenses: "Gastos por dimension cliente (CSV).",
    },
    files: {
      profitability: "finance-profitability",
      aging: "finance-aging",
      expensesByClient: "finance-expenses-by-client",
    },
  },
  kpis: {
    totalReceivable: {
      title: "Por cobrar",
      description: "Facturas PPD con saldo pendiente",
    },
    collectedThisMonth: {
      title: "Cobrado este mes",
      description: "Pagos registrados en el mes actual",
    },
    totalOverdue: {
      title: "Vencido",
      description: "Facturas PPD con pago pendiente",
    },
    expensesThisMonth: {
      title: "Gastos del mes",
      description: "Gastos operativos registrados",
    },
  },
} as const;

