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
  overQuota: {
    title: "Sucursales por encima de tu plan",
    description: (active: number, max: number) =>
      `Tienes ${active} sucursal(es) activa(s) y tu plan incluye ${max}. Debes consolidar sucursales o mejorar tu plan para seguir asignando empleados a todas.`,
    adjustAction: "Ajustar sucursales al plan",
    billingHint: "Revisa tu plan en Plan y consumo.",
    reconcileSuccess: "Sucursales ajustadas al plan",
    reconcileError: "No se pudo ajustar las sucursales al plan",
    sheet: {
      title: "Ajustar sucursales al plan",
      description:
        "Elige qué sucursales conservarás activas. Las demás se desactivarán y sus empleados deberán moverse a una que permanezca activa.",
      intro: {
        title: "Tu plan incluye menos sucursales de las que tienes activas",
        body: (active: number, max: number) =>
          `Tienes ${active} sucursales activas y tu plan permite ${max}. Conserva ${max} y reasigna a sus empleados antes de confirmar.`,
      },
      selectionTitle: "Sucursales a conservar",
      counter: (selected: number, max: number) =>
        `${selected} de ${max} seleccionadas`,
      mainBadge: "Matriz",
      newMainBadge: "Nueva matriz",
      makeMain: "Hacer matriz",
      keepBadge: "Se conserva",
      deactivateBadge: "Se desactivará",
      mainHint:
        "La sucursal que conserves quedará como matriz de tu empresa; no necesitas cambiarla antes.",
      newMainNote: (label: string) => `${label} pasará a ser tu matriz.`,
      employeeCount: (count: number) =>
        `${count} ${count === 1 ? "empleado" : "empleados"}`,
      noEmployees: "Sin empleados",
      employeesTitle: "Reasignar empleados",
      employeesHint:
        "Estas sucursales se desactivarán. Mueve a sus empleados a una de las que conservarás.",
      destinationLabel: "Mover empleados a",
      destinationPlaceholder: "Selecciona una sucursal",
      confirm: "Confirmar ajuste",
      submitting: "Ajustando…",
      emptyBranches: "No hay sucursales activas para ajustar.",
      disabledReason: {
        selection: (max: number) =>
          `Selecciona ${max} ${max === 1 ? "sucursal" : "sucursales"} para continuar.`,
        reassign:
          "Asigna un destino a los empleados de las sucursales que se desactivarán.",
      },
    },
  },
  errors: {
    codeExists: {
      title: "Código duplicado",
      description:
        "Ya existe una sucursal activa con ese código. Elige otro código.",
    },
    mainExists: {
      title: "Matriz ya registrada",
      description:
        "Ya existe una sucursal principal activa. Designa otra matriz antes de marcar esta como principal.",
    },
    mainDeleteBlocked: {
      title: "No se puede eliminar la matriz",
      description:
        "Designa otra sucursal como principal antes de eliminar la matriz.",
    },
  },
  list: {
    title: "Sucursales",
    description: "Catálogo de sucursales de la empresa",
    entityLabelPlural: "sucursales",
    primaryAction: "Nueva sucursal",
    searchPlaceholder: "Buscar sucursal...",
    refreshSuccess: "Lista actualizada",
    capacity: {
      limited: (active: number, max: number) =>
        `${active} de ${max} sucursales activas`,
      unlimited: (active: number) => `Sin límite (${active} activas)`,
      limitReachedHint: "Límite de plan alcanzado",
      overQuotaHint: (active: number, max: number) =>
        `${active} activas · tu plan incluye ${max}`,
    },
    export: {
      label: "Exportar CSV",
      exporting: "Exportando...",
      toast: {
        success: "Exportación completada",
        empty: "No hay sucursales para exportar con los filtros actuales",
        error: "Error al exportar sucursales",
      },
      filePrefix: "sucursales",
    },
    showDeleted: {
      label: "Mostrar eliminadas",
      chip: "Vista: eliminadas",
    },
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
      restoreSuccess: "Sucursal restaurada",
      restoreError: "Error al restaurar sucursal",
    },
  },
  detail: {
    title: "Detalle de sucursal",
    header: {
      backLabel: "Volver a sucursales",
      subtitle: (code: string) => `Código ${code}`,
    },
    notFound: {
      title: "Sucursal no encontrada",
      description: "No se encontró la sucursal solicitada.",
      backLabel: "Volver a sucursales",
    },
    tabs: {
      summary: "Resumen",
      team: "Equipo y flota",
      performance: "Desempeño",
      history: "Historial",
    },
    stats: {
      margin: "Margen",
      trips: "Viajes",
      inProgress: "En curso",
      completed: "Completados",
    },
    cards: {
      contact: "Contacto",
      address: "Dirección",
      notes: "Notas",
      employees: "Empleados asignados",
      vehicles: "Vehículos asignados",
    },
    employees: {
      empty: "No hay empleados asignados a esta sucursal.",
      count: (n: number) =>
        n === 1 ? "1 empleado asignado" : `${n} empleados asignados`,
      viewEmployee: "Ver empleado",
    },
    vehicles: {
      empty: "No hay vehículos asignados a esta sucursal.",
      count: (n: number) =>
        n === 1 ? "1 vehículo asignado" : `${n} vehículos asignados`,
      viewVehicle: "Ver vehículo",
    },
    fields: {
      manager: "Responsable",
      phone: "Teléfono",
      email: "Correo",
      notDefined: "No registrado",
      notesEmpty: "Sin notas",
      addressEmpty: "Sin dirección registrada",
    },
    map: {
      title: "Ubicación en mapa",
      confirmedLabel: "Ubicación confirmada",
      noCoordinates: "Sin ubicación en mapa",
      noCoordinatesHint:
        "Indica el punto en el mapa al editar la sucursal.",
      mapUnavailable:
        "El mapa interactivo no está disponible. Puedes abrir la ubicación en un mapa externo.",
      completeLocationCta: "Completar ubicación",
      openExternal: "Abrir en mapa",
    },
    activity: {
      title: "Historial de cambios",
      empty:
        "Aún no hay eventos registrados. Los cambios (alta, edición, baja y restauración) aparecerán aquí.",
      syntheticHint: "Registro estimado a partir de la fecha de alta o edición",
      loadMore: "Cargar más",
      refresh: "Actualizar historial",
      error: "No se pudo cargar el historial de la sucursal.",
    },
    alerts: {
      inactiveMain: {
        title: "Principal inactiva",
        text: "Esta sucursal es la matriz pero está inactiva. Revisa su estado.",
      },
      missingContact: {
        title: "Sin contacto",
        text: "No hay teléfono ni correo registrados.",
      },
    },
    kpis: {
      title: "Desempeño operativo",
      compareCta: "Comparar en panel",
      periodLabel: (label: string) => `Período: ${label}`,
      periodHint:
        "Cambia el período, revisa la tendencia o abre los viajes de esta sucursal.",
      loading: "Cargando indicadores…",
      error: "No se pudieron cargar los indicadores de la sucursal.",
      viewTrips: "Ver viajes",
      metrics: {
        tripsMonth: "Viajes",
        inProgress: "En curso",
        completed: "Completados",
        vehicles: "Vehículos asignados",
        drivers: "Conductores",
        margin: "Margen",
      },
      trend: {
        title: "Tendencia por mes",
        description: "Viajes completados por mes",
        empty: "Sin viajes completados en el rango seleccionado.",
      },
    },
    toasts: {
      deleteSuccess: "Sucursal eliminada",
      deleteError: "Error al eliminar sucursal",
    },
  },
  create: {
    title: "Nueva sucursal",
    subtitle: "Registra una sucursal para operación",
    backLabel: "Volver a sucursales",
    stepsAriaLabel: "Pasos para registrar sucursal",
    submitLabel: "Crear sucursal",
    submittingLabel: "Creando...",
    stepHints: {
      general:
        "Datos de identificación y contacto. Los campos con * son obligatorios.",
      address:
        "Domicilio de la sucursal. Calle y número exterior son obligatorios; al capturar el código postal se autocompletan estado, municipio y colonias. Puedes confirmar la ubicación en el mapa de forma opcional.",
    },
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
    subtitle: (code: string) => `Código ${code}`,
    backLabel: "Volver al detalle",
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
    validationAddressSummary: "Revisa los campos de dirección antes de guardar.",
    sections: {
      general: {
        title: "Datos generales",
        description: "Información principal y datos de contacto",
        editDescription: "Identificación y estado operativo",
      },
      contact: {
        title: "Contacto",
        description: "Teléfono, correo y responsable de la sucursal",
      },
      address: {
        title: "Dirección",
        description:
          "País, estado, código postal, calle y número exterior son obligatorios; municipio y colonia son opcionales.",
      },
      geolocation: {
        description:
          "Opcional. Confirma en el mapa el punto exacto de la sucursal para rutas y seguimiento.",
      },
      notes: {
        title: "Notas",
        description: "Información operativa adicional (opcional)",
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
    actions: {
      cancel: "Cancelar",
    },
    fields: {
      code: {
        label: "Código",
        placeholder: "Ej. MTY-01",
        hint: "Identificador corto y único. Solo letras, números y guiones.",
        hintLocked: "El código no se puede cambiar una vez creada la sucursal.",
      },
      name: {
        label: "Nombre",
        placeholder: "Sucursal Monterrey",
      },
      status: {
        label: "Estado",
        placeholder: "Selecciona estado",
      },
      isMain: {
        label: "Sucursal principal",
        description: "Marca esta opción solo para la sucursal matriz.",
        yes: "Sí",
        no: "No",
      },
      phone: {
        label: "Teléfono",
        placeholder: "81 1234 5678",
      },
      email: {
        label: "Correo",
        placeholder: "sucursal@empresa.com",
      },
      managerName: {
        label: "Responsable",
        placeholder: "Nombre del responsable de sucursal",
      },
      notes: {
        label: "Notas",
        placeholder: "Notas operativas de la sucursal (opcional)",
      },
    },
    mainInactiveWarning: {
      title: "Principal e inactiva",
      text: "Marcaste la sucursal como principal pero su estado es inactivo. Normalmente la matriz debe permanecer activa.",
      editText:
        "Esta sucursal es la matriz pero está inactiva. Revisa su estado operativo.",
    },
    review: {
      hint: "Revisa la información antes de crear la sucursal. Usa «Editar» para corregir un bloque.",
      editLabel: "Editar",
      general: "Datos generales",
      contact: "Contacto",
      address: "Dirección",
      notes: "Notas",
      code: "Código",
      name: "Nombre",
      status: "Estado",
      isMain: "Sucursal principal",
      isMainYes: "Sí",
      isMainNo: "No",
      phone: "Teléfono",
      email: "Correo",
      manager: "Responsable",
      coordinates: "Coordenadas",
      empty: "No registrado",
      notesEmpty: "Sin notas",
    },
  },
  actions: {
    viewDetail: "Ver detalle",
    edit: "Editar",
    delete: "Eliminar",
    deleting: "Eliminando...",
    restore: "Restaurar",
    restoring: "Restaurando...",
    cancel: "Cancelar",
    deleteTitle: "¿Eliminar sucursal?",
    deleteDescription: (name: string) =>
      `Esta acción eliminará la sucursal ${name}. Esta acción no se puede deshacer.`,
    restoreTitle: "¿Restaurar sucursal?",
    restoreDescription: (name: string) =>
      `La sucursal ${name} volverá a estar activa en el catálogo.`,
    mainDeleteDisabled: "Designa otra matriz antes de eliminar esta sucursal",
    viewMore: "Ver más",
  },
  card: {
    mainBadge: "Principal",
  },
} as const;
