/**
 * Namespace: trips.copy.tripDetail.costs.*
 */
export const costsCopy = {
  section: {
    baseRate: "Ingreso del viaje",
    operational: "Costos operativos",
    indirect: "Gastos indirectos",
    breakdown: "Por categoría",
  },
  hint: {
    inProgress:
      "Registre costos y gastos reales en curso. Replanifique ruta, cargas o tarifa en edición completa.",
    breakdown: "Distribución de costos y gastos registrados.",
    baseRateTraslado: "Opcional en viajes de traslado.",
    baseRateIngresoRequired: "Obligatoria para viajes de ingreso con cliente.",
    baseRateIngresoOptional: "Opcional si el viaje no tiene cliente contratante.",
  },
  alert: {
    loadErrorTitle: "No se pudieron cargar los costos",
    loadErrorBody: "Intente de nuevo o vuelva más tarde.",
    inProgressTitle: "Gastos durante el viaje",
    marginCriticalTitle: "Rentabilidad comprometida",
    marginCriticalBody:
      "El margen estimado está por debajo del 10%. Revise tarifa o conceptos registrados.",
    pendingApprovalTitle: "Gastos pendientes de aprobación",
    pendingApprovalBody:
      "Los conceptos en estado Pendiente no aparecen en Finanzas hasta que un rol con permiso de aprobaciones los apruebe.",
    pendingApprovalBodyCanApprove:
      "Apruebe los conceptos pendientes aquí o desde la bandeja centralizada para incluirlos en reportes de Finanzas.",
    approvalsHubLink: "Ver en bandeja de aprobaciones",
  },
  action: {
    retry: "Reintentar",
    addCost: "Agregar costo",
    addExpense: "Agregar gasto",
    saveBaseRate: "Guardar tarifa",
    savingBaseRate: "Guardando…",
    cancel: "Cancelar",
    edit: "Editar",
    remove: "Eliminar",
    approve: "Aprobar",
    reject: "Rechazar",
  },
  label: {
    baseRate: "Tarifa base",
    baseRateInput: "Tarifa base (MXN)",
  },
  state: {
    emptyOperationalTitle: "Sin costos registrados",
    emptyOperationalEditable:
      'Use "Agregar costo" para combustible, casetas y otros costos directos.',
    emptyOperationalReadOnly: "No hay costos operativos en este viaje.",
    emptyIndirectTitle: "Sin gastos registrados",
    emptyIndirectEditable:
      'Use "Agregar gasto" para viáticos, hospedaje y otros conceptos indirectos.',
    emptyIndirectReadOnly: "No hay gastos indirectos en este viaje.",
    estimated: "Estimado",
    receipt: "Comprobante",
    noCategory: "Sin categoría",
  },
  toast: {
    updated: "Concepto actualizado",
    created: "Concepto registrado",
    saveError: "No se pudo guardar",
    removed: "Concepto eliminado",
    removeError: "No se pudo eliminar",
    approved: "Gasto aprobado",
    approveError: "No se pudo aprobar",
    rejected: "Gasto rechazado",
    rejectError: "No se pudo rechazar",
    baseRateUpdated: "Tarifa base actualizada",
    baseRateSaveError: "No se pudo guardar la tarifa",
    baseRateSavedWithWarning: "Tarifa guardada con advertencia",
  },
  error: {
    invalidBaseRate: "Tarifa inválida",
  },
  financialSummary: {
    section: {
      title: "Resumen financiero estimado",
      income: "INGRESOS (1)",
      operational: (count: number) => `COSTOS OPERATIVOS (${count})`,
      indirect: (count: number) => `GASTOS (${count})`,
    },
    label: {
      freight: "Flete",
      baseRate: "Tarifa base",
      income: "Ingresos",
      costs: "Costos",
      expenses: "Gastos",
      margin: "Utilidad",
      marginPct: "Margen",
    },
    state: {
      emptyLines: "Sin conceptos",
    },
  },
} as const;
