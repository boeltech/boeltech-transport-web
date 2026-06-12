/**
 * Namespace: trips.copy.wizard.shell.*
 */
export const shellCopy = {
  page: {
    createTitle: "Nuevo Viaje",
    editTitle: "Editar Viaje",
    createSubtitle: "Complete los pasos para crear un viaje",
    editSubtitle: (tripCode: string) =>
      tripCode ? `Editando ${tripCode}` : "Editando",
    backLabel: "Volver",
  },
  step: {
    basic: { title: "Información", description: "Asignaciones y programación" },
    route: { title: "Ruta", description: "Paradas del viaje" },
    cargo: { title: "Cargas", description: "Mercancías a transportar" },
    costs: { title: "Costos", description: "Gastos estimados" },
    summary: { title: "Resumen", description: "Confirmar y crear" },
  },
  submit: {
    create: "Crear Viaje",
    save: "Guardar Cambios",
    creating: "Creando...",
    saving: "Guardando...",
    stepsAriaLabel: "Pasos para crear o editar un viaje",
    validationAriaLabel: "Errores de validación del paso",
  },
  validation: {
    stepSummaryTitles: [
      "Revisa la información básica del viaje",
      "Revisa la ruta y las paradas",
      "Revisa las cargas del viaje",
      "Revisa los costos del viaje",
      "Revisa el resumen antes de guardar",
    ] as const,
    stepSummaryFallback: "Revisa los siguientes campos",
    selectClient: "Selecciona el cliente que contrata el viaje",
    duplicateSupportStaff:
      "No puedes agregar el mismo empleado dos veces en el equipo de apoyo.",
    driverInSupportStaff:
      "El conductor principal no puede figurar también en el equipo de apoyo.",
    supportStaffUnavailable: (name: string, reason: string) =>
      `${name} ya no está disponible (${reason}). Quítalo del equipo de apoyo.`,
    supportStaffBlockedOnAdd: (reason: string) =>
      `No puedes agregar este empleado: ${reason}.`,
    routeIncomplete: "Completa la ruta para continuar.",
    routeFieldsIncomplete:
      "Hay campos requeridos sin completar. Abre cada parada con el botón Completar.",
    cargoIncomplete: "Completa las cargas para continuar.",
  },
  toast: {
    infoTitle: "Información",
    tripUpdated: "Viaje actualizado",
    updateError: "Error al actualizar",
    implicitDeliveryTitle: "Entrega con destino implícito",
    marginWarningTitle: "Rentabilidad estimada comprometida",
    routeCpIncompleteTitle: "Ruta incompleta para generar el comprobante",
    serverValidationTitle: "El viaje no cumple la validación del servidor",
    tripCreated: "Viaje creado exitosamente",
    createError: "Error al crear viaje",
    unknownError: "Error desconocido",
  },
} as const;
