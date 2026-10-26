const exportCopy = {
  exportCsv: "Exportar CSV",
  toasts: {
    exportedTitle: "Archivo exportado",
    profitability: "Muestra de viajes con su margen (CSV).",
    profitabilityTruncated: (exported: number, total: number) =>
      `Muestra de ${exported} de ${total} viajes (CSV).`,
    profitabilityGrouped: (groupLabel: string) =>
      `Rentabilidad por ${groupLabel.toLowerCase()} (CSV).`,
    performance: "Cifras mes a mes (CSV).",
    aging: "Antigüedad de saldos por cliente (CSV).",
    expenses: (groupLabel: string) =>
      `Gastos por ${groupLabel.toLowerCase()} (CSV).`,
  },
  files: {
    profitability: "finance-margen",
    /** Prefijo + slug de agrupación (cliente|ruta|unidad|operador). */
    profitabilityGroupedPrefix: "finance-rentabilidad",
    performance: "finance-mes-a-mes",
    aging: "finance-antiguedad",
    /** Prefijo + slug de agrupación (unidad|operador|cliente|ruta). */
    expensesPrefix: "finance-gastos",
  },
} as const;

const cobrosCopy = {
  receiverRfcLabel: "RFC del cliente",
  search: "Filtrar",
  retry: "Reintentar",
  loadErrorTitle: "No se pudo consultar",
  loadError: "No se pudieron cargar las facturas.",
  selectAllAria: "Seleccionar todas las facturas del mismo RFC en esta página",
  sameRfcOnlyHint:
    "Solo puedes registrar un cobro con facturas del mismo RFC. Filtra por RFC para reunir varias en esta página.",
  registerCta: (count: number, total: string) =>
    `Registrar cobro · ${count} factura${count === 1 ? "" : "s"} · ${total}`,
  selectedHint:
    "El lote es la selección de esta página. Se cobra el saldo completo de cada factura. Para una parcialidad, abre el detalle.",
  entityLabelPlural: "facturas",
  sheetTitle: "Confirmar cobro",
  sheetDescription:
    "Se registrará un cobro por el total de las facturas seleccionadas en esta página. Se aplica el por cobrar completo de cada una; no es un cobro parcial.",
  sheetTotal: "Total a cobrar",
  sheetClient: "Cliente",
  sheetPaymentDate: "Fecha del cobro",
  sheetPaymentDateRequired: "Indica la fecha del cobro.",
  sheetPaymentTime: "Hora",
  sheetPaymentTimeHint: "Si no indicas hora, se usa mediodía (12:00).",
  sheetPaymentLateRegistrationHint:
    "La fecha del cobro ya superó el 5.º día del mes siguiente. Puedes registrar el pago; sella el comprobante de pago cuanto antes.",
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
    `Cobro de ${total} registrado. El comprobante de pago (REP) se timbra en segundo plano.`,
  /**
   * CTA N=1 / N>1 hacia detalle de factura (#invoice-payments).
   * Shared by bandeja «Cobros de hoy» and excepciones REP (PRD opción E).
   */
  invoiceNav: {
    goToInvoice: "Ir a factura",
    viewInInvoice: "Ver en factura…",
    viewInInvoiceAria: "Ver el cobro en una factura del lote",
    pickerTitle: "Facturas de este cobro",
    pickerHint:
      "El comprobante de pago es uno; elige en qué factura abrirlo.",
    moreInvoices: (n: number) => `+${n} más`,
    openInvoice: (folio: string) => `Abrir factura ${folio}`,
  },
  todayTray: {
    title: "Cobros de hoy",
    description:
      "Progreso del comprobante de pago (REP) de cada cobro de esta sesión.",
    summary: (ready: number, inProgress: number, needsAction: number) =>
      `${ready} listo${ready === 1 ? "" : "s"} · ${inProgress} en proceso · ${needsAction} requieren atención`,
    stages: {
      queued: "Esperando turno",
      stamping: "Timbrando…",
      ready: "Comprobante timbrado",
      needs_action: "Requiere atención",
    },
    waitReasons: {
      pac_clock: "Esperando ventana de reloj del PAC…",
      quota: "Esperando cuota de timbrado…",
      blocked_by_prior: "Esperando un comprobante anterior…",
      retry_scheduled: "Reintento programado…",
      queued: "En cola de timbrado…",
      manual_review: "Revisión manual requerida",
    },
    openInvoice: (folio: string) => `Abrir factura ${folio}`,
    goToInvoice: "Ir a factura",
    retryStamp: "Reintentar timbrado",
    retrying: "Reencolando…",
    manualReviewHint:
      "Revise en el PAC antes de reintentar; no reintente a ciegas.",
    permanentErrorHint:
      "El PAC rechazó el comprobante de forma permanente; no reintente a ciegas.",
    permanentConfigErrorHint:
      "Revise el RFC emisor y el sello en Configuración → Datos para facturar; no reintente a ciegas.",
    goToBillingSettings: "Ir a Datos para facturar",
    orphanHint:
      "Hay un UUID de comprobante; revise en el PAC antes de actuar.",
    dismissTray: "Cerrar",
    dismissTrayAriaLabel: "Cerrar bandeja de cobros de hoy",
    viewExceptions: "Ver excepciones",
    dismissRowAriaLabel: (amount: string) => `Quitar cobro de ${amount} de la bandeja`,
    toastReadyTitle: "Comprobante de pago timbrado",
    toastReadyDescription: (amount: string) =>
      `El cobro de ${amount} ya tiene comprobante de pago (REP).`,
    toastNeedsActionTitle: "Comprobante de pago requiere atención",
    toastNeedsActionDescription: (amount: string) =>
      `Revisa el cobro de ${amount} en la bandeja o en Comprobantes por atender.`,
    toastRetrySuccess: "Timbrado reencolado",
    toastRetryError: "No se pudo reencolar el timbrado",
  },
  exceptions: {
    title: "Comprobantes por atender",
    description:
      "Pagos con comprobante de pago (REP) fallido, en reparación o con plazo por vencer. Revisa el motivo y la acción en cada fila.",
    emptyTitle: "Sin comprobantes por atender",
    empty: "No hay comprobantes de pago pendientes de timbrar para este alcance.",
    loadErrorTitle: "No se pudieron cargar los comprobantes",
    loadError: "Intenta de nuevo. Si persiste, abre el detalle de la factura.",
    retry: "Reintentar",
    retryStamp: "Reintentar timbrado",
    retrying: "Reencolando…",
    goToInvoice: "Ir a factura",
    reason: "Motivo",
    action: "Acción",
    manualReviewHint:
      "Revise en el PAC antes de reintentar; no reintente a ciegas.",
    permanentConfigErrorHint:
      "Revise el RFC emisor y el sello en Configuración → Datos para facturar; no reintente a ciegas.",
    goToBillingSettings: "Ir a Datos para facturar",
    orphanHint:
      "Hay un UUID de comprobante; revise en el PAC antes de actuar.",
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
      pending: "En cola de timbrado",
      failed: "Timbrado fallido",
      restamp_pending: "Reparando comprobante",
      cancelling: "Cancelando comprobante",
    },
    toastRetrySuccess: "Timbrado reencolado",
    toastRetryError: "No se pudo reencolar el timbrado",
  },
  workbench: {
    title: "Cobros",
    description:
      "Cola de cartera a crédito: registra depósitos por el mismo RFC (el lote es la página actual) y revisa comprobantes de pago pendientes.",
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
      "No se pudo cargar la cola de cobros. Consulta Facturas o la Cartera mientras tanto.",
    degradedLinkLabel: "Ir a facturas",
    relatedConfig: {
      label: "Ver cartera",
      description:
        "Indicadores de cobro y estado de cuenta por cliente.",
    },
  },
  toastError: "No se pudo registrar el cobro",
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
    hub: {
      title: "Cartera",
      description:
        "Quién te debe, antigüedad de saldos y estado de cuenta por cliente.",
      orientation:
        "El ciclo del dinero está arriba. Abajo están antigüedad y estado de cuenta.",
      /** Contador: Cartera es contexto de saldos; viajes a facturar van a Por facturar (D13). */
      orientationAccountant:
        "Aquí ves saldos y antigüedad. Los viajes pendientes de factura no entran por Cartera: usa Por facturar o Atención fiscal.",
      /** Gerente: Cartera = saldos; SAT/altas no entran (D15). */
      orientationManager:
        "Aquí ves saldos y antigüedad. El trámite SAT y las altas no entran por Cartera.",
      cycle: {
        ariaLabel: "Ciclo del dinero",
        invoiceable: {
          verb: "Emitir",
          label: "Por facturar",
          hint: "Viajes listos para generar CFDI.",
        },
        dispatch: {
          verb: "Enviar",
          label: "Envíos",
          hint: "Mandar facturas por correo.",
        },
        cobros: {
          verb: "Cobrar",
          label: "Cobros",
          hint: "Registrar un pago a crédito.",
        },
        approvals: {
          verb: "Aprobar",
          label: "Aprobaciones",
          hint: "Revisar solicitudes pendientes.",
        },
      },
    },
    portal: {
      title: "Mis facturas",
      subtitle: "Consulta las facturas de tus envíos.",
      invoicesTab: "Facturas",
    },
    /** Alert L1b — Borrador ≠ Facturado. Visible solo client. Key propia. */
    clientOrientation: {
      title: "Borrador no es Facturado",
      body: "Solo Facturado es el documento fiscal. Si ves Borrador, pide a tu oficina que lo emita.",
      dismiss: "Entendido",
    },
    sections: {
      summary: {
        title: "Cartera",
        subtitle: "Indicadores de cobro, antigüedad de saldos y estado de cuenta por cliente.",
      },
      cobros: {
        title: "Cobros",
        subtitle:
          "Cola de cartera a crédito y comprobantes de pago pendientes.",
      },
      analysis: {
        title: "Análisis",
        subtitle: "Rentabilidad, tendencia y gastos de tu operación.",
      },
      approvals: {
        title: "Aprobaciones",
        subtitle: "Bandeja centralizada de solicitudes pendientes de revisión.",
      },
    },
    analysisViews: {
      performance: "Mes a mes",
      margin: "Rentabilidad",
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
        "Por cobrar es el saldo pendiente. Abiertas son facturas PPD con saldo (cola Cobros). Pagado es facturado menos por cobrar.",
      collectAction: "Cobrar",
      collectActionAria: (clientName: string) =>
        `Cobrar a ${clientName}`,
      downloadPdfAction: "Descargar PDF",
      downloadPdfActionAria: (clientName: string) =>
        `Descargar estado de cuenta de ${clientName}`,
      downloadPdfError: "No se pudo descargar el estado de cuenta",
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
    errors: {
      summary: "Error al cargar resumen financiero",
      statement: "Error al cargar estado de cuenta",
      aging: "Error al cargar antigüedad de saldos",
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
      invoices: "Abiertas",
      actions: "Acciones",
    },
    charts: {
      agingBuckets: {
        title: "Antigüedad de saldos",
        description: "Por cobrar pendiente por rango de días vencidos",
        balanceLabel: "Por cobrar",
        footer: (totalReceivable: string) =>
          `Cartera total por antigüedad: ${totalReceivable}`,
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
      "Candidatos fiscales sin factura pendiente de emitir. Pueden incluir viajes Programados elegibles (pre-salida); «Facturar» aparece cuando la operación y los datos SAT lo permiten. Si falta ruta, cargas o el flete está prorrateado, abre el viaje.",
    /** Contador: receptor de la primera factura del viaje (D6). Elegibles desde Programado (D1). */
    descriptionAccountant:
      "Esta cola es la primera factura del viaje: el aviso «Pendiente de facturar» de operación. Puedes facturar desde Programado cuando el viaje es elegible; no hace falta esperar a Completado. Si te pidieron revisar una factura ya emitida, no es esta cola: ve a Viajes → Atención fiscal.",
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
      /** Contador, sin filtros: el vacío puede ser correcto (D6). */
      accountantTitle: "Nada por facturar",
      accountantDescription:
        "No hay un primer CFDI pendiente. Si operación avisó una revisión de factura ya emitida, esa cola es Viajes → Atención fiscal.",
      accountantFiscalAttentionCta: "Ir a Atención fiscal",
    },
    queuesAlert: {
      title: "Dos colas distintas",
      body: "Esta es el primer CFDI. Si te avisaron revisión de una factura ya emitida, ve a Atención fiscal.",
      fiscalAttentionLink: "Ir a Atención fiscal",
      dismiss: "Entendido",
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
        /** Contador: escala a operación, no «completa ruta» (D7). */
        blockedAccountant:
          "Pide a operación completar ruta, cargas o datos SAT. Tú no los completas desde aquí.",
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
        descriptionAccountant:
          "Después de timbrar: envía el XML/PDF y cobra. El historial de facturas emitidas está aquí.",
      },
    },
  },
  profitability: {
    scope: {
      label: "Alcance",
      operational: "Operativo",
      with_in_progress: "Con viajes En Ruta",
      pipeline: "Estimado (viajes por iniciar)",
      cancelled: "Cancelados",
      all: "Todos",
    },
    scopeHint: "Delimita qué viajes alimentan los totales y la tabla.",
    context: {
      projectedHint: "Ingreso estimado de viajes en Reserva y Programados.",
      cancellationLossHint:
        "Gastos aprobados de viajes cancelados (no incluye facturas canceladas).",
    },
    buckets: {
      realized: "Realizado",
      in_progress: "En Ruta",
      pipeline: "Estimado",
      cancellation_loss: "Cancelación",
    },
    metrics: {
      ariaLabel: "Totales del periodo",
      totalRevenue: "Ingreso",
      projectedRevenue: "Ingreso estimado",
      cancellationLoss: "Pérdida por cancelación",
      tripCount: "Viajes",
      /** Legacy (flag off / sin operational_*). */
      totalActual: "Gasto de viaje",
      totalActualHint: "Gastos de viaje aprobados",
      blendedMargin: "Margen",
      blendedMarginHint: "Ingreso menos gasto de viaje",
      /** ADR-0108 — base operativa. */
      operationalCost: "Costo operativo",
      operationalCostHint:
        "Gasto de viaje aprobado + comisión de liquidación autorizada",
      operationalMargin: "Margen operativo",
      operationalMarginHint: "Ingreso menos costo operativo",
      missingCommissionHint:
        "Algunos viajes aún no tienen comisión liquidada; el margen puede bajar al autorizar la liquidación.",
      shareOfRevenue: (pct: string) => `${pct} del ingreso`,
    },
    missingCommissionChip: "Sin comisión liquidada aún",
    lossCard: {
      title: "Viajes con pérdida",
      value: (loss: number, total: number) =>
        `${loss.toLocaleString("es-MX")} de ${total.toLocaleString("es-MX")}`,
      hint: "Al abrir un grupo de la tabla, puedes ver solo estos viajes.",
      none: "Ningún viaje con pérdida en este periodo.",
      activeHint:
        "Filtro activo: al abrir un grupo solo ves sus viajes con pérdida. Los totales no cambian.",
      apply: "Ver solo estos al abrir un grupo",
      remove: "Quitar filtro",
    },
    filters: {
      dimensionPlaceholder: "Agrupar por",
      chipScope: (value: string) =>
        `Alcance: ${financeCopy.profitability.scope[value as keyof typeof financeCopy.profitability.scope] ?? value}`,
      chipDimension: (value: string) =>
        `Agrupar por: ${financeCopy.profitability.filters.dimensions[value as keyof typeof financeCopy.profitability.filters.dimensions] ?? value}`,
      chipLossFilter: () => "Viajes del grupo: solo con pérdida",
      dimensions: {
        client: "Cliente",
        route: "Ruta",
        vehicle: "Unidad",
        driver: "Operador",
      },
    },
    table: {
      trip: "Viaje",
      client: "Cliente",
      revenue: "Ingreso",
      actualTotal: "Gasto de viaje",
      operationalCost: "Costo operativo",
      margin: "Margen",
      operationalMargin: "Margen operativo",
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
      title: "¿Quién te deja margen?",
      description:
        "Totales por cliente, ruta, unidad u operador, de mayor a menor margen operativo. Abre una fila para ver sus viajes; el código de viaje abre su detalle.",
      lossFilterNote: "Al abrir un grupo solo se muestran sus viajes con pérdida.",
      trips: "Viajes",
      revenue: "Ingreso",
      actualTotal: "Gasto de viaje",
      operationalCost: "Costo operativo",
      margin: "Margen",
      operationalMargin: "Margen operativo",
      marginPct: "Margen %",
    },
    masterDetail: {
      expandRow: "Ver viajes del grupo",
      collapseRow: "Ocultar viajes del grupo",
      detailEmpty: "Sin viajes en este grupo para los filtros actuales.",
      detailEmptyLoss: "Este grupo no tiene viajes con pérdida en el periodo.",
      viewTrip: (tripCode: string) => `Ver detalle del viaje ${tripCode}`,
    },
    empty: {
      periodTitle: (from: string, to: string) =>
        `Sin viajes completados entre ${from} y ${to}`,
      periodDescription:
        "Prueba con un periodo más amplio o revisa el mes a mes.",
      absoluteTitle: "Sin viajes completados en los últimos 12 meses",
      absoluteDescription:
        "Cuando completes viajes, aquí verás qué clientes, rutas, unidades y operadores te dejan margen.",
      pipelineTitle: "Sin viajes por iniciar en el periodo",
      pipelineDescription:
        "No hay viajes en Reserva ni Programados con salida en este periodo.",
      cancelledTitle: "Sin viajes cancelados en el periodo",
      cancelledDescription: "No hay viajes cancelados con salida en este periodo.",
      allTitle: "Sin viajes en el periodo",
      allDescription: "No hay viajes con salida en este periodo.",
      widenPeriod: "Ampliar a 12 meses",
      viewPerformance: "Ver mes a mes",
    },
    error: {
      title: "No se pudieron cargar las cifras",
      description: "Revisa tu conexión e intenta de nuevo.",
      retry: "Reintentar",
    },
    statuses: {
      high: "Alta",
      medium: "Media",
      low: "Baja",
      breakeven: "Equilibrio",
      loss: "Pérdida",
    },
    exportMenu: {
      trigger: "Exportar CSV",
      grouped: (groupLabel: string) =>
        `Tabla por ${groupLabel.toLowerCase()} del periodo`,
      trips: (limit: number) => `Muestra de viajes (máx. ${limit})`,
    },
  },
  /** Periodo compartido por Rentabilidad y Gastos. */
  analysisPeriod: {
    label: "Periodo",
    options: {
      this_month: "Este mes",
      last_3: "Últimos 3 meses",
      last_6: "Últimos 6 meses",
      last_12: "Últimos 12 meses",
      custom: "Personalizado",
    },
    customHeading: "Rango de fechas",
    customPlaceholder: "Elegir fechas",
    caption: (rangeLabel: string, detail?: string) =>
      detail ? `Periodo: ${rangeLabel} · ${detail}` : `Periodo: ${rangeLabel}`,
    completedMonths: (months: number) =>
      `${months} ${months === 1 ? "mes completo" : "meses completos"}`,
    currentMonth: "mes en curso",
    rangeLabel: (from: string, to: string) =>
      from === to ? from : `${from} a ${to}`,
    since: (from: string) => `desde ${from}`,
    until: (to: string) => `hasta ${to}`,
  },
  expenses: {
    alert: {
      summary:
        "Solo gasto de viaje aprobado. La comisión de liquidación está en Rentabilidad y Mes a mes.",
      includesShow: "¿Qué incluye esta vista?",
      includesHide: "Ocultar detalle",
      body: "Se incluyen conceptos de gasto del viaje ya aprobados. Los pendientes aparecen cuando un gerente o administrador los aprueba en el detalle del viaje. No incluye comisión de liquidación, sueldo ni anticipos.",
      bodyRoutePrefix: "Registra conceptos en",
      bodyRouteLink: "Viajes → detalle → Costos",
      bodyRouteSuffix:
        ". La tarifa base y los costos presupuestados no alimentan este análisis.",
      goToTrips: "Ir a Viajes",
      goToProfitability: "Ver rentabilidad",
    },
    error: {
      title: "No se pudieron cargar los gastos",
      description: "Revisa tu conexión e intenta de nuevo.",
      retry: "Reintentar",
    },
    metrics: {
      totalExpense: "Gasto de viaje del periodo (rango)",
      totalExpenseHint: "Suma de todos los tramos del rango elegido",
      topConcentration: {
        title: "Mayor concentración",
        empty: "Sin agrupación con gasto",
        subtitle: (dimensionLabel: string) => `Por ${dimensionLabel}`,
      },
    },
    filters: {
      granularity: "Resolución del gráfico",
      granularityValues: {
        day: "Día",
        week: "Semana",
        month: "Mes",
      },
      chipGranularity: (value: string) =>
        `Resolución: ${financeCopy.expenses.filters.granularityValues[value as keyof typeof financeCopy.expenses.filters.granularityValues] ?? value}`,
      chipDimension: (value: string) =>
        `Agrupar por: ${financeCopy.expenses.filters.dimensionValues[value as keyof typeof financeCopy.expenses.filters.dimensionValues] ?? value}`,
      chipVehicle: "Unidad seleccionada",
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
      title: "¿Dónde se concentra el gasto de viaje?",
      description:
        "Totales y promedio por viaje según la agrupación (solo gastos de viaje aprobados). La resolución del gráfico no cambia esta tabla.",
      category: "Concepto",
      amount: "Monto",
      dimensionTripCount: "Viajes",
      totalExpense: "Gasto de viaje",
      avgExpensePerTrip: "Promedio por viaje",
      viewVehicle: (label: string) => `Ver detalle de la unidad ${label}`,
      viewDriver: (label: string) => `Ver detalle del operador ${label}`,
      viewClient: (label: string) => `Ver detalle del cliente ${label}`,
      dimensionColumn: {
        vehicle: "Unidad",
        driver: "Operador",
        client: "Cliente",
        route: "Ruta",
      },
    },
    empty: {
      title: "Sin gasto de viaje en el periodo",
      description:
        "No hay gastos de viaje aprobados para los filtros actuales. Amplía el periodo o revisa la tendencia en Mes a mes.",
      widenPeriod: "Ampliar a 12 meses",
      viewPerformance: "Ver mes a mes",
    },
    charts: {
      empty: {
        title: "Sin datos para graficar",
      },
      timeSeries: {
        title: "Cómo cambian los conceptos",
        description: "Evolución del gasto de viaje aprobado en el tiempo",
        ariaLabel:
          "Gráfico de barras apiladas: gastos por concepto en el tiempo",
        footer: (periodCount: number, categoryCount: number) =>
          `${periodCount} tramo(s) · ${categoryCount} concepto(s)`,
      },
      latestPeriod: {
        title: (periodLabel: string) =>
          periodLabel
            ? `En qué se fue el gasto de viaje — último tramo (${periodLabel})`
            : "En qué se fue el gasto de viaje — último tramo",
        description:
          "Distribución por concepto del último tramo del rango (no es el total del periodo)",
        ariaLabel: "Gráfico de dona: composición de gastos del tramo",
        centerLabel: "Total",
        footer: (referencePeriod: string) => referencePeriod,
        emptyDescription:
          "No hay gasto de viaje aprobado en este tramo del rango.",
      },
    },
    exportCsv: "Exportar listado (CSV)",
  },
  performance: {
    controls: {
      monthsAriaLabel: "Meses a mostrar",
      monthsOption: (months: number) => `${months} meses`,
      compareLabel: "Comparar con año anterior",
    },
    scopeNote:
      "Solo viajes completados, contados en el mes de su salida programada.",
    scopeNoteDetail:
      "Ingreso: lo facturado o, si aún no se factura, la tarifa del viaje. Costo operativo: gasto de viaje aprobado + comisión de liquidación autorizada, en ese mismo mes. El personal de periodo va aparte y no se resta del costo de viajes. La vista Gastos cuenta cada gasto de viaje en la fecha en que se hizo.",
    scopeIncludesShow: "¿Qué incluye?",
    scopeIncludesHide: "Ocultar",
    operationalCostLegend:
      "Costo operativo = gasto de viaje aprobado + comisión de liquidación autorizada.",
    noPreviousData: (rangeLabel: string) =>
      `Aún no hay datos de ${rangeLabel} para comparar.`,
    rangeLabel: (from: string, to: string) =>
      from === to ? from : `${from} a ${to}`,
    periodNote: {
      completed: (rangeLabel: string, months: number) =>
        `Totales de ${rangeLabel} · ${months} ${months === 1 ? "mes completo" : "meses completos"}.`,
      inProgress: (month: string) =>
        ` ${month} va en curso y se suma al terminar el mes.`,
      inProgressOnly: (month: string) =>
        `${month} (en curso) · aún no hay meses completos para sumar ni comparar.`,
    },
    operationalNote:
      "Cifras de la operación para decidir tarifas y flota. No son P&L contable, caja ni declaraciones.",
    kpis: {
      ariaLabel: "Totales del rango",
      revenue: "Ingreso",
      cost: "Costo operativo",
      /** Legacy cuando la base no es operativa. */
      costLegacy: "Gasto de viaje",
      margin: "Margen operativo",
      marginLegacy: "Margen",
      personnelCost: "Costo de personal",
      personnelCostHint:
        "Sueldo, bonos y ajustes de liquidación sin viaje; no entra al costo operativo",
      shareOfRevenue: (pct: string) => `${pct} del ingreso`,
      tripCount: (count: number) =>
        `${count.toLocaleString("es-MX")} viaje${count === 1 ? "" : "s"} completado${count === 1 ? "" : "s"}`,
      versusPrevious: (amount: string) => `vs ${amount} año anterior`,
      previousMarginPct: (pct: string) => `Margen del año anterior: ${pct}`,
      provisionalNote:
        "Hay meses provisionales en el total: el margen puede bajar cuando terminen viajes o se aprueben gastos.",
    },
    provisional: {
      chip: "Provisional",
      hint: "Puede bajar",
      chipTooltip: (month: string) =>
        `${month} todavía puede cambiar: hay viajes sin terminar o gastos sin aprobar.`,
      countsLine: (incompleteTripCount: number, tripsWithPendingExpenses: number) => {
        const parts: string[] = [];
        if (incompleteTripCount > 0) {
          parts.push(
            `${incompleteTripCount.toLocaleString("es-MX")} viaje${
              incompleteTripCount === 1 ? "" : "s"
            } sin terminar`,
          );
        }
        if (tripsWithPendingExpenses > 0) {
          parts.push(
            `${tripsWithPendingExpenses.toLocaleString("es-MX")} con gastos sin aprobar`,
          );
        }
        return parts.join(" · ");
      },
      chartFooter:
        "Hay meses cerrados aún provisionales: el margen de esos meses puede bajar.",
      ariaLabel: "Mes provisional: todavía puede cambiar",
    },
    variation: {
      new: "Nuevo",
      none: "—",
      upAria: "subió",
      downAria: "bajó",
      flatAria: "sin cambio",
    },
    chart: {
      title: "Ingreso, costo operativo y margen mes a mes",
      description:
        "Ingreso y costo operativo de cada mes; abajo, el margen operativo como % del ingreso.",
      descriptionCompare:
        "Barras sólidas: este periodo. Barras claras: el mismo mes del año anterior.",
      ariaLabel:
        "Gráficas mensuales: barras de ingreso y costo operativo, y línea de margen operativo como porcentaje del ingreso",
      amountsLegendAriaLabel: "Leyenda de ingreso y costo operativo",
      marginHeading: "Margen operativo % por mes",
      marginLegendAriaLabel: "Leyenda de margen operativo %",
      inProgressSuffix: "(en curso)",
      inProgressNote: (month: string) =>
        `${month} sigue en curso: sus cifras pueden subir mientras se completan viajes y se aprueban gastos. No se suma a los totales ni se compara con el año anterior hasta que termine.`,
      legend: {
        revenue: "Ingreso",
        cost: "Costo operativo",
        marginPct: "Margen operativo %",
        previousSuffix: "año anterior",
      },
    },
    tooltip: {
      metric: "Concepto",
      delta: "Diferencia",
      revenue: "Ingreso",
      cost: "Costo operativo",
      margin: "Margen operativo",
      marginPct: "Margen operativo %",
      personnelCost: "Costo de personal",
      inProgressNote: (previousMonth: string) =>
        `Se compara con ${previousMonth} cuando termine el mes.`,
      provisionalNote: (month: string) =>
        `${month} todavía puede cambiar: hay viajes sin terminar o gastos sin aprobar.`,
    },
    table: {
      title: "¿Cuánto gané cada mes?",
      description:
        "Montos exactos de cada mes. El último mes va en curso. Abre un mes para ver su rentabilidad por cliente, ruta, unidad u operador. El costo de personal va en columna aparte.",
      inProgressComparison: "Se compara cuando termine el mes",
      openMonthAria: (month: string) => `Ver rentabilidad de ${month}`,
      month: "Mes",
      revenue: "Ingreso",
      cost: "Costo operativo",
      margin: "Margen operativo",
      marginPct: "Margen %",
      personnelCost: "Costo de personal",
      trips: "Viajes",
      deltaRevenue: "Ingreso vs año ant.",
      deltaCost: "Costo vs año ant.",
      deltaMargin: "Margen vs año ant.",
    },
    empty: {
      title: "Sin viajes completados en el rango",
      description:
        "Cuando completes viajes, aquí verás ingreso, costo operativo y margen de cada mes.",
    },
    error: {
      title: "No se pudieron cargar las cifras",
      description: "Revisa tu conexión e intenta de nuevo.",
      retry: "Reintentar",
    },
    exportCsv: "Exportar CSV",
    csv: {
      month: "mes",
      status: "estado",
      statusCompleted: "completo",
      statusInProgress: "en_curso",
      revenue: "ingreso",
      cost: "costo_operativo",
      margin: "margen_operativo",
      marginPct: "margen_pct",
      personnelCost: "costo_personal",
      trips: "viajes",
      provisional: "provisional",
      incompleteTrips: "viajes_sin_terminar",
      tripsWithPendingExpenses: "viajes_con_gastos_pendientes",
      provisionalYes: "si",
      provisionalNo: "no",
      previousSuffix: "_anio_anterior",
      revenueVariationPct: "variacion_ingreso_pct",
      costVariationPct: "variacion_costo_pct",
      marginVariationPct: "variacion_margen_pct",
      newValue: "nuevo",
    },
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
