export const compensationCopy = {
  hub: {
    title: "Tarifas de pago",
    description: "Define cómo se paga a cada operador antes de armar el pago.",
    settlementsBridge: "Al armar el pago se usa la tarifa asignada al operador.",
    settlementsLink: "Ir a Pagos a operadores",
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
        "Llegó desde Pagos a operadores sin una tarifa vigente. Elige abajo una tarifa lista para armar el pago y asígnala, o crea una nueva.",
      descriptionNamed:
        "{{name}} no tiene una tarifa de pago vigente. Elige abajo una tarifa lista para armar el pago y asígnala, o crea una nueva.",
      assignAction: "Asignar a esta tarifa",
      createAction: "Crear tarifa primero",
      dismissAction: "Cerrar aviso",
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
    loadErrorTitle: "No se pudieron cargar las tarifas",
    loadError: "Intenta de nuevo. Si persiste, vuelve más tarde.",
    retry: "Reintentar",
    searchPlaceholder: "Buscar por nombre…",
    filters: {
      statusPlaceholder: "Estado",
      current: "Vigentes",
      active: "Activas",
      draft: "Borradores",
      superseded: "Reemplazadas",
      deactivated: "Desactivadas",
      all: "Todos los estados",
      inactive: "Reemplazadas o desactivadas",
      chipLabel: (value: string) => `Estado: ${value}`,
    },
    currentEmpty: {
      title: "No hay tarifas vigentes",
      description:
        "Las tarifas desactivadas y las reemplazadas sin operadores están en «Todos los estados».",
      viewAll: "Ver todos los estados",
    },
    family: {
      otherVersions: (count: number) => `Otras versiones (${count})`,
      hideOtherVersions: "Ocultar otras versiones",
      otherVersionsAria: (name: string, count: number) =>
        `Ver otras versiones de ${name} (${count})`,
      hideOtherVersionsAria: (name: string) => `Ocultar otras versiones de ${name}`,
      supersededOperators: (count: number) =>
        count === 1
          ? "1 operador sigue con una versión reemplazada"
          : `${count} operadores siguen con una versión reemplazada`,
      supersededOperatorsTooltip: (current: number, scheduled: number) =>
        `${current} cobran hoy${scheduled > 0 ? ` y ${scheduled} empiezan después` : ""} con una versión reemplazada. Para que cobren con esta versión, asígnalos aquí indicando desde qué fecha.`,
      loadError: "No se pudieron cargar las versiones.",
      retry: "Reintentar",
      empty: "Sin otras versiones todavía.",
    },
    columns: {
      name: "Nombre",
      status: "Estado",
      summary: "Cómo se paga",
      operators: "Operadores",
      actions: "Acciones",
    },
    statusLine: {
      needsPayment: "Falta definir el pago",
      readyToActivate: "Lista para activar",
      supersededPaying: (count: number) =>
        count === 1
          ? "Paga a 1 operador hasta que lo reasignes"
          : `Paga a ${count} operadores hasta que los reasignes`,
      supersededNone: "Sin operadores asignados",
      supersededScheduled: (count: number) =>
        `${count} ${count === 1 ? "programado" : "programados"}`,
      deactivated: "No calcula pagos",
    },
    rowAriaLabel: (name: string, version: number) =>
      `Abrir operadores de ${name} v${version}`,
    listSummary: {
      perKm: (routeType: string, amount: string) => `${routeType} ${amount}/km`,
      perTrip: (routeType: string, amount: string) => `${routeType} ${amount}/viaje`,
      percentage: (routeType: string, percent: string) => `${routeType} ${percent}% del flete`,
      noPay: (routeType: string) => `${routeType} sin pago por viaje`,
      oneCorridor: (amount: string) => `1 ruta fija ${amount}`,
      corridorRange: (count: number, min: string, max: string) =>
        `${count} rutas fijas ${min}–${max}`,
      corridorSame: (count: number, amount: string) => `${count} rutas fijas ${amount} c/u`,
      allowances: (count: number) =>
        `+${count} ${count === 1 ? "pago fijo" : "pagos fijos"}`,
      deductions: (count: number) =>
        `−${count} ${count === 1 ? "deducción" : "deducciones"}`,
      tooltipTitle: "Cómo se paga",
      tooltipMinimum: (amount: string) => `Mínimo garantizado ${amount}`,
      tooltipCorridor: (name: string, route: string, amount: string) =>
        `${name}: ${route} · ${amount}`,
      tooltipCorridorInactive: "(inactiva)",
      tooltipAllowance: (label: string, amount: string, period?: string) =>
        period ? `${label}: ${amount} · ${period}` : `${label}: ${amount}`,
      tooltipDeduction: (label: string, amount: string, period?: string) =>
        period ? `${label}: −${amount} · ${period}` : `${label}: −${amount}`,
      allowanceFallback: "Pago fijo",
      deductionFallback: "Deducción",
    },
    status: {
      draft: "Borrador",
      active: "Activa",
      inactive: "Inactiva",
      superseded: "Reemplazada",
      deactivated: "Desactivada",
    },
    statusTooltips: {
      superseded:
        "Ya hay otra versión activa de esta tarifa. Esta sigue calculando el pago de los operadores asignados a ella hasta que los reasignes.",
      deactivated:
        "No calcula pagos, ni siquiera de los operadores que sigan asignados a ella.",
    },
    versionLabel: (version: number) => `v${version}`,
    operatorsScheduled: (count: number) =>
      `+${count} ${count === 1 ? "programada" : "programadas"}`,
    operatorsTooltip: (current: number, scheduled: number) => {
      const today = `${current} ${current === 1 ? "operador cobra" : "operadores cobran"} con esta versión hoy.`;
      if (scheduled <= 0) return today;
      return `${today} ${scheduled} más ${scheduled === 1 ? "empieza" : "empiezan"} después.`;
    },
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
      "Para armar el pago, agrega reglas por ruta o vincula una ruta con tarifa fija",
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
    notFoundTitle: "Tarifa no encontrada",
    notFoundDescription: "La tarifa no existe o no tienes acceso.",
    loadingLabel: "Cargando tarifa…",
    noPermissionTitle: "Sin permiso para editar",
    noPermissionDescription: "Necesitas permiso de actualización en pagos a operadores.",
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
      "Montos fijos que se suman al pago del operador en cada pago: comidas, viáticos, casetas u otros.",
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
      "Cada extra fijo se suma una vez por pago. El periodo indica cada cuánto aplica el acuerdo, no divide el monto.",
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
    lockedBannerTitle: "Esta tarifa ya fue utilizada en pagos",
    lockedBannerDescription:
      "La configuración está bloqueada. Crea una nueva versión para cambiar el pago.",
    lockedBannerAction: "Crear nueva versión",
    supersededBanner: {
      title: "Esta versión ya fue reemplazada",
      assignments: (count: number) =>
        count === 0
          ? "Hoy no tiene operadores asignados y su configuración ya no se puede cambiar. Para cambiarla, crea una nueva versión."
          : count === 1
            ? "Sigue calculando el pago de 1 operador asignado a esta versión hasta que lo reasignes, pero su configuración ya no se puede cambiar. Para cambiarla, crea una nueva versión."
            : `Sigue calculando el pago de ${count} operadores asignados a esta versión hasta que los reasignes, pero su configuración ya no se puede cambiar. Para cambiarla, crea una nueva versión.`,
      activeVersionSameName: (version: number) =>
        `La versión activa hoy es la ${version}.`,
      activeVersionRenamed: (name: string, version: number) =>
        `La versión activa hoy es ${name} versión ${version}.`,
      noActiveVersion: "Ninguna versión de esta tarifa está activa hoy.",
      openActiveVersion: (version: number) => `Abrir versión ${version}`,
    },
    deactivatedOperatorsBanner: {
      title: "Versión desactivada con operadores asignados",
      description: (count: number) =>
        count === 1
          ? "1 operador sigue asignado a esta versión y no puede cobrar con ella. Reasígnalo a otra versión para que pueda cobrar."
          : `${count} operadores siguen asignados a esta versión y no pueden cobrar con ella. Reasígnalos a otra versión para que puedan cobrar.`,
      viewOperators: "Ver operadores",
    },
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
    historySupersededOn: (date: string) => `Reemplazada el ${date}`,
    historyDeactivatedOn: (date: string) => `Desactivada el ${date}`,
    trySchemeTitle: "Vista previa del pago",
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
      percentage_of_freight: "Porcentaje del flete",
      fixed_per_trip: "Importe fijo por viaje",
      none: "Sin pago por viaje",
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
      "Esta clase de ruta no tiene pago por viaje (el sueldo y los pagos fijos se calculan aparte).",
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
    title: (name: string, version: number) => `Operadores — ${name} versión ${version}`,
    description:
      "Operadores asignados a esta versión y su vigencia. Desde aquí puedes asignar varios a la vez.",
    supersededNotice: {
      stillPaying:
        "Esta versión ya fue reemplazada, pero hay operadores que todavía cobran o cobrarán con ella. Para que cobren con la versión activa, asígnalos desde esa versión indicando desde qué fecha.",
      nonePaying: "Esta versión ya fue reemplazada y ningún operador cobra con ella.",
      history: "Las asignaciones de abajo se conservan como historial.",
    },
    deactivatedNotice:
      "Esta versión está desactivada y no calcula pagos, ni siquiera de los operadores asignados aquí. Asígnalos a otra versión para que puedan cobrar.",
    focusNotice: {
      title: (name: string) => `Asignación de ${name}`,
      untitled: "Asignación del operador",
      description: (origin: string, effectiveFrom: string | null) =>
        `Para que cobre con ${origin}${effectiveFrom ? ` desde el ${effectiveFrom}` : ""}, desactiva esta asignación desde el menú ··· de su fila. Si tiene días ya liquidados, el sistema te dirá desde qué fecha puedes cerrarla.`,
      originFallback: "la otra versión",
      done: "Listo: su asignación en esta versión quedó desactivada. Vuelve para asignarlo.",
      notFound:
        "No encontramos esa asignación en esta versión; pudo haber cambiado. Revisa la lista.",
      returnTo: (origin: string) => `Volver a ${origin}`,
      returnFallback: "Volver a la asignación masiva",
      dismiss: "Listo",
    },
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
      "Puedes consultar la configuración; para editar necesitas permiso de actualización en pagos a operadores.",
  },
  corridors: {
    title: "Rutas con tarifa fija",
    description:
      "Catálogo de tarifas por origen y destino. Vincúlalas al editar una tarifa.",
    create: "Nueva ruta con tarifa fija",
    emptyTitle: "Sin rutas con tarifa fija",
    emptyDescription:
      "Registra trayectos origen–destino cuando no usan comisión por kilómetro.",
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
    duplicateBannerTitle: "Rutas duplicadas",
    duplicateBanner:
      "Hay rutas con el mismo origen y destino. Solo una se aplicará en el pago (la más reciente).",
    loadErrorTitle: "No se pudieron cargar las rutas",
    loadError: "Intenta de nuevo. Si persiste, vuelve más tarde.",
    retry: "Reintentar",
    clearFilters: "Limpiar filtros",
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
    viewOperators: "Ver operadores",
    editConfiguration: "Editar configuración",
    viewConfiguration: "Ver configuración",
    completePayment: "Completar pago",
    continueDraft: (version: number) => `Continuar borrador v${version}`,
    activateShort: "Activar",
    activate: "Activar tarifa",
    reactivateSuperseded: "Volver a activar esta versión",
    deactivate: "Desactivar tarifa",
    createVersion: "Crear nueva versión",
    delete: "Eliminar tarifa",
    activateDialog: {
      title: "¿Activar esta tarifa?",
      description:
        "Pasará a usarse en pagos. Si hay otra versión activa, quedará reemplazada.",
      reassignWarning:
        "Los operadores en versiones anteriores siguen cobrando con esa versión hasta que los reasignes.",
      reactivateSupersededTitle: (version: number) => `¿Volver a activar v${version}?`,
      reactivateSupersededDescription:
        "Esta versión vuelve a usarse en pagos y la versión activa quedará reemplazada. Los operadores no cambian de versión.",
      /** Con la versión activa de la familia conocida (listado agrupado). */
      descriptionKnownFamily: "Pasará a usarse en pagos.",
      reactivateSupersededDescriptionKnownFamily:
        "Esta versión vuelve a usarse en pagos. Los operadores no cambian de versión.",
      replacesActiveVersion: (version: number) =>
        `La v${version}, que hoy está activa, quedará reemplazada.`,
      confirm: "Activar",
      pending: "Activando…",
      cancel: "Cancelar",
    },
    deactivateDialog: {
      title: "¿Desactivar esta tarifa?",
      description:
        "Dejará de usarse para calcular pagos, incluidos los períodos pendientes de quien siga asignado a ella. No afecta pagos ya registrados.",
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
        "Solo elimina tarifas sin operadores asignados ni pagos que la referencien. Si está en uso, cierra o quita las asignaciones primero.",
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
        "Esta tarifa ya fue utilizada en pagos. Crea una nueva versión para editarla.",
      notActivatable:
        "Define el pago (reglas o rutas fijas) antes de activar la tarifa.",
      invalidTransition: "Esa transición de estado no está permitida.",
    },
    errors: {
      TEMPLATE_CONFIG_LOCKED:
        "Esta tarifa ya fue utilizada en pagos. Crea una nueva versión para editarla.",
      TEMPLATE_CONFIG_LOCKED_SUPERSEDED:
        "Esta versión ya fue reemplazada y tus cambios no se guardaron. Crea una nueva versión y vuelve a capturarlos.",
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
      "Define reglas por clase de ruta, prestaciones fijas y rutas vinculadas. El sueldo se toma de la ficha del operador; crea rutas con tarifa fija en la pestaña Rutas con tarifa fija.",
    schemaDataTitle: "Datos de la tarifa",
    corridorsSectionHelp:
      "Selecciona rutas del tabulador. Si el viaje coincide, se paga la tarifa fija en lugar del pago por viaje (la regla genérica no se aplica).",
    localNoCommissionNote:
      "Esta clase de ruta no tiene pago por viaje (el sueldo y las prestaciones se calculan aparte).",
    addRule: "Regla",
    addAllowance: "Prestación",
    addFixedPayment: "Pago fijo",
    addDeduction: "Deducción",
    allowanceType: "Tipo",
    allowanceLabel: "Etiqueta",
    allowanceAmount: "Monto",
    allowancePeriod: "Periodo",
    allowancePeriodHint:
      "Periodo = ritmo del acuerdo (cada cuánto aplica). El monto entra 1× por pago; no se divide por días.",
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
        "Definida por sucursal de origen; sigue pudiendo coincidir en el pago. En v1 solo editamos rutas por ciudad — convierte o ajusta monto/nombre/notas.",
      legacyAlertDeadMatch:
        "Esta definición no coincide en el pago hoy. Puedes convertirla a ciudad o solo ajustar monto, nombre y notas.",
      convertToCity: "Convertir a ciudad",
      convertToCityConfirmTitle: "¿Convertir a coincidencia por ciudad?",
      convertToCityConfirmDescription:
        "Indicarás ciudad de origen y destino. Al guardar, esta ruta dejará de usar la definición anterior.",
      convertToCityConfirmAction: "Convertir",
      fixedAmount: "Tarifa fija",
      notes: "Notas (opcional)",
      corridorActiveHint:
        "Si la desactivas, esta ruta no se aplicará en pagos futuros. Puedes reactivarla después.",
      effectiveFrom: "Vigente desde",
      effectiveTo: "Vigente hasta (opcional)",
      closePrevious: "Cerrar asignación anterior al iniciar la nueva",
      reason: "Motivo (opcional)",
      operators: "Operadores",
    },
    ruleRateLabels: {
      rate_per_km: "Tarifa por km",
      percentage_of_freight: "Porcentaje del flete",
      fixed_per_trip: "Importe fijo por viaje",
      none: "Monto",
    },
    save: "Guardar",
    savePending: "Guardando…",
    cancel: "Cancelar",
    validationSummary: "Revisa los campos marcados",
    confirmBatch: "Confirmar asignación",
    coverageHint: (periodStart: string, periodEnd: string) =>
      `Para cubrir el pago del ${periodStart} al ${periodEnd}, la vigencia debe iniciar en o antes del ${periodStart}.`,
    coverageWarningTitle: "Esta vigencia no cubre el período del pago",
    coverageWarningDescription: (periodStart: string, periodEnd: string) =>
      `El pago va del ${periodStart} al ${periodEnd}. Si la vigencia inicia después del ${periodEnd}, al armar el pago no se encontrará tarifa para ese rango.`,
    createCorridorLink: "Crear ruta con tarifa fija",
    manageCorridorsLink: "Ver catálogo de rutas",
    duplicateConfirmTitle: "¿Guardar ruta duplicada?",
    duplicateConfirmDescription:
      "Ya existe otra ruta con el mismo origen y destino. en el pago solo se aplicará una (la más reciente).",
    duplicateConfirmAction: "Guardar de todos modos",
    saveForbidden: "No tienes permiso para guardar rutas con tarifa fija.",
  },
  batchAssignment: {
    templateVersion: (name: string, version: number) => `${name} versión ${version}`,
    unnamedOperator: "Operador sin nombre",
    closedPeriod: (from: string, to: string) => `del ${from} al ${to}`,
    openPeriod: (from: string) => `desde el ${from}, sin fecha de fin`,
    conflicts: {
      previousStartsCause: (template: string, period: string) =>
        `Ya tiene una asignación en ${template} ${period}. Esa asignación empieza el mismo día o después que la nueva, así que no se puede cerrar antes de que empiece.`,
      previousClosedAction: (nextFrom: string, newFrom: string, template: string) =>
        `Para que cobre con esta versión al terminar esa asignación, vuelve a asignar desde el ${nextFrom}. Si esta versión debe aplicar desde el ${newFrom}, primero desactiva su asignación en ${template}.`,
      previousOpenAction: (existingFrom: string, newFrom: string, template: string) =>
        `Elige un inicio posterior al ${existingFrom}: su asignación en ${template} se cerrará el día anterior. Si esta versión debe aplicar desde el ${newFrom}, primero desactiva esa asignación.`,
      sameTemplateCause: (period: string) => `Ya tiene una asignación en esta versión ${period}.`,
      sameTemplateAction:
        "No hace falta asignarlo otra vez. Si quieres cambiar sus fechas, usa el menú ··· de su fila.",
      overlapCause: (template: string, period: string) =>
        `Ya tiene una asignación en ${template} ${period}, y esas fechas se cruzan con la nueva asignación.`,
      overlapCloseAction: (closeOn: string) =>
        `Marca “Cerrar asignación anterior al iniciar la nueva” para que se cierre el ${closeOn}, o cambia las fechas para que no se crucen.`,
      settledCause: "Tiene días ya liquidados.",
      unknownMessage: "No se pudo asignar por un conflicto con otra asignación.",
      /** api#60 — ritmo de prestaciones/deducciones ≠ salary_type. */
      periodMismatchCause: (salaryLabel: string, mismatchLabels: string) =>
        `El ritmo de pago del operador (${salaryLabel}) no coincide con el periodo de ${mismatchLabels}.`,
      periodMismatchCauseUnknownSalary:
        "El ritmo de pago del operador no coincide con el periodo de sus prestaciones o deducciones fijas.",
      periodMismatchAction:
        "Usa una tarifa del mismo ritmo o corrige el sueldo del operador en su ficha.",
      goToEmployee: "Ver ficha del operador",
      assignFrom: (name: string, date: string) => `Asignar a ${name} desde el ${date}`,
      markClosePrevious: "Marcar cierre de la anterior",
      goToAssignment: (template: string) => `Ir a su asignación en ${template}`,
      goToAssignmentHelp:
        "Se cerrará esta asignación masiva. Podrás volver con los mismos operadores y fecha.",
      viewOwnAssignment: "Ver su asignación",
    },
    preview: {
      title: "Revisa antes de confirmar",
      closures: (count: number, closeOn: string) =>
        `Se cerrará la asignación anterior de ${count} ${count === 1 ? "operador" : "operadores"} el ${closeOn}.`,
      showDetail: "Ver detalle",
      hideDetail: "Ocultar detalle",
      closureItem: (name: string, template: string, from: string) =>
        `${name} — ${template}, desde el ${from}`,
      unavailable: "No se pudo verificar; puedes confirmar igual",
    },
    result: {
      partialTitle: (created: number, total: number) =>
        `Se asignaron ${created} de ${total} operadores`,
      noneTitle: "No se asignó ningún operador",
      description:
        "Corrige lo siguiente y vuelve a confirmar; solo se intentará con estos operadores.",
      dismiss: "Descartar aviso",
    },
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
    showDeactivated: (count: number) => `Mostrar desactivadas (${count})`,
    hideDeactivated: "Ocultar desactivadas",
    displayStatus: {
      current: "Vigente",
      scheduled: "Programada",
      concluded: "Concluida",
      deactivated: "Desactivada",
    },
    displayStatusTooltip: {
      current: "Cobra con esta versión hoy.",
      scheduled: (from: string) => `Empieza a cobrar con esta versión el ${from}.`,
      concluded: (to: string) => `Cobró con esta versión hasta el ${to}.`,
      deactivated: "No se usa para calcular pagos. Los pagos ya registrados no cambian.",
      deactivatedInUse:
        "No se usa para calcular pagos. Formó parte de una liquidación (aunque esté cancelada), así que se conserva como historial y no se puede eliminar.",
    },
    summaryCurrent: (count: number) => `${count} ${count === 1 ? "vigente" : "vigentes"}`,
    summaryScheduled: (count: number) =>
      `${count} ${count === 1 ? "programada" : "programadas"}`,
  },
  assignmentActions: {
    openMenuSr: "Abrir menú de acciones de asignación",
    deactivate: "Desactivar asignación",
    closeValidity: "Cerrar vigencia…",
    changeEndDate: "Cambiar fecha de fin…",
    delete: "Eliminar asignación",
    settledTitle: "Hay días ya liquidados",
    inUseError: {
      title: "No se puede eliminar",
      deactivated:
        "Esta asignación formó parte de una liquidación (aunque esté cancelada) y se conserva como historial. Como está desactivada, no cobra ni afecta a otras asignaciones.",
      notDeactivated:
        "Esta asignación formó parte de una liquidación (aunque esté cancelada) y se conserva como historial. Para que deje de cobrar, desactívala o cierra su vigencia.",
    },
    deactivateDialog: {
      title: "¿Desactivar asignación?",
      description: (name: string) =>
        `${name} dejará de cobrar con esta versión en los días que aún no estén en una liquidación. Si debe cobrar con otra, asígnalo ahí. Los pagos ya registrados no cambian.`,
      unnamedOperator: "El operador",
      confirm: "Desactivar",
      pending: "Desactivando…",
      cancel: "Cancelar",
      closeOn: (date: string) => `Cerrar vigencia el ${date}`,
    },
    closeValidityDialog: {
      title: "Cerrar vigencia de asignación",
      changeTitle: "Cambiar fecha de fin",
      currentDescription: (name: string) =>
        `Indica el último día en que ${name} cobra con esta versión.`,
      scheduledDescription: (from: string) =>
        `Empieza el ${from}. Indica el último día en que cobrará con esta versión.`,
      concludedDescription: (to: string) =>
        `Concluyó el ${to}. Cambia la fecha solo si se capturó mal.`,
      unnamedOperator: "el operador",
      dateLabel: "Vigente hasta",
      confirm: "Cerrar vigencia",
      changeConfirm: "Guardar fecha",
      pending: "Guardando…",
      cancel: "Cancelar",
      useDate: (date: string) => `Usar ${date}`,
    },
    deleteDialog: {
      title: "¿Eliminar asignación?",
      description:
        "La asignación se borrará de forma permanente. Solo se puede eliminar si nunca formó parte de una liquidación, sin importar su estado (incluso cancelada). Si ya formó parte de una, desactívala o cierra su vigencia: deja de cobrar y se conserva como historial.",
      confirm: "Eliminar",
      pending: "Eliminando…",
      cancel: "Cancelar",
      close: "Cerrar",
    },
    toasts: {
      deactivateSuccess: "Asignación desactivada",
      closeValiditySuccess: "Vigencia cerrada",
      deleteSuccess: "Asignación eliminada",
    },
  },
  allowanceOverrides: {
    title: "Suspensión de prestaciones por período",
    description:
      "Suspende una prestación fija para este operador en el rango indicado. El pago del período omitirá el monto suspendido.",
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
    batchPartial: (created: number, total: number) =>
      `Se asignaron ${created} de ${total} operadores`,
    batchPartialDescription: "Revisa en el panel por qué se omitieron los demás.",
    batchNone: "No se asignó ningún operador",
    batchNoneDescription: "Revisa el motivo en el panel.",
    batchError: "No se pudo completar la asignación",
    dataRefreshed: "Datos actualizados",
  },
} as const;
