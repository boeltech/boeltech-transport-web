export const compensationCopy = {
  hub: {
    title: "Tarifas de pago",
    description: "Define cómo se paga a cada operador antes de liquidar.",
    settlementsBridge: "Al liquidar se usa la tarifa asignada al operador.",
    settlementsLink: "Ir a liquidaciones",
    guideTitle: "Cómo dejar listo el pago a operadores",
    tabs: {
      templates: "Tarifas",
      corridors: "Rutas con tarifa fija",
    },
    steps: [
      "Crea una tarifa",
      "Define cómo se paga (reglas o rutas fijas)",
      "Asigna operadores",
    ],
    readiness: {
      ariaLabel: "Estado de configuración del módulo",
      templatesActiveLabel: "tarifas activas",
      templatesIncompleteLabel: "sin pago definido",
      corridorsActiveLabel: "rutas con tarifa fija",
      assignmentsActiveLabel: "operadores con tarifa",
    },
    employeeAssignBanner: {
      title: "Este operador aún no tiene tarifa de pago",
      description:
        "Llegó desde liquidaciones sin una tarifa vigente. Elige abajo una tarifa lista para liquidar y asígnala, o crea una nueva.",
      descriptionNamed:
        "{{name}} no tiene una tarifa de pago vigente. Elige abajo una tarifa lista para liquidar y asígnala, o crea una nueva.",
      assignAction: "Asignar a esta tarifa",
      createAction: "Crear tarifa primero",
      periodContextHint: (periodStart: string, periodEnd: string) =>
        `Período del pago a cubrir: ${periodStart} – ${periodEnd}. Al asignar, la vigencia debe iniciar en o antes del inicio de ese período.`,
    },
  },
  templates: {
    title: "Tarifas de pago",
    description:
      "Tarifas reutilizables que puedes asignar a varios operadores con las mismas reglas.",
    create: "Nueva tarifa",
    emptyTitle: "Aún no hay tarifas de pago",
    emptyDescription:
      "Crea la primera, define cómo se paga y asígnala a operadores.",
    searchPlaceholder: "Buscar por nombre…",
    filters: {
      statusPlaceholder: "Estado",
      all: "Todos los estados",
      draft: "Borrador",
      active: "Activas",
      inactive: "Inactivas",
      chipLabel: (value: string) => `Estado: ${value}`,
    },
    columns: {
      name: "Nombre",
      status: "Estado",
      usage: "Uso",
      summary: "Cómo se paga",
      operators: "Operadores",
      actions: "Acciones",
    },
    usage: {
      ready: "Listo para liquidar",
      readyToActivate: "Lista para activar",
      needsPayment: "Falta definir el pago",
      paused: "Pausada",
    },
    status: {
      draft: "Borrador",
      active: "Activa",
      inactive: "Inactiva",
    },
    versionLabel: (version: number) => `v${version}`,
    completePayment: "Completar pago",
    edit: "Editar",
    activate: "Activar",
    deactivate: "Desactivar",
    createVersion: "Crear nueva versión",
    operators: "Operadores",
    operatorsCountLabel: "{{count}} operadores",
    summaryEmpty: "Sin configurar",
    /** Activo/inactivo de asignaciones y corredores (no el listado de tarifas). */
    active: "Activo",
    inactive: "Inactivo",
  },
  compositionCanvas: {
    blocks: {
      rules: "Reglas por ruta",
      allowances: "Prestaciones fijas (opcional)",
      corridors: "Rutas con tarifa fija",
    },
    emptyBlock: "Sin configurar",
    incompleteBadge: "Falta reglas o rutas",
    editingBadge: "Editando",
    incompleteTitle:
      "Para liquidar, agrega reglas por ruta o vincula una ruta con tarifa fija",
    missingSteps: {
      rules: "Agrega al menos una regla por tipo de ruta (opción A)",
      corridors: "Vincula al menos una ruta con tarifa fija (opción B)",
    },
    assignHere: "Asignar operador aquí",
    corridorFallbackTitle: "Ruta vinculada",
    metrics: {
      rules: "reglas",
      allowances: "prestaciones",
      corridors: "rutas",
    },
    expandCard: "Expandir tarifa {{name}}",
    collapseCard: "Contraer tarifa {{name}}",
    panelRegionLabel: "Composición de la tarifa {{name}}",
    panel: {
      compositionTitle: "Composición",
      corridorsTitle: "Rutas vinculadas",
    },
    operatorsEditingWarning:
      "Hay cambios sin guardar en la composición. Las prestaciones de la tarifa pueden no reflejarse en overrides hasta guardar.",
    viewDetail: "Abrir detalle",
    viewDetailSr: "Abrir detalle de la tarifa {{name}}",
    viewOperators: "Gestionar operadores",
    actions: {
      edit: "Editar tarifa",
      duplicate: "Duplicar tarifa",
      save: "Guardar",
      savePending: "Guardando…",
      cancelEdit: "Cancelar",
      duplicateSuffix: "(copia)",
    },
  },
  builder: {
    backLabel: "Volver a tarifas",
    sectionsAriaLabel: "Secciones de la tarifa",
    inspectorTitle: "Resumen",
    canvasAriaLabel: "Área de trabajo de la tarifa",
    collapseInspectorLabel: "Ocultar resumen",
    pageDescription:
      "Define cuánto se paga a los operadores con esta tarifa.",
    statusLabels: {
      complete: "completo",
      partial: "parcial",
      empty: "vacío",
    },
    discard: "Descartar",
    save: "Guardar",
    discardConfirmTitle: "¿Descartar cambios?",
    discardConfirmDescription:
      "Hay cambios sin guardar. Si sales ahora, se perderán.",
    discardConfirmAction: "Descartar cambios",
    discardKeepEditing: "Seguir editando",
    notFoundTitle: "Tarifa no encontrada",
    notFoundDescription: "La tarifa no existe o no tienes acceso.",
    loadingLabel: "Cargando tarifa…",
    noPermissionTitle: "Sin permiso para editar",
    noPermissionDescription: "Necesitas permiso de actualización en liquidaciones.",
    sections: {
      payment: "Pago por viaje",
      allowances: "Extras fijos",
      corridors: "Rutas con tarifa fija",
    },
    paymentDescription:
      "Cada clase de ruta puede tener su propia regla de pago. Debe coincidir con la clase elegida al despachar el viaje. Ejemplo: Foráneo a $3.00 por km. Solo una regla por clase.",
    duplicateRouteType:
      "Ya hay una regla para esta clase de ruta. Solo se permite una por clase (Local, Foráneo o Transfer / Patio).",
    addRuleDisabledAllTypes: "Ya hay una regla para cada clase de ruta.",
    midTripPolicyLabel: "Si cambia de operador a medio viaje",
    midTripPolicyHint:
      "Si un viaje lo completan dos operadores, el pago se divide según los kilómetros que hizo cada uno.",
    allowancesDescription:
      "Montos fijos que se suman al pago del operador en cada liquidación: comidas, viáticos, casetas u otros.",
    advancedSectionTitle: "Descuentos al operador",
    advancedSectionHint:
      "Montos que se descuentan del pago del operador: fondo de ahorro, retenciones u otros.",
    corridorsDescription:
      "Si el viaje coincide con una de estas rutas, se paga su tarifa fija en lugar del pago configurado arriba (regla por clase de ruta). Las prestaciones fijas y los descuentos siguen aplicando.",
    reviewIncomplete:
      "Para usar esta tarifa, agrega al menos una regla de pago por viaje o una ruta con tarifa fija.",
    reviewEmpty: "Sin configuración todavía.",
    inspectorLiveLabel: "Resumen en tiempo real",
    inspectorAllowancesHint:
      "Cada extra fijo se suma una vez por liquidación. El periodo indica cada cuánto aplica el acuerdo, no divide el monto.",
    inspectorDeductionsHint:
      "Los descuentos se restan del total antes de pagar al operador.",
    inspectorPrecedenceHint:
      "Si el viaje coincide con una ruta con tarifa fija, se paga esa tarifa. Si no, aplica el pago por clase de ruta.",
    completenessOk: "Tarifa lista para usar",
    statusDraft: "Borrador",
    statusActive: "Activa",
    statusInactive: "Inactiva",
    versionBadge: (version: number) => `v${version}`,
    toggleActiveLabel: "Tarifa activa",
    saveErrorTitle: "No se pudo guardar",
    lockedBannerTitle: "Esta tarifa ya fue utilizada en liquidaciones",
    lockedBannerDescription:
      "La configuración está bloqueada. Crea una nueva versión para cambiar el pago.",
    lockedBannerAction: "Crear nueva versión",
    reviewSaveFirst: "Guarda los cambios antes de activar.",
    reviewNotActivatable:
      "Agrega al menos una regla de pago o una ruta con tarifa fija para poder activar.",
    activateReassignWarning:
      "Los operadores siguen en la versión anterior hasta que los reasignes a esta.",
    historyTabLabel: "Historial",
    historyVersionsTitle: "Versiones",
    historyActivityTitle: "Actividad",
    historyEmptyVersions: "Sin otras versiones todavía.",
    historyEmptyActivity: "Sin actividad registrada.",
    historyOpenVersion: "Abrir",
    historyCurrentBadge: "Actual",
    trySchemeTitle: "Vista previa de liquidación",
    trySchemeWithOperator: "Vista previa con {{name}}",
    trySchemeAssignFirst: "Asigna un operador a esta tarifa para ver la vista previa.",
    trySchemeAssignLink: "Asignar operadores",
    addDescription: "Agregar nota",
    hideDescription: "Ocultar nota",
    identityBlockAriaLabel: "Datos de la tarifa",
    /** Label del campo route_type (no confundir con Facturación del viaje / CFDI). */
    routeTypeLabel: "Clase de ruta",
    /** Labels operativos para selects del builder (no tocan enums de settlements). */
    routeTypeLabels: {
      local: "Local",
      long_haul: "Foráneo",
      transfer: "Transfer / Patio",
    },
    commissionTypeLabels: {
      rate_per_km: "Pago por kilómetro recorrido",
      percentage_of_freight: "Porcentaje de lo que cobra el viaje",
      fixed_per_trip: "Importe fijo por viaje",
      none: "Sin pago extra",
    },
    allowanceTypeLabels: {
      meals: "Comidas",
      transport: "Transporte",
      per_diem: "Viáticos",
      lodging: "Hospedaje",
      fuel_allowance: "Combustible",
      tolls_allowance: "Casetas",
      employer_contribution: "Aportación patronal",
      other: "Otro pago fijo",
    },
    deductionTypeLabels: {
      savings_fund: "Fondo de ahorro",
      tax_withholding: "Retención de impuestos",
      union_dues: "Cuota sindical",
      equipment_rental: "Renta de equipo",
      other_deduction: "Otra deducción",
    },
    ruleRateLabels: {
      rate_per_km: "Pago por km",
      percentage_of_freight: "Porcentaje",
      fixed_per_trip: "Importe fijo",
      none: "Monto",
    },
    localNoExtraPayNote:
      "Esta clase de ruta no suma un pago extra (el sueldo y los pagos fijos se liquidan aparte).",
    paymentSectionTitle: "Pago por viaje",
    allowancesSectionTitle: "Extras fijos",
    deductionsSectionTitle: "Descuentos",
    corridorsSectionTitle: "Rutas con tarifa fija",
    noPaymentRules: "Sin pagos por clase de ruta",
    noAllowances: "Sin pagos fijos",
    noDeductions: "Sin deducciones",
    noCorridors: "Sin rutas con tarifa fija",
  },
  operatorsSheet: {
    title: "Operadores — {{name}}",
    description: "Asignaciones vigentes, overrides de prestaciones y asignación masiva.",
  },
  templateDetail: {
    tabs: {
      configuration: "Configuración",
      operators: "Operadores",
    },
    editInHub: "Editar en tarifas",
    editConfiguration: "Editar configuración",
    batchAssign: "Asignar operadores",
    rulesTitle: "Pago por clase de ruta",
    allowancesTitle: "Pagos fijos adicionales",
    deductionsTitle: "Deducciones",
    corridorsTitle: "Rutas con tarifa fija",
    noRules: "Sin pagos por clase de ruta",
    noAllowances: "Sin pagos fijos",
    noDeductions: "Sin deducciones",
    noCorridors: "Sin rutas con tarifa fija",
    backLabel: "Tarifas de pago",
    notFoundTitle: "Tarifa no encontrada",
    notFoundDescription: "La tarifa solicitada no existe o fue eliminada.",
    configureEmptyTitle: "Configura la tarifa de pago",
    configureEmptyDescription:
      "Agrega un pago por clase de ruta o vincula rutas con tarifa fija; los pagos fijos adicionales son opcionales.",
    configureEmptyCta: "Configurar tarifa",
    readOnlyTitle: "Modo solo lectura",
    readOnlyDescription:
      "Puedes consultar la configuración; para editar necesitas permiso de actualización en liquidaciones.",
  },
  corridors: {
    title: "Rutas con tarifa fija",
    description:
      "Catálogo de tarifas por origen y destino. Vincúlalas al editar una tarifa.",
    create: "Nueva ruta con tarifa fija",
    emptyTitle: "Sin rutas con tarifa fija",
    emptyDescription:
      "Registra rutas cuando ciertos trayectos no usan comisión por kilómetro.",
    searchPlaceholder: "Buscar ruta…",
    filters: {
      statusPlaceholder: "Estado",
      all: "Todos los estados",
      active: "Activas",
      inactive: "Inactivas",
      chipLabel: (value: string) => `Estado: ${value}`,
    },
    columns: {
      name: "Nombre",
      route: "Origen → destino",
      amount: "Tarifa fija",
      status: "Estado",
      actions: "Acciones",
    },
    duplicateBadge: "Duplicado",
    duplicateBanner:
      "Hay rutas con el mismo origen y destino. Solo una se aplicará en liquidación (la más reciente).",
  },
  corridorActions: {
    openMenuSr: "Abrir menú de acciones de ruta",
    edit: "Editar ruta",
    delete: "Eliminar ruta",
    deleteDialog: {
      title: "¿Eliminar ruta con tarifa fija?",
      description:
        "Solo elimina rutas que no estén vinculadas a tarifas de pago. Si está en uso, quítala de la tarifa primero.",
      confirm: "Eliminar",
      pending: "Eliminando…",
      cancel: "Cancelar",
    },
    toasts: {
      deleteSuccess: "Ruta eliminada",
      deleteError: "No se pudo eliminar la ruta",
    },
  },
  templateActions: {
    openMenuSr: "Abrir menú de acciones de la tarifa",
    activate: "Activar tarifa",
    deactivate: "Desactivar tarifa",
    createVersion: "Crear nueva versión",
    delete: "Eliminar tarifa",
    activateDialog: {
      title: "¿Activar esta tarifa?",
      description:
        "Pasará a usarse en liquidaciones. Si hay otra versión activa de la misma tarifa, se desactivará.",
      reassignWarning:
        "Los operadores asignados a una versión anterior no se mueven solos: reasígnarlos cuando quieras que cobren con esta.",
      confirm: "Activar",
      pending: "Activando…",
      cancel: "Cancelar",
    },
    deactivateDialog: {
      title: "¿Desactivar esta tarifa?",
      description:
        "Dejará de estar disponible para nuevas liquidaciones. No afecta liquidaciones ya hechas.",
      confirm: "Desactivar",
      pending: "Desactivando…",
      cancel: "Cancelar",
    },
    createVersionDialog: {
      title: "¿Crear una nueva versión?",
      description:
        "Se crea un borrador con la misma configuración. Los operadores siguen en la versión actual hasta que los reasignes.",
      confirm: "Crear versión",
      pending: "Creando…",
      cancel: "Cancelar",
    },
    deleteDialog: {
      title: "¿Eliminar tarifa de pago?",
      description:
        "Solo elimina tarifas sin operadores asignados ni liquidaciones que la referencien. Si está en uso, cierra o quita las asignaciones primero.",
      confirm: "Eliminar",
      pending: "Eliminando…",
      cancel: "Cancelar",
    },
    toasts: {
      activateSuccess: "Tarifa activada",
      activateError: "No se pudo activar la tarifa",
      deactivateSuccess: "Tarifa desactivada",
      deactivateError: "No se pudo desactivar la tarifa",
      createVersionSuccess: "Nueva versión creada",
      createVersionError: "No se pudo crear la versión",
      deleteSuccess: "Tarifa eliminada",
      deleteError: "No se pudo eliminar la tarifa",
      configLocked:
        "Esta tarifa ya fue utilizada en liquidaciones. Crea una nueva versión para editarla.",
      notActivatable:
        "Define el pago (reglas o rutas fijas) antes de activar la tarifa.",
      invalidTransition: "Esa transición de estado no está permitida.",
    },
    errors: {
      TEMPLATE_CONFIG_LOCKED:
        "Esta tarifa ya fue utilizada en liquidaciones. Crea una nueva versión para editarla.",
      TEMPLATE_NOT_ACTIVATABLE:
        "Define el pago (reglas o rutas fijas) antes de activar la tarifa.",
      TEMPLATE_INVALID_STATUS_TRANSITION:
        "Esa transición de estado no está permitida.",
    },
  },
  sheet: {
    templateCreateTitle: "Nueva tarifa",
    templateCreateHelp:
      "Se crea como borrador. Después defines cómo se paga y la activas cuando esté lista.",
    templateEditTitle: "Editar configuración",
    templateEditHelp:
      "Define reglas por clase de ruta, prestaciones fijas y rutas vinculadas. El sueldo se toma de la ficha del operador; crea rutas con tarifa fija en la pestaña Tarifas por corredor.",
    schemaDataTitle: "Datos de la tarifa",
    corridorsSectionHelp:
      "Selecciona rutas del tabulador. Si el viaje coincide, se paga la tarifa fija en lugar del pago por viaje (la regla genérica no se aplica).",
    localNoCommissionNote:
      "Esta clase de ruta no suma comisión adicional a la tarifa (el sueldo y prestaciones se liquidan aparte).",
    addRule: "Regla",
    addAllowance: "Prestación",
    addFixedPayment: "Pago fijo",
    addDeduction: "Deducción",
    allowanceType: "Tipo",
    allowanceLabel: "Etiqueta",
    allowanceAmount: "Monto",
    allowancePeriod: "Periodo",
    allowancePeriodHint:
      "Periodo = ritmo del acuerdo (cada cuánto aplica). El monto entra 1× por corte; no se divide por días.",
    deductionType: "Tipo",
    deductionLabel: "Etiqueta",
    deductionAmount: "Monto",
    deductionPeriod: "Periodo",
    deductionPeriodHint:
      "Periodo = ritmo del acuerdo. El monto se resta 1× del neto por corte.",
    deductionMandatory: "Obligatoria",
    remove: "Quitar",
    minimumGuaranteed: "Mínimo garantizado",
    corridorCreateTitle: "Nueva ruta con tarifa fija",
    corridorEditTitle: "Editar ruta con tarifa fija",
    corridorHelp:
      "Si el viaje coincide por ciudad de origen y destino, el operador cobra este monto fijo en lugar del pago genérico por viaje.",
    corridorSearchPlaceholder: "Buscar ruta…",
    trayectoSection: "Trayecto",
    frequentBlock: {
      title: "Elegir del historial",
      hint: "Rellena origen y destino. El monto lo defines tú.",
      triggerPlaceholder: "Buscar trayecto frecuente…",
      triggerAria: "Seleccionar trayecto frecuente",
      searchPlaceholder: "Buscar ciudad o trayecto…",
      empty: "Sin historial. Escribe origen y destino abajo.",
      loading: "Cargando trayectos frecuentes…",
      applyAria: (originCity: string, destinationCity: string) =>
        `Usar trayecto ${originCity} a ${destinationCity}`,
      tripCount: (count: number) =>
        `${count} viaje${count === 1 ? "" : "s"}`,
    },
    batchTitle: "Asignación masiva",
    batchDescription:
      "Selecciona operadores y revisa conflictos de vigencia antes de confirmar.",
    fields: {
      name: "Nombre",
      description: "Descripción",
      templateActive: "Tarifa activa",
      corridorActive: "Ruta activa",
      originCity: "Ciudad de origen",
      destinationCity: "Ciudad de destino",
      cityPlaceholder: "Ej. Monterrey",
      cityMatchHint:
        "Debe coincidir con la ciudad del viaje (mayúsculas no importan).",
      refValueByType: {
        branch: "Sucursal",
        city_label: "Ciudad",
        postal_code: "Código postal",
      },
      legacyMatchDefinition: "Definición de coincidencia",
      legacyOriginLabel: "Origen",
      legacyDestinationLabel: "Destino",
      legacyAlertOriginBranch:
        "Definida por sucursal de origen; sigue pudiendo coincidir en liquidación. En v1 solo editamos rutas por ciudad — convierte o ajusta monto/nombre/notas.",
      legacyAlertDeadMatch:
        "Esta definición no coincide en liquidación hoy. Puedes convertirla a ciudad o solo ajustar monto, nombre y notas.",
      convertToCity: "Convertir a ciudad",
      convertToCityConfirmTitle: "¿Convertir a coincidencia por ciudad?",
      convertToCityConfirmDescription:
        "Indicarás ciudad de origen y destino. Al guardar, esta ruta dejará de usar la definición anterior.",
      convertToCityConfirmAction: "Convertir",
      fixedAmount: "Tarifa fija",
      notes: "Notas (opcional)",
      corridorActiveHint:
        "Si la desactivas, esta ruta no se aplicará en liquidaciones futuras. Puedes reactivarla después.",
      effectiveFrom: "Vigente desde",
      effectiveTo: "Vigente hasta (opcional)",
      closePrevious: "Cerrar asignación anterior al iniciar la nueva",
      reason: "Motivo (opcional)",
      operators: "Operadores",
    },
    ruleRateLabels: {
      rate_per_km: "Tarifa por km",
      percentage_of_freight: "Porcentaje sobre flete",
      fixed_per_trip: "Importe fijo por viaje",
      none: "Monto",
    },
    save: "Guardar",
    savePending: "Guardando…",
    cancel: "Cancelar",
    validationSummary: "Revisa los campos marcados",
    confirmBatch: "Confirmar asignación",
    conflictPreviewTitle: "Conflictos detectados",
    conflictPreviewDescription:
      "Estos operadores tienen otra asignación activa con vigencia traslapada. Se omitirán al confirmar si persiste el conflicto.",
    coverageHint: (periodStart: string, periodEnd: string) =>
      `Para cubrir el pago del ${periodStart} al ${periodEnd}, la vigencia debe iniciar en o antes del ${periodStart}.`,
    coverageWarningTitle: "Esta vigencia no cubre el período del pago",
    coverageWarningDescription: (periodStart: string, periodEnd: string) =>
      `El pago va del ${periodStart} al ${periodEnd}. Si la vigencia inicia después del ${periodEnd}, al armar el pago no se encontrará tarifa para ese rango.`,
    createCorridorLink: "Crear ruta con tarifa fija",
    manageCorridorsLink: "Ver catálogo de rutas",
    duplicateConfirmTitle: "¿Guardar ruta duplicada?",
    duplicateConfirmDescription:
      "Ya existe otra ruta con el mismo origen y destino. En liquidación solo se aplicará una (la más reciente).",
    duplicateConfirmAction: "Guardar de todos modos",
    saveForbidden: "No tienes permiso para guardar rutas con tarifa fija.",
  },
  assignments: {
    columns: {
      operator: "Operador",
      effectiveFrom: "Desde",
      effectiveTo: "Hasta",
      status: "Estado",
    },
    active: "Activa",
    inactive: "Inactiva",
    empty:
      "Ningún operador asignado a esta tarifa. Usa asignación masiva para vincular operadores.",
    emptyTitle: "Sin operadores asignados",
    expandRow: "Expandir fila de prestaciones",
    collapseRow: "Contraer fila de prestaciones",
  },
  assignmentActions: {
    openMenuSr: "Abrir menú de acciones de asignación",
    deactivate: "Desactivar asignación",
    closeValidity: "Cerrar vigencia…",
    delete: "Eliminar asignación",
    deactivateDialog: {
      title: "¿Desactivar asignación?",
      description:
        "La asignación dejará de aplicarse en liquidaciones futuras. No afecta liquidaciones ya creadas.",
      confirm: "Desactivar",
      pending: "Desactivando…",
      cancel: "Cancelar",
    },
    closeValidityDialog: {
      title: "Cerrar vigencia de asignación",
      description: "Indica la última fecha en que esta tarifa aplica al operador.",
      dateLabel: "Vigente hasta",
      confirm: "Cerrar vigencia",
      pending: "Guardando…",
      cancel: "Cancelar",
    },
    deleteDialog: {
      title: "¿Eliminar asignación?",
      description:
        "Solo elimina asignaciones que no hayan sido usadas en liquidaciones. Si ya se liquidó, cierra la vigencia en su lugar.",
      confirm: "Eliminar",
      pending: "Eliminando…",
      cancel: "Cancelar",
    },
    toasts: {
      deactivateSuccess: "Asignación desactivada",
      deactivateError: "Error al desactivar asignación",
      closeValiditySuccess: "Vigencia cerrada",
      closeValidityError: "Error al cerrar vigencia",
      deleteSuccess: "Asignación eliminada",
      deleteError: "Error al eliminar asignación",
    },
  },
  allowanceOverrides: {
    title: "Suspensión de prestaciones por período",
    description:
      "Suspende una prestación fija para este operador en el rango indicado. La liquidación del período omitirá el monto suspendido.",
    periodStart: "Inicio del período",
    periodEnd: "Fin del período",
    suspendedLabel: "Suspendida",
    activeLabel: "Activa",
    noAllowancesOnTemplate: "Esta tarifa no define prestaciones fijas.",
    missingAllowanceId: "No se pudo identificar la prestación. Recarga la tarifa.",
    toasts: {
      suspended: "Prestación suspendida para el período",
      resumed: "Prestación reactivada para el período",
      error: "Error al actualizar suspensión",
    },
  },
  simulation: {
    tabLabel: "Simulación",
    summaryTabLabel: "Resumen",
    title: "Simulador de pago",
    routeTypeLabel: "Clase de ruta",
    distanceLabel: "Distancia",
    distanceSuffix: "km",
    freightRevenueLabel: "Ingreso del viaje",
    resultTitle: "Pago estimado",
    grossLabel: "Subtotal",
    deductionsLabel: "Descuentos",
    totalLabel: "PAGO NETO",
    emptyResult: "Configura al menos una regla de pago para ver la estimación.",
    noRuleForRouteType:
      "No hay regla para esta clase de ruta. Agrega una para ver el resultado.",
    disclaimer:
      "Esta es una estimación. El pago real depende de los viajes del operador y de cómo se configure su asignación.",
    corridorOverrideNote:
      "Si el viaje coincide con una ruta fija, se usa su tarifa en lugar del pago por viaje (se ignora la regla genérica para esa ruta).",
    corridorLabel: "Usar tarifa de ruta fija",
    corridorAmountLabel: "Monto fijo",
    routeTypes: {
      local: "Local",
      long_haul: "Foráneo",
      transfer: "Transfer / Patio",
    },
  },
  presets: {
    title: "Nueva tarifa de pago",
    subtitle: "¿Cómo quieres comenzar?",
    subtitleDescription:
      "Elige una plantilla como punto de partida. Puedes cambiar todo después.",
    blankName: "Desde cero",
    blankDescription: "Define tus propios conceptos de pago.",
    step2Title: "Nombre de la tarifa",
    step2Back: "Cambiar plantilla",
    prefilledHint: "Se creará como borrador con:",
    customizeHint:
      "Después configurarás el pago y la activarás cuando esté lista.",
    nameLabel: "Nombre",
    namePlaceholder: "Ej. Operador Foráneo Norte",
    descriptionLabel: "Nota (opcional)",
    descriptionPlaceholder: "Descripción o propósito de esta tarifa",
    cancel: "Cancelar",
    create: "Crear y configurar",
    creating: "Creando…",
  },
  toasts: {
    templateCreated: "Borrador de tarifa creado",
    templateCreateError: "No se pudo crear la tarifa",
    templateUpdated: "Tarifa actualizada",
    templateActivated: "Tarifa activada",
    templateDeactivated: "Tarifa desactivada",
    templateVersionCreated: "Nueva versión creada",
    templateDeleted: "Tarifa eliminada",
    corridorCreated: "Ruta creada",
    corridorUpdated: "Ruta actualizada",
    corridorSaveError: "No se pudo guardar la ruta",
    corridorDeleted: "Ruta eliminada",
    batchSuccess: "Asignación completada",
    batchPartial:
      "Asignación parcial: algunos operadores se omitieron por conflicto de vigencia.",
    dataRefreshed: "Datos actualizados",
  },
} as const;
