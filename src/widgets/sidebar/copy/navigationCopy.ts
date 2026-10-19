/**
 * Namespace: shell.copy.navigation.*
 * Labels del sidebar global (app shell).
 */
export const navigationCopy = {
  group: {
    operations: "Operación",
    monitoring: "Monitoreo",
    fleet: "Flota",
    commercial: "Comercial",
    billing: "Facturación",
    /** Grupo Cobranza (id EN `collections`: paridad con billing/finance). */
    collections: "Cobranza",
    finance: "Finanzas",
    /** Grupo sidebar Pagos a operadores (P1 / VIS E.0) — 4 destinos. */
    operatorPayments: "Pagos a operadores",
    reports: "Reportes",
    admin: "Administración",
  },
  item: {
    dashboard: "Inicio",
    trips: "Viajes",
    fleetMap: "Mapa de flota",
    gpsAlerts: "Alertas",
    gpsAlertSettings: "Configuración",
    branches: "Sucursales",
    vehicles: "Vehículos",
    trailers: "Remolques",
    drivers: "Conductores",
    /** Tablero de docs de flota por vencer (/fleet/documents). */
    fleetDocuments: "Documentos",
    employees: "Empleados",
    clientsList: "Clientes",
    /** Entrada al hub Finanzas (landing Cartera). Grupo = Finanzas; ítem ≠ mismo label. */
    financeHub: "Cartera",
    /** Viajes entregados sin factura: cola de trabajo del contador. */
    financeInvoiceable: "Por facturar",
    /** Cola fiscal PPD con saldo (grupo Cobranza). D7: Facturas a crédito. */
    financeCobros: "Facturas a crédito",
    /** Cobros sin factura con saldo (ADR-0096). D3′: Cobros sin factura. Ruta sin cambio. */
    financeEfectivoPorCobrar: "Cobros sin factura",
    financeApprovals: "Aprobaciones",
    financeSettlements: "Liquidaciones",
    /** @deprecated Grupo propio; label histórico del ítem único. */
    financeOperatorPayments: "Pagos a operadores",
    financeAgreements: "Tarifas de pago",
    /** Destinos del grupo Pagos a operadores (VIS E.0 / .dc.html). */
    operatorPaymentsPagos: "Pagos",
    operatorPaymentsAdvances: "Anticipos",
    operatorPaymentsOperators: "Operadores",
    operatorPaymentsTariffs: "Tarifas",
    /** Workbench unificado de envío puntual (pendientes / enviadas). */
    financeDispatch: "Envíos",
    /** Ritual periódico: armar → revisar → mandar (Opción A). */
    financeDispatchPeriod: "Correo del periodo",
    /** /finance/analysis: vistas Mes a mes (por defecto), Rentabilidad y Gastos. */
    financeAnalysis: "Análisis",
    /** Listado de facturas (staff con invoices.read y portal client). */
    financeInvoices: "Facturas",
    /** Hub de reportes de negocio (/reports). Ítem bajo Finanzas. */
    reportsList: "Reportes",
    users: "Usuarios",
    /** Movimientos de las cuentas del equipo, no auditoría de todo el sistema. */
    usersActivity: "Historial de usuarios",
    settings: "Configuración",
  },
  /** Labels del sidebar para rol client (portal de consulta). */
  portal: {
    dashboard: "Inicio",
    trips: "Mis envíos",
    invoices: "Mis facturas",
  },
  /** Labels del sidebar para rol driver (portal operativo). */
  driverPortal: {
    dashboard: "Inicio",
    trips: "Mis viajes",
  },
} as const;
