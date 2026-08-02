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
      "Pedido y asignación: deja el viaje en borrador listo para confirmar",
    editSubtitle: (tripCode: string) =>
      tripCode ? `Editando ${tripCode}` : "Editando",
    backLabel: "Volver",
  },
  reserveBanner: {
    title: "Flujo de reserva",
    description:
      "Dos pasos: pedido comercial y asignación de unidad/conductor. Sin ruta ni cargas todavía. Completa el detalle después y confirma cuando el cliente cierre.",
  },
  step: {
    basic: { title: "Información", description: "Asignaciones y programación" },
    route: { title: "Ruta", description: "Paradas del viaje" },
    cargo: { title: "Cargas", description: "Mercancías a transportar" },
    costs: { title: "Costos", description: "Tarifa y conceptos estimados" },
    summary: { title: "Resumen", description: "Confirmar y crear" },
    pedido: {
      title: "Pedido",
      description: "Cliente, ruta operativa y fecha",
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
      "Revisa el pedido comercial",
      "Revisa la asignación",
    ] as const,
    stepSummaryFallback: "Revisa los siguientes campos",
    selectClient: "Selecciona el cliente que contrata el viaje",
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
    label: {
      originCity: "Ciudad de origen",
      destinationCity: "Ciudad de destino",
      notes: "Canal / notas del pedido",
      baseRate: "Tarifa base (opcional)",
    },
    placeholder: {
      originCity: "Ej. CDMX",
      destinationCity: "Ej. Monterrey",
      notes: "Ej. Canal: WhatsApp · Pedido verbal",
    },
    hint: {
      notes: "Deja el canal y el contexto del pedido. No es cotizador.",
      baseRate: "Puedes capturarla ahora o al confirmar la reserva.",
      newClient: "Si el cliente no está en el catálogo, ábrelo en otra pestaña.",
    },
    action: {
      newClient: "Alta de cliente",
    },
  },
} as const;
