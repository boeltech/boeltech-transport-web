/**
 * Namespace: shell.copy.navigation.*
 * Labels del sidebar global (app shell).
 */
export const navigationCopy = {
  group: {
    operations: "Operación",
    fleet: "Flota y personal",
    commercial: "Comercial",
    finance: "Finanzas",
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
    financeHub: "Finanzas",
    /** Viajes entregados sin factura: cola de trabajo del contador. */
    financeInvoiceable: "Por facturar",
    /** Facturas a crédito con saldo: cola de trabajo de cobranza (mismo hub). */
    financeCobros: "Cobros",
    financeApprovals: "Aprobaciones",
    /** Deep-link al tab Facturas del hub (no es un módulo aparte). */
    financeInvoices: "Facturas",
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
