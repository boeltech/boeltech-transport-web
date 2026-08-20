/**
 * Namespace: trips.copy.wizard.shell.*
 */
export const shellCopy = {
  page: {
    createTitle: "Nuevo Viaje",
    reserveTitle: "Reservar viaje",
    editTitle: "Editar Viaje",
    createSubtitle: "Complete los pasos para crear un viaje",
    reserveSubtitle:
      "Anota el pedido del cliente y deja unidad y conductor listos.",
    editSubtitle: (tripCode: string) =>
      tripCode ? `Editando ${tripCode}` : "Editando",
    backLabel: "Volver",
    retiredBannerTitle: "Pantalla retirada del router (ADR-0078)",
    retiredBannerBody:
      "Usa Reservar viaje en el listado. Esta vista ya no tiene ruta.",
  },
  step: {
    basic: { title: "Información", description: "Asignaciones y programación" },
    route: { title: "Ruta", description: "Paradas del viaje" },
    cargo: { title: "Cargas", description: "Mercancías a transportar" },
    costs: { title: "Costos", description: "Tarifa y conceptos estimados" },
    summary: { title: "Resumen", description: "Confirmar y crear" },
    pedido: {
      title: "Pedido",
      description: "Cliente, ruta y fecha de salida",
    },
    asignar: {
      title: "Asignar",
      description: "Unidad, conductor y tarifa",
    },
  },
  submit: {
    create: "Crear Viaje",
    reserve: "Guardar reserva",
    save: "Guardar Cambios",
    creating: "Creando…",
    reserving: "Guardando reserva…",
    saving: "Guardando…",
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
    reserveStepSummaryTitles: [
      "Revisa el pedido",
      "Revisa la asignación",
    ] as const,
    stepSummaryFallback: "Revisa los siguientes campos",
    selectClient: "Selecciona el cliente del pedido",
    originCityRequired: "Indica la ciudad de origen",
    destinationCityRequired: "Indica la ciudad de destino",
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
    marginWarningTitle: "Margen estimado bajo",
    routeCpIncompleteTitle: "Ruta incompleta: falta ubicar en el mapa o kilómetros de tramo",
    serverValidationTitle: "El viaje no cumple la validación del servidor",
    tripCreated: "Viaje creado exitosamente",
    tripReserved: "Reserva guardada",
    overlapWarningTitle: "Posible traslape de asignación",
    createError: "Error al crear viaje",
    unknownError: "Error desconocido",
  },
  reserve: {
    section: {
      routeApprox: "Ruta aproximada",
      schedule: "Fecha de salida",
    },
    label: {
      client: "Cliente",
      originCity: "Ciudad de origen",
      destinationCity: "Ciudad de destino",
      notes: "Notas del pedido",
      baseRate: "Tarifa acordada (opcional)",
      fleetOptions: "Opciones de flota",
    },
    placeholder: {
      originCity: "Ej. CDMX",
      destinationCity: "Ej. Monterrey",
      notes: "Ej. Llamada · WhatsApp · Pedido verbal",
    },
    hint: {
      notes: "Cómo lo pidieron y cualquier detalle útil para la operación.",
      baseRate: "Si ya la acordaron; si no, la capturas al confirmar.",
      startMileage:
        "Captura el odómetro al salir; se usa al confirmar e iniciar el viaje.",
      newClient: "Si el cliente no aparece en la lista,",
      arrival: "Opcional; puedes completarla al confirmar.",
      client: "Quién solicita el viaje.",
    },
    action: {
      newClient: "regístralo aquí",
    },
  },
} as const;
