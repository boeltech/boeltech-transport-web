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
    /** Operador (D12): no apunta a tarifa / efectivo / Facturado. */
    inProgressOperator:
      "Registre casetas, combustible y extras con Agregar de ruta o Agregar del operador.",
    postCloseWindow:
      "Puede registrar gastos tardíos hasta el {deadline}. Solo los registros en revisión se pueden editar o eliminar; los aprobados son de solo lectura.",
    /** Operador (D11): no alta tardía ni eliminar; sí editar pending + escala. */
    postCloseWindowOperator:
      "Puede editar registros en revisión hasta el {deadline}. Un ticket nuevo lo da de alta un admin, gerente o contador.",
    postCloseWindowClosed:
      "Pasaron 30 días desde que cerró el viaje ({deadline}). Ya no se pueden agregar gastos; los aprobados siguen visibles en solo lectura.",
    /** Operador (D11): solo lectura, sin SAT ni reabrir. */
    postCloseWindowClosedOperator:
      "El plazo para gastos ya cerró ({deadline}). Los registros quedan en solo lectura.",
    breakdown: "Distribución de lo registrado por tipo.",
    baseRateTraslado: "Opcional en viajes solo de traslado.",
    baseRateIngresoRequired: "Obligatoria para viajes con factura de servicio y cliente.",
    baseRateIngresoOptional: "Opcional si el viaje no tiene cliente contratante.",
    breakdownToggleShow: "Ver desglose por tipo",
    breakdownToggleHide: "Ocultar desglose",
    /** F1 tres bolsillos: orientación del canal «Del operador» (gasto del viaje). */
    indirectChannels:
      "Comprobante sin adelanto → aquí. Efectivo adelantado → Anticipos. Pago fijo de tarifa → en Tarifas.",
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
    /** Operador (D12): no apunta a tarifa. */
    marginCriticalBodyOperator:
      "El margen estimado está por debajo del 10%. Revise los registros de ruta y del operador.",
    pendingApprovalTitle: "Registros en revisión",
    pendingApprovalBody:
      "Los registros en revisión aún no cuentan en Finanzas hasta que alguien con permiso los apruebe.",
    /** Operador (D10): nombra quién aprueba; sin bandeja. */
    pendingApprovalBodyOperator:
      "Avisa a un admin, gerente o contador para que los apruebe. No se aprueban aquí.",
    pendingApprovalBodyCanApprove:
      "Apruebe los registros en revisión aquí o desde la bandeja de aprobaciones para incluirlos en reportes de Finanzas.",
    approvalsHubLink: "Ver en bandeja de aprobaciones",
    /** ADR-0099 D15: gana a «pendientes» para quien corrige sin decidir. */
    returnedTitle: (count: number) =>
      count === 1
        ? "1 gasto devuelto para corregir"
        : `${count} gastos devueltos para corregir`,
    returnedBody:
      "Quien lo autoriza pidió una corrección. Ábrelo con «Corregir y reenviar»; al guardar vuelve a autorización.",
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
    more: "Más acciones",
    saveAndResubmit: "Guardar y reenviar",
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
    emptyIndirectTitle: "Sin gastos del viaje del operador",
    emptyIndirectEditable:
      "Comprobante sin adelanto (hospedaje, comida, etc.) → regístrelo aquí como gasto del viaje (reembolso). Efectivo adelantado → Anticipos. Pago fijo de tarifa → en Tarifas, no aquí. No duplique el mismo desembolso en dos canales.",
    emptyIndirectReadOnly: "No hay gastos del viaje del operador en este viaje.",
    estimated: "Estimado",
    receipt: "Comprobante",
    noCategory: "Sin categoría",
    /** Badge: pending → léxico operativo */
    inReview: "En revisión",
    inReviewHint: "Aún no cuenta en Finanzas",
    documented: "Documentado",
    documentedHint: "Aún no cuenta en Finanzas",
    /** TEC-5: solo gastos no devueltos; el devuelto se corrige sin ventana. */
    windowClosedRow: (date: string) =>
      `La ventana para corregir gastos de este viaje cerró el ${date}.`,
  },
  toast: {
    updated: "Registro actualizado",
    created: "Registro guardado",
    saveError: "No se pudo guardar",
    removed: "Registro eliminado",
    removeError: "No se pudo eliminar",
    expenseNotMutableEdit:
      "Este gasto ya fue autorizado o rechazado y no se puede editar. La lista ya muestra su estado actual.",
    expenseNotMutableRemove:
      "Este gasto ya fue autorizado o rechazado y no se puede eliminar. La lista ya muestra su estado actual.",
    approved: "Gasto aprobado",
    approveError: "No se pudo aprobar",
    rejected: "Gasto rechazado",
    rejectError: "No se pudo rechazar",
    resubmitted: "Gasto corregido y reenviado a autorización",
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
      facturadoVigente: "Facturado vigente",
      cobradoViaje: "Cobrado del viaje",
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
