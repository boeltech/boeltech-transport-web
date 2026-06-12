export const approvalsCopy = {
  inbox: {
    title: "Aprobaciones",
    description:
      "Revisa y aprueba gastos de viaje registrados en operaciones. Solo los gastos aprobados actualizan el costo real.",
    searchPlaceholder: "Buscar por viaje, operador o descripción…",
    empty: {
      titleClear: "Bandeja al día",
      descriptionClear:
        "No hay gastos de viaje pendientes de aprobación en este momento.",
      titleFiltered: "Sin resultados",
      descriptionFiltered:
        "No hay gastos que coincidan con los filtros actuales. Prueba otro estado, categoría o rango de fechas.",
      descriptionTripFilter: (tripLabel: string) =>
        `No hay gastos pendientes para el viaje ${tripLabel} con los filtros actuales.`,
    },
    refreshSuccess: "Bandeja actualizada",
    readOnly: {
      title: "Solo consulta",
      description:
        "Tu rol puede ver la bandeja, pero no aprobar ni rechazar gastos. Contacta a un gerente o contador si necesitas una acción.",
    },
    errors: {
      loadTitle: "No se pudo cargar la bandeja",
      retry: "Reintentar",
    },
    filters: {
      status: "Estado",
      statusAll: "Todos los estados",
      category: "Categoría",
      categoryAll: "Todas las categorías",
      fromDate: "Desde",
      toDate: "Hasta",
      statusChip: (label: string) => `Estado: ${label}`,
      categoryChip: (label: string) => `Categoría: ${label}`,
      tripChip: (tripLabel: string) => `Viaje: ${tripLabel}`,
      driverChip: (driverId: string) => `Operador: ${driverId}`,
      vehicleChip: (vehicleId: string) => `Unidad: ${vehicleId}`,
      dateFilterHeading: "Filtrar por fecha de registro",
      dateFilterPlaceholder: "Filtrar por fecha",
    },
    table: {
      select: "Seleccionar",
      type: "Tipo",
      trip: "Viaje",
      category: "Categoría",
      description: "Descripción",
      amount: "Monto",
      date: "Fecha",
      status: "Estado",
      actions: "Acciones",
      noDescription: "—",
      noReason: "(sin razón)",
    },
    actions: {
      approve: "Aprobar",
      reject: "Rechazar",
      approveConfirmTitle: "¿Aprobar este gasto?",
      approveConfirmDescription:
        "El gasto se marcará como aprobado y el costo real del viaje se actualizará.",
      approveConfirmDescriptionContext: (input: {
        tripCode: string;
        category: string;
        amount: string;
        description?: string;
      }) => {
        const detail = [input.tripCode, input.category, input.amount];
        if (input.description) detail.push(input.description);
        return `${detail.join(" · ")}. El gasto se marcará como aprobado y el costo real del viaje se actualizará.`;
      },
      approveConfirmAction: "Aprobar gasto",
      cancel: "Cancelar",
    },
    toasts: {
      approveSuccess: "Gasto aprobado",
      approveError: "No se pudo aprobar el gasto",
      rejectSuccess: "Gasto rechazado",
      rejectError: "No se pudo rechazar el gasto",
      bulkSuccess: (successes: number, total: number) =>
        `Procesadas ${successes} de ${total} operaciones`,
      bulkPartial: (failures: number) =>
        `${failures} operación(es) no se completaron`,
      loadError: "No se pudo cargar la bandeja de aprobaciones",
    },
    bulk: {
      selected: (count: number) => `${count} seleccionado(s)`,
      clearSelection: "Quitar selección",
      approve: "Aprobar seleccionados",
      reject: "Rechazar seleccionados",
      maxSelection: "Máximo 50 elementos por operación masiva",
      approveConfirmTitle: "¿Aprobar los gastos seleccionados?",
      approveConfirmDescription: (count: number) =>
        `Se aprobarán ${count} gasto(s). Esta acción no se puede deshacer.`,
    },
    unsupportedType: "Tipo no soportado en esta versión",
  },
  rejectSheet: {
    title: "Rechazar gasto",
    titleBulk: (count: number) => `Rechazar ${count} gastos`,
    description: "Indica la razón del rechazo (mínimo 5 caracteres).",
    descriptionBulk: (count: number) =>
      `Indica la razón del rechazo para ${count} gasto(s) (mínimo 5 caracteres).`,
    reasonLabel: "Razón del rechazo",
    reasonPlaceholder: "Describe por qué se rechaza este gasto…",
    cancel: "Cancelar",
    submit: "Rechazar",
    reasonTooShort: "La razón debe tener al menos 5 caracteres",
    counter: (current: number, max: number) => `${current}/${max}`,
  },
} as const;
