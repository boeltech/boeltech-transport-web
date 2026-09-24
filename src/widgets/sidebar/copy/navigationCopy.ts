/**
 * Namespace: shell.copy.navigation.*
 * Labels del sidebar global (app shell).
 */
export const navigationCopy = {
  group: {
    operations: "Operación",
    fleet: "Flota y personal",
    commercial: "Comercial",
    billing: "Facturación",
    finance: "Finanzas",
    reports: "Reportes",
    admin: "Administración",
  },
  item: {
    dashboard: "Dashboard",
    trips: "Viajes",
    branches: "Sucursales",
    vehicles: "Vehículos",
    trailers: "Remolques",
    drivers: "Conductores",
    employees: "Empleados",
    clientsList: "Clientes",
    /** Entrada al hub Finanzas (landing Panorama). Grupo = Finanzas; ítem ≠ mismo label. */
    financeHub: "Panorama",
    /** Viajes entregados sin factura: cola de trabajo del contador. */
    financeInvoiceable: "Por facturar",
    /** Facturas a crédito con saldo: cola de trabajo de cobranza (mismo hub). */
    financeCobros: "Cobros",
    financeApprovals: "Aprobaciones",
    financeSettlements: "Liquidaciones",
    financeOperatorPayments: "Pagos a operadores",
    financeAgreements: "Esquemas de compensación",
    /** Workbench unificado de envío de facturas (pendientes / enviadas / historial). */
    financeDispatch: "Envíos",
    financeAnalysis: "Rentabilidad",
    /** Listado de facturas (staff con invoices.read y portal client). */
    financeInvoices: "Facturas",
    /** Hub de reportes de negocio (/reports). Promovido como grupo independiente. */
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
