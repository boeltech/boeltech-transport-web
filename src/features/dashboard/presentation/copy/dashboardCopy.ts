export const dashboardCopy = {
  activation: {
    title: "Para tu primer viaje",
    titleDispatcher: "Estado de activación",
    titleAccountant: "Pista fiscal",
    description:
      "Completa estos pasos para poder reservar. Cada enlace abre el alta existente.",
    /** F3 — dispatcher mid-setup (ops empty). */
    descriptionDispatcherEmpty:
      "La empresa aún se está armando: faltan cliente, unidad o conductor. Cuando estén listos, podrás reservar.",
    /** F3 — dispatcher L1 ready to reserve. */
    descriptionDispatcherReady:
      "Ya hay cliente, unidad y conductor. Reserva el primer viaje cuando el patio esté listo.",
    /** F3 — dispatcher ops complete (first trip exists). */
    descriptionDispatcherComplete:
      "Operación lista: ya hay al menos un viaje. Sigue en Viajes.",
    descriptionAccountant:
      "RFC de la empresa y CSD/PAC para facturar. Solo lectura de progreso aquí.",
    /** F3 — accountant when ops ready and fiscal incomplete. */
    descriptionAccountantOpsReady:
      "Ya hay viaje o maestros listos. Completa la pista fiscal cuando puedas.",
    /** F3 — first-trip success (admin/manager). */
    successTitle: "Primer viaje listo",
    successBody:
      "Ya tienes operación en marcha. Sigue con facturación o invita al equipo cuando quieras.",
    successTripsCta: "Ir a Viajes",
    fiscalReadyHints: {
      missing_rfc: "Falta el RFC de la empresa para poder facturar.",
      missing_csd: "Falta configurar el CSD en Datos para facturar.",
      ready_for_config: "Completa los datos para facturar (CSD/PAC).",
      configured: "Pista fiscal configurada.",
    } as const,
    dismiss: "Continuar sin guía",
    doneBadge: "Listo",
    pendingBadge: "Pendiente",
    error: {
      title: "No se pudo cargar la guía de activación",
      retry: "Reintentar",
    },
    itemLabels: {
      client: "Alta de cliente",
      vehicle: "Alta de unidad",
      driver: "Alta de conductor",
      first_trip: "Reservar primer viaje",
      company_fiscal: "RFC de la empresa",
      csd_pac: "CSD / datos para facturar",
      invite_team: "Invitar al equipo",
    } as const,
    ctaLabels: {
      client: "Nuevo cliente",
      vehicle: "Nueva unidad",
      driver: "Nuevo conductor",
      first_trip: "Reservar viaje",
      company_fiscal: "Ir a empresa",
      csd_pac: "Ir a Datos para facturar",
      invite_team: "Invitar usuario",
    } as const,
    emptyGapDescription: {
      client: "Antes falta un cliente. Dalo de alta y vuelve a este listado.",
      vehicle: "Antes falta una unidad. Dala de alta y vuelve a este listado.",
      driver:
        "Antes falta un conductor. Dalo de alta y vuelve a este listado.",
      first_trip: "Reserva el primer viaje cuando los maestros estén listos.",
      company_fiscal: "Completa el RFC de la empresa en Configuración.",
      csd_pac: "Configura el CSD en Datos para facturar.",
      invite_team: "Invita a alguien del equipo en Usuarios.",
    } as const,
  },
  demoSeed: {
    offerTitle: "¿Quieres datos de ejemplo?",
    offerBody:
      "Carga un cliente, unidad y conductor de prueba para explorar. No los uses con clientes reales ni intentes timbrar: no son datos fiscales operables.",
    loadCta: "Cargar datos de ejemplo",
    startCleanCta: "Empezar limpio",
    loadSheetTitle: "Cargar datos de ejemplo",
    loadSheetDescription:
      "Se crearán maestros de demostración (y un viaje en borrador si aplica). Úsalos solo para practicar: no los compartas con clientes reales y no intentes timbrar.",
    loadConfirm: "Cargar ejemplo",
    loadCancel: "Cancelar",
    loadSuccess: "Datos de ejemplo cargados",
    loadBusy: "Cargando…",
    bannerTitle: "Datos de ejemplo",
    bannerBody:
      "Esta empresa tiene datos de demostración. No los uses con clientes reales ni intentes timbrar facturas con ellos.",
    bannerDismiss: "Ocultar",
    purgeCta: "Eliminar datos de ejemplo",
    purgeSheetTitle: "Eliminar datos de ejemplo",
    purgeSheetDescription:
      "Se borrarán solo las entidades sembradas como ejemplo. Esta acción no se puede deshacer. Escribe PURGE_DEMO para confirmar.",
    purgeConfirmLabel: "Confirmación",
    purgeConfirmPlaceholder: "PURGE_DEMO",
    purgeSubmit: "Eliminar datos de ejemplo",
    purgeCancel: "Cancelar",
    purgeSuccess: "Datos de ejemplo eliminados",
    purgeBusy: "Eliminando…",
    exampleBadge: "Ejemplo",
  },
  page: {
    /** Título corto cuando la banda matutina lleva el saludo (admin/manager). */
    titleShort: "Inicio",
    subtitle: "Operación, alertas y documentación del día",
    tripsBridge: "El trabajo del día está en Viajes.",
    tripsBridgeLink: "Ir a Viajes",
    /** Operador (D8): gastos del viaje; no reusa el puente del dispatcher. */
    subtitleOperator: "Casetas, combustible y extras se cargan en el viaje",
    tripsBridgeOperator:
      "Encuéntralos en Viajes; se cargan en Costos.",
    tripsBridgeOperatorLink: "Ir a Viajes",
    subtitleAccountant: "Facturación y cobro del día: primer CFDI y atención fiscal",
    invoiceableBridge: "Los viajes listos para factura están en Por facturar.",
    invoiceableBridgeLink: "Ir a Por facturar",
    subtitleManager:
      "Trámite SAT que te piden y altas que operación no pudo crear",
    fiscalAttentionBridge:
      "La escala de facturación entra por Atención fiscal.",
    fiscalAttentionBridgeLink: "Ir a Atención fiscal",
    /** Admin (D8): armar la empresa; no reusa el puente de Viajes. */
    subtitleAdmin: "Deja armada la empresa: usuarios y datos para facturar",
    usersBridge: "Suma gente y vínculos en Usuarios.",
    usersBridgeLink: "Ir a Usuarios",
    billingBridge: "El sello y la numeración están en Datos para facturar.",
    billingBridgeLink: "Ir a Datos para facturar",
    subtitleClient: "Consulta el estado de tus envíos y tus facturas",
    tripsBridgeClient: "Tus envíos están en Mis envíos.",
    tripsBridgeClientLink: "Ir a Mis envíos",
    invoicesBridgeClient: "Tus facturas están en Mis facturas.",
    invoicesBridgeClientLink: "Ir a Mis facturas",
    /** Conductor (D8): el trabajo está en Mis viajes; no reusa el puente staff. */
    subtitleDriver: "El trabajo está en Mis viajes",
    tripsBridgeDriver: "Tus viajes asignados están en Mis viajes.",
    tripsBridgeDriverLink: "Ir a Mis viajes",
    refresh: "Actualizar",
    orientationDismiss: "Entendido",
    /** CTAs de job en toolbar (D1) — no confundir con Personalizar/Actualizar. */
    jobActions: {
      pendingApprovals: "Por autorizar",
      viewAlerts: "Ver alertas",
      tripsToday: "Viajes de hoy",
      trips: "Ir a Viajes",
      invoiceable: "Ir a Por facturar",
      fiscalAttention: "Ir a Atención fiscal",
    },
    error: {
      title: "No se pudieron cargar los datos del dashboard.",
      retry: "Reintentar",
    },
  },
  customize: {
    title: "Personalizar Inicio",
    description:
      "Muestra u oculta bloques de Inicio y arrastra para cambiar el orden. Solo verás widgets permitidos por tu rol.",
    personalizeButton: "Personalizar",
    hiddenWidgetsCount: (count: number) =>
      `${count} oculto${count === 1 ? "" : "s"}`,
    visibleLabel: "Visible",
    resetRole: "Restaurar predeterminado del rol",
    resetSystem: "Restaurar predeterminado del sistema",
    done: "Listo",
    roleSettingsTitle: "Widgets de Inicio",
    roleSettingsDescription:
      "Elige un rol, edita sus widgets y cierra con Listo. Los cambios se guardan al instante; cada usuario puede personalizar después.",
    selectRole: "Rol a configurar",
    roleSettingsSteps:
      "1. Elige el rol · 2. Edita los widgets · 3. Cierra con Listo",
    /** CTA que abre el sheet de edición (no es un submit separado). */
    editRoleLayout: "Editar widgets del rol",
    /** @deprecated Preferir editRoleLayout */
    saveRoleLayout: "Editar widgets del rol",
  },
  scorecard: {
    /** Cluster Aurora: hero Margen (+ $/viaje) | stack Cobrado·Por cobrar·Vencido. */
    title: "Resumen del mes",
    description: "Margen e ingreso por viaje a la izquierda; cobranza a la derecha.",
    ariaLabel: "Resumen financiero del mes",
    /** Suffix beside the MoM delta badge (Aurora scorecard). */
    vsPreviousMonth: "vs mes anterior",
    margin: {
      title: "Margen operativo",
      subtitle: "Completados · tarifa · costos aprobados",
      provisionalChip: "Provisional",
      provisionalHint: "Puede bajar",
      provisionalAriaLabel:
        "Margen operativo provisional: ir a aprobaciones de gastos en cola",
    },
    revenuePerTrip: {
      title: "Ingreso promedio por viaje",
      subtitle: "Ingreso real ÷ viajes completados",
      ariaLabel: "Ingreso promedio por viaje del mes",
      /** @deprecated Caption bajo Margen retirado en F-layout; Card 2 es celda propia. */
      caption: (value: string) => `${value} por viaje`,
    },
    arStrip: {
      ariaLabel: "Cobranza: cobrado, por cobrar y vencido",
    },
    collected: {
      title: "Cobrado",
      subtitle: "Pagos de facturas · sin efectivo sin CFDI",
      ariaLabel: "Cobrado este mes: ir a Cobros",
    },
    receivable: {
      title: "Por cobrar",
      subtitle: "Facturas con saldo pendiente",
      ariaLabel: "Por cobrar: ir a Cobros",
    },
    overdue: {
      title: "Vencido",
      subtitle: "Saldo con pago atrasado",
      ariaLabel: "Vencido: ir a Cobros",
    },
  },
  /**
   * Inventario actual de facturas por estado (`FinanceSummary.invoicesByStatus`).
   * No es un corte mensual: el API agrupa todas las facturas del tenant.
   */
  invoicesMonth: {
    title: "Facturación",
    description: "Timbradas y pendientes de timbrar · inventario actual",
    ariaLabel: "Desglose de facturas por estado",
    stamped: "Timbradas",
    pending: "Pendientes",
    pendingHint: "Borradores sin timbrar",
    cancellationPending: "Cancelación pendiente",
    cancelled: "Canceladas",
    emptyTitle: "Sin facturas",
    emptyDescription:
      "Cuando crees o timbres facturas, verás el desglose aquí.",
    viewInvoices: "Ver facturas",
    openAriaLabel: "Ir a Facturas",
  },

  /** @deprecated Prefer scorecard.*; kept for any residual references */
  metrics: {
    baseRate: {
      title: "Tarifa base (mes)",
      subtitle: "Ingresos operativos facturados",
    },
    collected: {
      title: "Cobrado este mes",
      subtitle: "Pagos registrados en el periodo",
    },
    fleetUtilization: {
      title: "Utilización de flota",
      subtitle: (available: number, maintenance: number) =>
        `${available} disponibles · ${maintenance} en mantenimiento`,
    },
  },
  operationsSnapshot: {
    title: "Operación del mes",
    description: "Actividad operativa del mes en curso",
    metrics: {
      inProgress: "Viajes en ruta",
      completedThisMonth: "Completados (mes)",
      cancelledThisMonth: "Cancelados (mes)",
      activeAlerts: "Alertas activas",
      fleetOnTrip: "Flota en viaje",
      fleetOnTripValue: (onTrip: number, total: number) => {
        if (total <= 0) return `${onTrip} / ${total}`;
        const pct = Math.round((onTrip / total) * 100);
        return `${pct}% · ${onTrip}/${total}`;
      },
    },
  },
  morningBrief: {
    summaryTitle: "Resumen del día",
    microLabels: {
      mine: "Me toca",
      yesterday: "Ayer",
      active: "Activas",
    },
    stats: {
      pendingApprovals: "Por autorizar",
      collectedYesterday: "Cobrado ayer",
      activeAlerts: "Alertas activas",
    },
    tripsToday: {
      title: "Viajes de hoy",
      empty: "No hay viajes operativos hoy",
      emptyHint: "Los que salgan o sigan en ruta aparecerán aquí",
      viewAll: "Ver todos los viajes de hoy",
    },
  },
  recentTrips: {
    title: "Viajes recientes",
    loading: "Cargando...",
    emptyTitle: "Sin viajes registrados",
    emptyDescription: "Los viajes aparecerán aquí",
    count: (count: number) => `${count} últimos viajes`,
    viewAll: "Ver todos",
  },
  alerts: {
    title: "Requiere atención",
    loading: "Cargando alertas...",
    emptyTitle: "Sin alertas pendientes",
    emptyDescription: "No hay alertas que requieran acción",
    allClearTitle: "Todo en orden",
    unavailableTitle: "Alertas no disponibles",
    unavailableDescription:
      "No se pudieron cargar las alertas. Intenta de nuevo.",
    retry: "Reintentar",
    count: (count: number) =>
      `${count} alerta${count > 1 ? "s" : ""} operativa${count > 1 ? "s" : ""}`,
    showRemaining: (remaining: number) =>
      `Ver las ${remaining} restante${remaining > 1 ? "s" : ""}`,
    viewAllDocuments: "Ver todos los documentos",
    cta: {
      overdue_trip: "Ver viaje",
      license_expiring: "Ver documentos",
      medical_certificate_expiring: "Ver documentos",
      insurance_expiring: "Ver documentos",
      sct_permit_expiring: "Ver documentos",
    },
    severity: {
      error: (count: number) => `${count} urgente${count > 1 ? "s" : ""}`,
      warning: (count: number) => `${count} aviso${count > 1 ? "s" : ""}`,
      info: (count: number) => `${count} info`,
    },
  },
  charts: {
    empty: {
      title: "Sin datos en el periodo",
    },
    tripsByDay: {
      title: "Viajes por día",
      description: "Completados, cancelados y en ruta en el periodo seleccionado",
      ariaLabel: "Gráfico de línea: viajes por día",
      emptyDescription: "No hay actividad de viajes en el rango seleccionado.",
      footer: (
        completed: number,
        cancelled: number,
        inProgress: number,
        days: number,
      ) =>
        `${completed} completados · ${cancelled} cancelados · ${inProgress} en ruta (${days} días)`,
      series: {
        completed: "Completados",
        cancelled: "Cancelados",
        inProgress: "En Ruta",
      },
    },
    fleet: {
      title: "Flota",
      description: "Unidades por estado operativo",
      ariaLabel: "Gráfico de dona: estado de la flota",
      centerLabel: "Unidades",
      emptyDescription: "No hay unidades registradas en la flota.",
      footer: (onTrip: number, available: number, maintenance: number) =>
        `${onTrip} en viaje · ${available} disponibles · ${maintenance} en mantenimiento`,
      series: {
        onTrip: "En viaje",
        available: "Disponibles",
        maintenance: "En mantenimiento",
      },
    },
    drivers: {
      title: "Conductores",
      description: "Personal por disponibilidad",
      ariaLabel: "Gráfico de dona: estado de conductores",
      centerLabel: "Conductores",
      emptyDescription: "No hay conductores registrados.",
      footer: (available: number, onTrip: number, absent: number) =>
        `${available} disponibles · ${onTrip} en viaje · ${absent} ausentes`,
      series: {
        available: "Disponibles",
        onTrip: "En viaje",
        absent: "Ausentes",
      },
    },
  },
  financialComparison: {
    title: "Ingresos, costos y margen",
    description:
      "Ingreso y costo por mes de viajes completados (el costo sigue el primario del API: operativo cuando el flag está activo)",
    ariaLabel: "Gráfico de barras: ingreso y costo por mes",
    series: {
      actualRevenue: "Ingreso",
      actualCost: "Costo",
    },
    currentPeriodLabel: (label: string) => `${label} (en curso)`,
    monthsOption: (months: number) => `${months}m`,
    monthsAriaLabel: "Meses en la tendencia",
    empty: {
      title: "Sin viajes completados",
      description:
        "Cuando cierres viajes, aquí verás ingreso, costo y margen por mes.",
    },
    monthEmpty: "Sin viajes completados este mes.",
    pendingExpensesAlert:
      "Hay gastos en cola de aprobación; el costo y el margen pueden bajar.",
    pendingExpensesLinkAriaLabel: "Ir a aprobaciones de gastos en cola",
    viewProfitability: "Ver rentabilidad",
    compareWithPreviousYear: "Comparar con año anterior",
    footer: (months: number, tripCount: number) =>
      `Últimos ${months} meses · mes en curso: ${tripCount} viaje${tripCount === 1 ? "" : "s"} completado${tripCount === 1 ? "" : "s"}`,
    miniKpis: {
      revenueVariance: "Ingreso real vs tarifa pactada",
      revenueDetail: (agreed: string, actual: string) =>
        `Tarifa pactada ${agreed} · Ingreso real ${actual}`,
      noAgreedRate: "Sin tarifa pactada",
      equalToAgreed: "Igual a lo pactado",
      revenueOnlyDetail: (actual: string) => `Ingreso real ${actual}`,
      costVariance: "Costo real vs costo estimado",
      costDetail: (estimated: string, actual: string) =>
        `Costo estimado ${estimated} · Costo real ${actual}`,
      noEstimatedCost: "Sin costo estimado",
      equalToEstimated: "Igual a lo estimado",
      costOnlyDetail: (actual: string) => `Costo real ${actual}`,
      actualMargin: "Margen real del mes",
      marginDetail: "Ingreso real menos costo real",
    },
  },
  vehicleExpenses: {
    title: "Unidades con más gasto",
    description: "Top 5 por gastos de viaje aprobados del mes en curso",
    ariaLabel: "Ranking de unidades con mayor gasto operativo aprobado",
    viewAnalysis: "Ver análisis",
    emptyTitle: "Sin gastos aprobados este mes",
    emptyDescription:
      "El ranking aparecerá cuando existan gastos de viaje aprobados y asociados a una unidad.",
  },
  branchKpis: {
    title: "KPIs por sucursal",
    description: "Comparativa operativa por sucursal (hasta 3)",
    periodLabel: (label: string) => `Período: ${label}`,
    periodOptions: {
      ariaLabel: "Período de KPIs",
      current_month: "Mes actual",
      last_30: "30 días",
      last_90: "90 días",
    },
    compareLabel: "Comparar sucursales",
    maxBranchesHint: "Selecciona hasta 3 sucursales",
    unassignedOption: "Sin sucursal",
    unassignedTooltip:
      "Viajes, vehículos o conductores sin sucursal asignada (datos legacy o sin etiquetar).",
    singleBranchHint:
      "Cuando registres otra sucursal activa podrás comparar desempeño entre terminales.",
    noBranches: {
      title: "Sin sucursales activas",
      description: "Crea sucursales para ver KPIs comparativos por terminal.",
      cta: "Ir a sucursales",
    },
    table: {
      branch: "Sucursal",
      tripsMonth: "Viajes",
      inProgress: "En Ruta",
      completed: "Completados",
      vehicles: "Vehículos",
      drivers: "Conductores",
      margin: "Margen",
      viewTrips: "Ver viajes",
    },
    chart: {
      completed: "Completados",
      vehicles: "Vehículos",
      margin: "Margen",
      empty: "Selecciona sucursales para ver la comparativa.",
    },
    compareCta: "Comparar sucursales",
    trend: {
      title: "Tendencia multi-mes",
      description: "Viajes completados por mes calendario (hasta 3 sucursales)",
      ariaLabel: "Gráfico de tendencia de viajes completados por sucursal",
      monthsOption: (months: number) => `${months}m`,
      empty: "Sin viajes completados en el rango seleccionado.",
      emptySelection: "Selecciona al menos una sucursal para ver la tendencia.",
      footer: (months: number, periods: number) =>
        `Últimos ${months} meses · ${periods} períodos con datos`,
    },
  },
} as const;
