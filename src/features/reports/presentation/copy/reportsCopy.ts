/**
 * Copy — módulo Inteligencia de negocio (/reports)
 */

export const reportsCopy = {
  page: {
    title: "Inteligencia de negocio",
    description:
      "Encuentra respuestas sobre rentabilidad, cartera, gastos y operación. Exporta datos en CSV.",
  },
  catalog: {
    viewAnalysisCta: "Ver análisis",
    groups: {
      financial: {
        title: "Financiero",
        description:
          "Cartera, margen y concentración de gastos con el detalle en Finanzas.",
      },
      operational: {
        title: "Operativo",
        description:
          "Actividad del mes, viajes y comparativa por sucursal en el Dashboard.",
      },
    },
    items: {
      margin: {
        title: "Rentabilidad y margen",
        description:
          "Compara margen operativo del mes y revisa la tendencia mensual de ingreso vs gasto real.",
      },
      receivables: {
        title: "Cartera y cobranza",
        description:
          "Consulta quién te debe, saldo vencido, antigüedad de saldos y estado de cuenta por cliente.",
      },
      expenses: {
        title: "Gastos por unidad, operador o ruta",
        description:
          "Identifica dónde se concentra el gasto operativo aprobado y cómo evoluciona en el tiempo.",
      },
      operations: {
        title: "Operación y volumen de viajes",
        description:
          "Revisa viajes del mes, actividad diaria, alertas operativas y tendencia reciente en el Dashboard.",
      },
      branches: {
        title: "Comparativa por sucursal",
        description:
          "Compara viajes, flota y margen entre sucursales. Si no ves el bloque, actívalo en Dashboard → Personalizar → KPIs por sucursal.",
      },
    },
  },
  exports: {
    sectionTitle: "Exportar datos",
    sectionDescription:
      "Descarga CSV de operación y finanzas. Para filtros avanzados, abre el análisis correspondiente.",
    trips: {
      title: "Viajes operativos",
      description:
        "Listado de viajes con código, cliente, ruta, estado, fechas, tarifa base, unidad y conductor.",
    },
    finance: {
      title: "Finanzas",
      description:
        "Exportaciones rápidas con criterios predeterminados del mes en curso o cartera actual.",
      aging: "Antigüedad de saldos por cliente",
      margin: "Muestra de margen por viaje (top 100)",
      expenses: "Gastos por unidad (mes en curso)",
      advancedFiltersLink: "Filtros avanzados en Finanzas → Análisis",
      emptyTitle: "Sin datos para exportar",
      agingEmpty: "No hay saldos pendientes para exportar.",
      marginEmpty: "No hay viajes con margen para los criterios actuales.",
      expensesEmpty: "No hay gastos aprobados en el mes en curso.",
    },
  },
  trips: {
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
