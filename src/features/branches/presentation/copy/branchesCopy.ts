/**
 * Copy — módulo Sucursales
 */

export const branchesCopy = {
  limitReached: {
    title: "Sin plazas libres en tu plan",
    description:
      "Tu plan no tiene plazas libres para más sucursales activas. Revisa Tu plan para ampliarlo.",
    descriptionWithLimit: (max: number) =>
      `Ya tienes ${max} sucursales activas, el máximo de tu plan. Desactiva una o amplía el plan para registrar otra.`,
    createDisabled: "Sin plazas libres en tu plan",
    billingCta: "Ver Tu plan",
  },
  overQuota: {
    title: "Sucursales por encima de tu plan",
    description: (active: number, max: number) =>
      `Tienes ${active} sucursal(es) activa(s) y tu plan incluye ${max}. Debes consolidar sucursales o mejorar tu plan para seguir asignando empleados a todas.`,
    adjustAction: "Ajustar sucursales al plan",
    billingHint: "Ver Tu plan",
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
    description:
      "Dónde opera tu empresa y cuántas plazas de sucursal quedan en tu plan.",
    entityLabelPlural: "sucursales",
    primaryAction: "Nueva sucursal",
    searchPlaceholder: "Buscar por código, nombre o ciudad…",
    refreshSuccess: "Lista actualizada",
    capacity: {
      limited: (active: number, max: number) =>
        `${active} de ${max} sucursales activas`,
      unlimited: (active: number) => `Sin límite (${active} activas)`,
      limitReachedHint: "Sin plazas libres en tu plan",
      overQuotaHint: (active: number, max: number) =>
        `${active} activas · tu plan incluye ${max}`,
    },
    export: {
      label: "Exportar CSV",
      exporting: "Exportando…",
      toast: {
        success: "Exportación completada",
        empty: "No hay sucursales para exportar con los filtros actuales",
        error: "No se pudo exportar",
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
      statusAll: "Todos los estados",
      type: "Tipo",
      typeAll: "Todos los tipos",
      typeMain: "Matriz",
      typeSecondary: "Secundaria",
      more: "Más filtros",
      moreHeading: "Filtros por fecha",
      createdHeading: "Fecha de alta",
      from: "Desde",
      to: "Hasta",
      apply: "Aplicar",
      cancel: "Cancelar",
      clearDates: "Limpiar fechas",
      statusChip: (label: string) => `Estado: ${label}`,
      typeChip: (isMain: boolean) =>
        `Tipo: ${isMain ? "Matriz" : "Secundaria"}`,
      chipDates: (label: string) => `Fechas: ${label}`,
      rangeBoth: (from: string, to: string) => `${from} - ${to}`,
      rangeFrom: (from: string) => `Desde ${from}`,
      rangeTo: (to: string) => `Hasta ${to}`,
      createdPrefix: (range: string) => `Alta: ${range}`,
    },
    empty: {
      title: "No hay sucursales",
      filteredTitle: "No se encontraron sucursales",
      descriptionFiltered: "Prueba ajustando los filtros de búsqueda.",
      descriptionDefault: "Registra la primera sucursal de tu empresa.",
      clearFilters: "Quitar filtros",
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
    title: "Datos de la sucursal",
    titleWithName: (name: string) => name,
    subtitle: (code: string, isMain = false) =>
      isMain ? `Código ${code} · Matriz` : `Código ${code}`,
    backLabel: "Volver al detalle",
    mainBadge: "Matriz",
    notFound: {
      title: "Sucursal no encontrada",
      description: "No encontramos la sucursal que quieres editar.",
      backLabel: "Volver a sucursales",
    },
    toasts: {
      successTitle: "Cambios guardados",
      successDescription: "La sucursal quedó actualizada",
      errorTitle: "No se pudieron guardar los cambios",
    },
  },
  form: {
    validationToastTitle: "Revisa los datos",
    validationSummaryWizard: "Revisa la información de la sucursal",
    validationSummaryEdit: "Revisa los datos marcados",
    validationAddressSummary: "Revisa la ubicación antes de guardar.",
    sections: {
      general: {
        title: "Datos generales",
        editTitle: "Identidad y operación",
        description: "Código, nombre, estado y contacto",
        editDescription: "Nombre, estado y si es la matriz de tu empresa.",
      },
      contact: {
        title: "Contacto",
        description: "Teléfono, correo y responsable",
      },
      address: {
        title: "Dirección",
        editTitle: "Ubicación",
        description: "Dónde opera la sucursal.",
        editDescription:
          "Dónde opera esta sucursal. Puedes marcar el punto en el mapa.",
      },
      geolocation: {
        description:
          "Opcional. Usa «Ubicar en el mapa» para confirmar el punto a partir del domicilio.",
      },
      notes: {
        title: "Notas",
        description: "Apuntes operativos (opcional)",
      },
      review: {
        title: "Revisión",
        description: "Confirma los datos antes de registrar la sucursal",
      },
    },
    submit: {
      saving: "Guardando…",
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
        hint: "Corto y único. Letras, números y guiones.",
        hintLocked: "No se puede cambiar después del alta.",
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
        label: "Matriz",
        description: "Solo una sucursal de tu empresa es la matriz.",
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
        placeholder: "Apuntes operativos (opcional)",
      },
    },
    mainInactiveWarning: {
      title: "Matriz inactiva",
      text: "Marcaste esta sucursal como matriz pero está inactiva. La matriz suele permanecer activa.",
      editText:
        "Esta sucursal es la matriz y está inactiva. Revisa su estado.",
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
      isMain: "Matriz",
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
    mainBadge: "Matriz",
  },
} as const;
