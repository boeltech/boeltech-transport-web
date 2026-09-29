/**
 * Copy — remolques (ADR-0077). Léxico operativo de flota (Capa 1 D8).
 */
export const trailersCopy = {
  list: {
    title: "Remolques",
    description:
      "Remolques de la flota: placa, tipo y si están libres, reservados o en viaje.",
    descriptionManager:
      "Si patio no halló el remolque, dalo de alta aquí.",
    create: "Nuevo remolque",
    toast: {
      refreshed: "Lista actualizada",
    },
    actions: {
      clearFilters: "Limpiar filtros",
    },
    filter: {
      showFilters: "Filtros",
      searchPlaceholder: "Placa",
      statusLabel: "Estado",
      statusAll: "Todos",
    },
    chip: {
      status: (label: string) => `Estado: ${label}`,
    },
    empty: {
      title: "No se encontraron remolques",
      descriptionClear: "Comienza registrando el primer remolque",
      descriptionClearManager:
        "Patio no halló el remolque. Dalo de alta aquí.",
      descriptionReadonly:
        "Aún no hay remolques. Pide el alta a administración.",
      descriptionFiltered:
        "Nada coincide. Prueba otra placa, o limpia los recortes.",
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
