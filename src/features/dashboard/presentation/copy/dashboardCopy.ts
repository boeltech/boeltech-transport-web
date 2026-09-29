export const dashboardCopy = {
  page: {
    subtitle: "Operación, alertas y documentación del día",
    tripsBridge: "El trabajo del día está en Viajes.",
    tripsBridgeLink: "Ir a Viajes",
    /** Operador (D8): gastos del viaje; no reusa el puente del dispatcher. */
    subtitleOperator: "Casetas, combustible y extras se cargan en el viaje",
    tripsBridgeOperator:
      "Encuéntralos en Viajes; se cargan en Costos.",
    tripsBridgeOperatorLink: "Ir a Viajes",
    subtitleAccountant: "Facturación y cobro del día: primer CFDI y atención fiscal",
    invoiceableBridge: "La escala del patio entra por Por facturar.",
    invoiceableBridgeLink: "Ir a Por facturar",
    subtitleManager:
      "Trámite SAT que te piden y altas que patio no pudo crear",
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
    visibleLabel: "Visible",
    resetRole: "Restaurar predeterminado del rol",
    resetSystem: "Restaurar predeterminado del sistema",
    done: "Listo",
    roleSettingsTitle: "Layout de Inicio por rol",
    roleSettingsDescription:
      "Define el orden y visibilidad por defecto para cada rol. Los usuarios pueden personalizar después.",
    selectRole: "Rol",
    saveRoleLayout: "Guardar layout del rol",
  },
  scorecard: {
    title: "Scorecard del mes",
    description:
      "Margen de viajes completados (incluye sin CFDI) menos costos aprobados. Cobranza = pagos de facturas; el efectivo sin factura se registra en Costos.",
    ariaLabel: "Scorecard financiero del mes",
    margin: {
      title: "Margen operativo",
      subtitle: "Completados · tarifa · costos aprobados",
      provisionalChip: "Provisional",
      provisionalHint: "Puede bajar",
      provisionalAriaLabel:
        "Margen operativo provisional: ir a aprobaciones de gastos en cola",
    },
    collected: {
      title: "Cobrado este mes",
      subtitle:
        "Pagos de facturas en el periodo · no incluye efectivo sin CFDI",
    },
    receivable: {
      title: "Por cobrar",
      subtitle: "Facturas con saldo pendiente",
    },
    overdue: {
      title: "Vencido",
      subtitle: "Saldo con pago atrasado",
    },
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
      fleetOnTripValue: (onTrip: number, total: number) => `${onTrip} / ${total}`,
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
    financialTrend: {
      series: {
        budgetedRevenue: "Ingreso presup.",
        actualRevenue: "Ingreso real",
        budgetedCost: "Costo presup.",
        actualCost: "Costo real",
      },
      emptyDescription: "Sin viajes completados en los meses consultados.",
      footer: (months: number, periods: number) =>
        `Tendencia de ${periods} meses · ventana de ${months} meses`,
    },
  },
  financialComparison: {
    title: "Ingresos y costos: plan vs real",
    descriptionEmpty: "Comparativa del mes en curso (viajes completados)",
    ariaLabel: "Gráfico de barras: ingresos y costos presupuestados vs reales",
    series: {
      budgeted: "Presupuestado",
      actual: "Real",
    },
    categories: {
      revenue: "Ingresos",
      cost: "Costos",
    },
    empty: {
      title: "Sin viajes completados este mes",
      description:
        "Cuando cierres viajes del mes actual, aquí verás la comparativa de plan vs real.",
    },
    pendingExpensesAlert:
      "Hay gastos en cola de aprobación; el costo real y el margen operativo pueden bajar.",
    pendingExpensesLinkAriaLabel: "Ir a aprobaciones de gastos en cola",
    viewProfitability: "Ver rentabilidad",
    footer: (tripCount: number) =>
      `Basado en ${tripCount} viaje${tripCount === 1 ? "" : "s"} completado${tripCount === 1 ? "" : "s"} del mes`,
    miniKpis: {
      revenueVariance: "Variación ingreso",
      costVariance: "Variación costo",
      actualMargin: "Margen operativo",
    },
    tooltip: {
      variance: "Variación",
    },
  },
  financialTrend: {
    title: "Tendencia plan vs real",
    description: "Ingresos y costos presupuestados vs reales por mes (viajes completados)",
    ariaLabel: "Gráfico de barras: tendencia mensual plan vs real",
    monthsOption: (months: number) => `${months}m`,
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
