/**
 * Copy — módulo Reportes (WS-C)
 */

export const reportsCopy = {
  page: {
    title: "Reportes",
    description:
      "Hub de reportes operativos. Exporta datos de tu operación en formato CSV.",
    backHref: "/dashboard",
    backLabel: "Volver al dashboard",
  },
  trips: {
    card: {
      title: "Viajes",
      description:
        "Exporta el listado completo de viajes con datos operativos: código, cliente, ruta, estado, fechas y tarifa base.",
    },
    export: "Exportar CSV",
    exporting: "Exportando...",
    filePrefix: "viajes-operativo",
    toast: {
      success: "Reporte de viajes exportado",
      empty: "No hay viajes para exportar con los filtros actuales.",
      error: "Error al exportar viajes",
    },
    filters: {
      status: "Estado",
      statusAll: "Todos los estados",
      dateFrom: "Desde",
      dateTo: "Hasta",
      search: "Buscar viaje...",
      clearFilters: "Limpiar filtros",
    },
    columns: {
      tripCode: "codigo_viaje",
      client: "cliente",
      originCity: "origen_ciudad",
      originState: "origen_estado",
      destinationCity: "destino_ciudad",
      destinationState: "destino_estado",
      status: "estado",
      scheduledDeparture: "salida_programada",
      scheduledArrival: "llegada_programada",
      baseRate: "tarifa_base",
      vehicle: "vehiculo",
      driver: "conductor",
    },
  },
  dashboard: {
    card: {
      title: "Dashboard operativo",
      description:
        "Los KPIs y gráficas de operación están disponibles en el Dashboard.",
    },
    cta: "Ir al Dashboard",
  },
  permissions: {
    noExport: "Tu rol no tiene permisos para exportar reportes.",
  },
} as const;

export function getTripExportHeaders(): string[] {
  const columns = reportsCopy.trips.columns;
  return [
    columns.tripCode,
    columns.client,
    columns.originCity,
    columns.originState,
    columns.destinationCity,
    columns.destinationState,
    columns.status,
    columns.scheduledDeparture,
    columns.scheduledArrival,
    columns.baseRate,
    columns.vehicle,
    columns.driver,
  ];
}
