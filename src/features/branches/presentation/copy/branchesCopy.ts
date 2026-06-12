/**
 * Copy — módulo Sucursales
 */

export const branchesCopy = {
  limitReached: {
    title: "Límite de sucursales alcanzado",
    description:
      "Tu plan actual no permite registrar más sucursales. Contacta a soporte para ampliar tu plan.",
    createDisabled: "Límite de plan alcanzado",
  },
  list: {
    title: "Sucursales",
    description: "Catálogo de sucursales de la empresa",
    entityLabelPlural: "sucursales",
    primaryAction: "Nueva sucursal",
    searchPlaceholder: "Buscar sucursal...",
    refreshSuccess: "Lista actualizada",
    columns: {
      code: "Código",
      name: "Nombre",
      city: "Ciudad",
      contact: "Contacto",
      status: "Estado",
    },
    filters: {
      status: "Estado",
      statusAll: "Todos",
      type: "Tipo",
      typeAll: "Todas",
      typeMain: "Principal",
      typeSecondary: "Secundaria",
      statusChip: (label: string) => `Estado: ${label}`,
      typeChip: (isMain: boolean) =>
        `Tipo: ${isMain ? "Principal" : "Secundaria"}`,
    },
    empty: {
      title: "No se encontraron sucursales",
      descriptionFiltered: "Intenta ajustar los filtros de búsqueda.",
      descriptionDefault: "Comienza registrando la primera sucursal.",
      clearFilters: "Limpiar filtros",
    },
    toasts: {
      deleteSuccess: "Sucursal eliminada",
      deleteError: "Error al eliminar sucursal",
    },
  },
  detail: {
    title: "Detalle de sucursal",
    subtitle: (code: string) => `Código ${code}`,
    notFound: {
      title: "Sucursal no encontrada",
      description: "No se encontró la sucursal solicitada.",
      backLabel: "Volver a sucursales",
    },
    stats: {
      isMain: "Sucursal principal",
      isMainYes: "Sí",
      isMainNo: "No",
      operationalStatus: "Estado operativo",
      active: "Activa",
      inactive: "Inactiva",
    },
    cards: {
      contact: "Contacto",
      address: "Dirección",
      notes: "Notas",
    },
    fields: {
      manager: "Responsable",
      phone: "Teléfono",
      email: "Correo",
      street: "Calle",
      neighborhood: "Colonia",
      cityState: "Ciudad / Estado",
      postalCountry: "CP / País",
      notDefined: "No definido",
      neighborhoodNotDefined: "No definida",
      notesEmpty: "Sin notas registradas",
    },
    alerts: {
      inactiveMain: {
        title: "Sucursal principal inactiva",
        text: "Esta sucursal está inactiva pero marcada como principal. Revisa el estado operativo.",
      },
      missingContact: {
        title: "Sin datos de contacto",
        text: "No hay teléfono ni correo registrados para esta sucursal.",
      },
    },
    toasts: {
      deleteSuccess: "Sucursal eliminada",
      deleteError: "Error al eliminar sucursal",
    },
    /** Reservado para tabs futuros (empleados, historial, etc.). */
    tabsFutureNote:
      "Tabs de sub-recursos (empleados asignados, historial) pendientes de implementación.",
  },
  create: {
    title: "Nueva sucursal",
    subtitle: "Registra una sucursal para operación",
    backLabel: "Volver a sucursales",
    stepsAriaLabel: "Pasos para registrar sucursal",
    submitLabel: "Crear sucursal",
    submittingLabel: "Creando...",
    stepHint: "Completa los campos obligatorios del paso para continuar.",
    steps: [
      {
        id: "general",
        title: "Información general",
        description: "Código, nombre, estado y contacto",
      },
      {
        id: "address",
        title: "Dirección",
        description: "Ubicación de la sucursal",
      },
      {
        id: "review",
        title: "Revisión",
        description: "Confirmar datos antes de crear",
      },
    ],
    toasts: {
      success: (name: string) => `${name} se registró correctamente`,
      successTitle: "Sucursal creada",
      errorTitle: "Error al crear sucursal",
    },
  },
  edit: {
    title: "Editar sucursal",
    titleWithName: (name: string) => `Editar ${name}`,
    subtitle: (code: string) => `Código: ${code}`,
    notFound: {
      title: "Sucursal no encontrada",
      description: "No existe la sucursal que intentas editar.",
      backLabel: "Volver a sucursales",
    },
    toasts: {
      successTitle: "Sucursal actualizada",
      successDescription: "Los cambios se guardaron correctamente",
      errorTitle: "Error al actualizar sucursal",
    },
  },
  form: {
    validationToastTitle: "Revisa el formulario",
    validationSummaryWizard: "Revisa la información de la sucursal",
    validationSummaryEdit: "Revisa los siguientes campos",
    sections: {
      general: {
        title: "Datos generales",
        description: "Información principal y datos de contacto",
      },
      address: {
        title: "Dirección y notas",
        description: "Ubicación física de la sucursal",
      },
      review: {
        title: "Revisión",
        description: "Confirma los datos antes de registrar la sucursal",
      },
    },
    submit: {
      saving: "Guardando...",
      saveChanges: "Guardar cambios",
      create: "Crear sucursal",
    },
  },
  actions: {
    viewDetail: "Ver detalle",
    edit: "Editar",
    delete: "Eliminar",
    deleting: "Eliminando...",
    cancel: "Cancelar",
    deleteTitle: "¿Eliminar sucursal?",
    deleteDescription: (name: string) =>
      `Esta acción eliminará la sucursal ${name}. Esta acción no se puede deshacer.`,
    viewMore: "Ver más",
  },
  card: {
    mainBadge: "Principal",
  },
} as const;
