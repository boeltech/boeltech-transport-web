/**
 * Copy — remolques (ADR-0077). Léxico operativo de flota (Capa 1 D8).
 */
export const trailersCopy = {
  list: {
    title: "Remolques",
    description:
      "Remolques de la flota: placa, tipo y si están libres, reservados o en viaje.",
    empty: "Aún no hay remolques",
    emptyHint: "Da de alta el primero para asignarlo a un viaje.",
    emptyFiltered: "No hay remolques con esos criterios",
    emptyFilteredHint: "Intenta ajustar la búsqueda o el estado.",
    clearFilters: "Limpiar filtros",
    searchPlaceholder: "Buscar por placa…",
    create: "Nuevo remolque",
    toast: {
      refreshed: "Lista actualizada",
    },
    filters: {
      status: "Estado",
      allStatuses: "Todos los estados",
      chipStatus: (label: string) => `Estado: ${label}`,
    },
    table: {
      plate: "Placa",
      type: "Tipo",
      typeMissing: "—",
      status: "Estado",
      notes: "Notas",
      notesEmpty: "—",
      empty: "No se encontraron remolques.",
    },
  },
  actions: {
    menu: "Acciones",
    edit: "Editar",
    delete: "Eliminar",
    deleting: "Eliminando…",
    deleteTitle: (plate: string) => `¿Eliminar el remolque ${plate}?`,
    deleteDescription:
      "Dejará de estar en el catálogo y no se podrá asignar a viajes.",
  },
  form: {
    createTitle: "Nuevo remolque",
    createSubtitle:
      "Indica la placa y el tipo. Después podrás asignarlo a un viaje.",
    editTitle: "Editar remolque",
    backToList: "Volver a remolques",
    section: {
      identity: "Datos del remolque",
      notes: "Notas",
    },
    label: {
      licensePlate: "Placa",
      satSubTipoRemCode: "Tipo de remolque",
      notes: "Notas",
    },
    placeholder: {
      licensePlate: "ABC1234",
      satSubTipoRemCode: "Elige el tipo",
      notes: "Observaciones de patio (opcional)",
    },
    submitCreate: "Registrar remolque",
    submitEdit: "Guardar cambios",
    cancel: "Cancelar",
    toast: {
      createSuccess: "Remolque registrado",
      updateSuccess: "Cambios guardados",
      deleteSuccess: "Remolque eliminado",
      errorTitle: "No se pudo guardar",
      deleteErrorTitle: "No se pudo eliminar",
    },
  },
  catalogSheet: {
    createTitle: "Nuevo remolque",
    createDescription:
      "Indica la placa y el tipo. Después podrás asignarlo a un viaje.",
    editTitle: "Editar remolque",
    editDescription: (plate: string) =>
      `Corrige placa, tipo o notas de ${plate}.`,
  },
  sheet: {
    title: "Alta rápida de remolque",
    description: "Placa y SubTipoRem. También puedes gestionarlos en Flota → Remolques.",
    submit: "Crear y seleccionar",
    cancel: "Cancelar",
    linkMaster: "Abrir maestro de remolques",
  },
  cutover: {
    vehicleNote:
      "Los remolques ya no se capturan en la unidad. Gestiona el pool en Flota → Remolques y asígnalos al crear o reservar el viaje.",
  },
} as const;
