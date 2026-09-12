/**
 * Namespace: trips.copy.tripDetail.costs.*
 * Léxico operativo (Capa 1 D3/D7): ruta/unidad, operador/extras, sin jerga fiscal/TI.
 */
export const costsCopy = {
  section: {
    baseRate: "Ingreso del viaje",
    operational: "En la ruta y la unidad",
    indirect: "Del operador y extras",
    breakdown: "Por tipo",
  },
  hint: {
    inProgress:
      "Registre costos y gastos reales en curso. Puede ajustar la tarifa base aquí; los gastos no sustituyen la tarifa ni el ingreso facturado.",
    postCloseWindow:
      "Puede registrar gastos tardíos hasta el {deadline}. Solo los registros en revisión se pueden editar o eliminar; los aprobados son de solo lectura.",
    postCloseWindowClosed:
      "Pasaron 30 días desde que cerró el viaje ({deadline}). Ya no se pueden agregar gastos; los aprobados siguen visibles en solo lectura.",
    breakdown: "Distribución de lo registrado por tipo.",
    baseRateTraslado: "Opcional en viajes solo de traslado.",
    baseRateIngresoRequired: "Obligatoria para viajes con factura de servicio y cliente.",
    baseRateIngresoOptional: "Opcional si el viaje no tiene cliente contratante.",
    breakdownToggleShow: "Ver desglose por tipo",
    breakdownToggleHide: "Ocultar desglose",
  },
  alert: {
    loadErrorTitle: "No se pudieron cargar los costos",
    loadErrorBody: "Intente de nuevo o vuelva más tarde.",
    inProgressTitle: "Gastos durante el viaje",
    postCloseWindowTitle: "Gastos después de cerrar el viaje",
    postCloseWindowClosedTitle: "Plazo para gastos cerrado",
    marginCriticalTitle: "Utilidad muy baja",
    marginCriticalBody:
      "El margen estimado está por debajo del 10%. Revise la tarifa o los registros.",
    pendingApprovalTitle: "Registros en revisión",
    pendingApprovalBody:
      "Los registros en revisión aún no cuentan en Finanzas hasta que alguien con permiso los apruebe.",
    pendingApprovalBodyCanApprove:
      "Apruebe los registros en revisión aquí o desde la bandeja de aprobaciones para incluirlos en reportes de Finanzas.",
    approvalsHubLink: "Ver en bandeja de aprobaciones",
  },
  action: {
    retry: "Reintentar",
    addCost: "Agregar de ruta",
    addExpense: "Agregar del operador",
    saveBaseRate: "Guardar tarifa",
    savingBaseRate: "Guardando…",
    cancel: "Cancelar",
    edit: "Editar",
    remove: "Eliminar",
    approve: "Aprobar",
    reject: "Rechazar",
    reviewGroup: "Revisión",
  },
  label: {
    baseRate: "Tarifa base",
    baseRateInput: "Tarifa base (MXN)",
  },
  state: {
    emptyOperationalTitle: "Sin registros de ruta",
    emptyOperationalEditable:
      'Use "Agregar de ruta" para combustible, casetas y otros costos de la unidad.',
    emptyOperationalReadOnly: "No hay registros de ruta y unidad en este viaje.",
    emptyAfterFalseTrip: "Los gastos se capturan antes de declarar.",
    emptyIndirectTitle: "Sin registros del operador",
    emptyIndirectEditable:
      'Use "Agregar del operador" para viáticos, hospedaje y otros extras.',
    emptyIndirectReadOnly: "No hay registros del operador en este viaje.",
    estimated: "Estimado",
    receipt: "Comprobante",
    noCategory: "Sin categoría",
    /** Badge: pending → léxico operativo */
    inReview: "En revisión",
    inReviewHint: "Aún no cuenta en Finanzas",
    documented: "Documentado",
    documentedHint: "Aún no cuenta en Finanzas",
  },
  toast: {
    updated: "Registro actualizado",
    created: "Registro guardado",
    saveError: "No se pudo guardar",
    removed: "Registro eliminado",
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
  incomeSource: {
    invoiced: "Facturado",
    rateRegistered: "Tarifa registrada",
  },
  financialSummary: {
    section: {
      title: "Resultado del viaje",
      titleEstimated: "Resultado estimado",
      income: "Ingreso",
      operational: (count: number) =>
        count === 1
          ? "Ruta y unidad (1)"
          : `Ruta y unidad (${count})`,
      indirect: (count: number) =>
        count === 1
          ? "Operador y extras (1)"
          : `Operador y extras (${count})`,
    },
    label: {
      freight: "Flete",
      baseRate: "Tarifa base",
      income: "Ingreso",
      costs: "Ruta y unidad",
      expenses: "Operador y extras",
      margin: "Utilidad",
      marginPct: "Margen",
      marginConfirmed: "Utilidad confirmada",
    },
    hint: {
      calculationEstimated:
        "Estimado — incluye registros en revisión.",
      calculationApprovedOnly:
        "Utilidad confirmada — solo registros aprobados.",
      queuedMayLower: (amount: string) =>
        `Hay ${amount} en revisión; la utilidad puede bajar.`,
    },
    state: {
      emptyLines: "Sin registros",
    },
  },
} as const;
