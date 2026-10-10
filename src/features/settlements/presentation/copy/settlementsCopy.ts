export const settlementsCopy = {
  title: "Pagos a operadores",
  description:
    "Arma el pago, pide autorización cuando aplique y regístralo al operador.",
  hub: {
    title: "Pagos a operadores",
    description:
      "Arma el pago, pide autorización cuando aplique y regístralo al operador.",
    navAriaLabel: "Secciones de pagos a operadores",
    approvalPoliciesAction: "Reglas de autorización",
    tabs: {
      porPagar: "Por pagar",
      porAutorizar: "Por autorizar",
      adelantos: "Anticipos",
      comoTePago: "Tarifas",
      tablaRutas: "Rutas con tarifa fija",
    },
    createCut: "Armar pago",
    operatorFilterPlaceholder: "Todos los operadores",
    pendingApprovalEmptyTitle: "Nada por autorizar",
    pendingApprovalEmptyDescription:
      "Cuando un pago requiera autorización, aparecerá aquí para que lo autorice alguien distinto de quien lo armó.",
    pendingApprovalEmptyDescriptionSingle:
      "Cuando un pago requiera autorización, aparecerá aquí. Como eres el único autorizador activo, podrás autorizarlo tú mismo; quedará marcado como autoaprobado.",
  },
  tabs: {
    settlements: "Por pagar",
    advances: "Anticipos pendientes",
    agreements: "Tarifas",
  },
  advancesList: {
    description:
      "Anticipos en gestión: en Aprobaciones, por entregar o con saldo pendiente de descontar.",
    deductInPayment: "Descontar en pago",
  },
  workbench: {
    buckets: {
      pending: "Pendientes",
      draft: "En revisión",
      approval: "En autorización",
      payable: "Listos para pago",
      closed: "Pagados",
      openAdvances: "Anticipos abiertos",
    },
    bucketDescriptions: {
      pending: "Operadores con viajes, sueldo o reembolsos por pagar.",
      draft: "Borradores, devueltas para corregir y rechazadas.",
      approval:
        "Pendientes de autorización en Por autorizar.",
      payable:
        "Autorizados: falta registrar el pago al operador.",
      closed: "Ya pagados al operador.",
      openAdvances:
        "Anticipos entregados con saldo pendiente de descontar en un pago.",
    },
    scorecards: {
      settlements: {
        title: "Pagos",
        description:
          "Etapas del pago a operadores: pendientes, revisión, pago y cerradas.",
        ariaLabel: "Scorecard de pagos a operadores",
      },
    },
    openAdvancesBridge: {
      linkLabel: (count: number) =>
        count === 1
          ? "1 anticipo abierto →"
          : `${count} anticipos abiertos →`,
      description:
        "Saldo pendiente de descontar en un pago.",
    },
    bucketDescriptionTooltip: "Qué incluye esta etapa",
    approvalLink: (count: number) =>
      count === 1 ? "1 en autorización →" : `${count} en autorización →`,
    actions: {
      settlePeriod: "Armar pago",
      reviewInApprovals: "Revisar en Por autorizar",
      viewFullHistory: "Historial",
      backToWorkbench: "Volver a por pagar",
      includeContractors: "Incluir contratistas",
    },
    filter: {
      searchPending: "Operador",
      searchPipeline: "Operador, folio o viaje",
      showFilters: "Filtros",
      branchLabel: "Sucursal",
      branchAll: "Todas las sucursales",
      branchPlaceholder: "Sucursal",
    },
    chip: {
      branch: (label: string) => `Sucursal: ${label}`,
      branchUnknown: "Sucursal",
      includeContractors: "Incluye contratistas",
    },
    backlog: {
      tableAriaLabel: "Operadores pendientes de pago",
      periodTooltips: {
        trips_pending:
          "Rango sugerido con base en los viajes y pagos pendientes de este operador.",
        salary_close:
          "Rango del sueldo pendiente de pagar según su frecuencia de pago.",
        mixed:
          "Rango sugerido por los viajes pendientes; puede incluir sueldo del período anterior.",
      },
      periodTooltipFallback: "Período sugerido para este pago.",
      rowTypes: {
        trips_pending: (count: number) =>
          count === 1 ? "1 viaje pendiente" : `${count} viajes pendientes`,
        salary_close: "Cierre de sueldo",
        mixed: "Viajes + sueldo",
      },
      ageDays: (days: number) =>
        days === 1 ? "1 día" : `${days} días`,
      estimatedAmountMissing: "Sin tarifa",
      correctBadge: "Corregir",
    },
    warnings: {
      /** Fallback F1 cuando no hay enrich `periodOverlap`. */
      period_overlap: "Ya hay un pago en este período",
      period_overlap_in_progress: "Ya hay un pago en curso en este período",
      period_overlap_disbursed: "Ya hay un pago registrado en este período",
      /** Fallback F1 cuando no hay enrich `periodOverlap`. */
      period_overlap_tooltip:
        "El período sugerido se cruza con un pago ya registrado o en curso del mismo operador.",
      period_overlap_tooltip_in_progress:
        "El período sugerido se cruza con un pago ya registrado o en curso de este operador.",
      period_overlap_tooltip_disbursed:
        "El período sugerido se cruza con un pago ya registrado de este operador.",
      period_overlap_cta: "Ver en historial",
      open_advance: "Anticipo por descontar",
      template_change_in_period: "Cambio de esquema en el período",
      template_version_superseded: "Versión de tarifa reemplazada",
    },
    /**
     * api#59 V8 — base DOM Respuesta 4. `replaced_by` es la versión activa hoy y puede ser
     * menor que la reemplazada: no decir «nueva».
     */
    templateSuperseded: {
      title: "Versión de tarifa reemplazada",
      replacementSameName: (version: number) => `la versión ${version}`,
      replacementRenamed: (name: string, version: number) => `${name} versión ${version}`,
      body: (p: { name: string; version: number; replacement: string }) =>
        `Se calcula con ${p.name} versión ${p.version}, que ya fue reemplazada por ${p.replacement}. Si el operador debe cobrar con ${p.replacement}, reasígnalo indicando desde qué fecha.`,
      bodyNoReplacement: (p: { name: string; version: number }) =>
        `Se calcula con ${p.name} versión ${p.version}, que ya fue reemplazada. Si el operador debe cobrar con otra versión, reasígnalo indicando desde qué fecha.`,
    },
    /** D-1 C1 — copy DOM final (`handoff-tec-c1.md` §3.3). Nombres y fechas ya resueltos. */
    templateChange: {
      tooltip: {
        two: (p: { a: string; b: string; endA: string; startB: string }) =>
          `En este período el operador tuvo dos esquemas: ${p.a} hasta el ${p.endA} y ${p.b} desde el ${p.startB}. El pago se calcula completo con ${p.b}, el vigente al cierre. Si debe reflejar la parte de ${p.a}, agrega un ajuste manual.`,
        twoWithTrips: (p: { a: string; b: string; endA: string; startB: string }) =>
          `En este período el operador tuvo dos esquemas: ${p.a} hasta el ${p.endA} y ${p.b} desde el ${p.startB}. Todos los viajes y conceptos del período se calculan con ${p.b}, el vigente al cierre. Si debe reflejar la parte de ${p.a}, agrega un ajuste manual.`,
        several: (p: { n: number; first: string; closing: string }) =>
          `En este período el operador tuvo ${p.n} esquemas, de ${p.first} a ${p.closing}. El pago se calcula completo con ${p.closing}, el vigente al cierre. Si debe reflejar la parte de los demás esquemas, agrega un ajuste manual.`,
        severalWithTrips: (p: { n: number; first: string; closing: string }) =>
          `En este período el operador tuvo ${p.n} esquemas, de ${p.first} a ${p.closing}. Todos los viajes y conceptos del período se calculan con ${p.closing}, el vigente al cierre. Si debe reflejar la parte de los demás esquemas, agrega un ajuste manual.`,
        concurrent: (p: { a: string; b: string }) =>
          `En este período el operador tuvo dos esquemas a la vez: ${p.a} y ${p.b}. El pago se calcula completo con ${p.b}, el más reciente por vigencia. Revisa sus vigencias en Esquemas de compensación; si debe reflejar la parte de ${p.a}, agrega un ajuste manual.`,
        concurrentWithTrips: (p: { a: string; b: string }) =>
          `En este período el operador tuvo dos esquemas a la vez: ${p.a} y ${p.b}. Todos los viajes y conceptos del período se calculan con ${p.b}, el más reciente por vigencia. Revisa sus vigencias en Esquemas de compensación; si debe reflejar la parte de ${p.a}, agrega un ajuste manual.`,
      },
      alertTitle: {
        two: "Este período tiene dos esquemas",
        several: "Este período tiene varios esquemas",
        concurrent: "Este período tiene dos esquemas a la vez",
      },
      alertBody: {
        two: (p: { a: string; b: string; periodEnd: string }) =>
          `Se aplica ${p.b} a todo el período porque es el vigente el ${p.periodEnd}. Las prestaciones y deducciones de ${p.a} no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).`,
        twoWithTrips: (p: { a: string; b: string; periodEnd: string; startB: string }) =>
          `Se aplica ${p.b} a todo el período porque es el vigente el ${p.periodEnd}, también a los viajes con salida antes del ${p.startB}. Las reglas de pago, corredores, prestaciones y deducciones de ${p.a} no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).`,
        several: (p: { closing: string; periodEnd: string }) =>
          `Se aplica ${p.closing} a todo el período porque es el vigente el ${p.periodEnd}. Las prestaciones y deducciones de los demás esquemas no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).`,
        severalWithTrips: (p: { closing: string; periodEnd: string; startB: string }) =>
          `Se aplica ${p.closing} a todo el período porque es el vigente el ${p.periodEnd}, también a los viajes con salida antes del ${p.startB}. Las reglas de pago, corredores, prestaciones y deducciones de los demás esquemas no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).`,
        concurrent: (p: { a: string; b: string }) =>
          `${p.a} y ${p.b} están vigentes al mismo tiempo. Se aplica ${p.b} a todo el período porque es el más reciente por vigencia. Las prestaciones y deducciones de ${p.a} no se consideran. Corrige las vigencias en Esquemas de compensación o, si corresponde, agrega un ajuste manual (pedirá autorización).`,
        concurrentWithTrips: (p: { a: string; b: string }) =>
          `${p.a} y ${p.b} están vigentes al mismo tiempo. Se aplica ${p.b} a todo el período, incluidos sus viajes, porque es el más reciente por vigencia. Las reglas de pago, corredores, prestaciones y deducciones de ${p.a} no se consideran. Corrige las vigencias en Esquemas de compensación o, si corresponde, agrega un ajuste manual (pedirá autorización).`,
      },
    },
    /** ADR-0085 E11 — conflicto primario con folio («LIQ-… · Borrador · creado hace 3 días»). */
    periodOverlapFolio: {
      label: (folio: string, statusLabel: string, age: string | null) =>
        age ? `${folio} · ${statusLabel} · ${age}` : `${folio} · ${statusLabel}`,
      age: (days: number) =>
        days <= 0
          ? "creado hoy"
          : days === 1
            ? "creado hace 1 día"
            : `creado hace ${days} días`,
      tooltipContained: (folio: string) =>
        `El sueldo de este período ya está en ${folio}. El pago nuevo llevará solo viajes, reembolsos y anticipos.`,
      tooltipPartial: (folio: string, date: string) =>
        `Se cruza con ${folio}. Armar pago empezará el ${date}.`,
    },
    empty: {
      backlogTitle: "Sin operadores pendientes de pago",
      backlogDescription:
        "Todos los operadores están al corriente para este filtro. Revisa anticipos pendientes o consulta el historial.",
      backlogApiPendingTitle: "Lista en preparación",
      backlogApiPendingDescription:
        "La lista de operadores por pagar se está preparando. Mientras tanto, revisa los pagos ya registrados o el historial.",
      pipelineTitle: "Sin pagos en esta etapa",
      pipelineDescription:
        "No hay pagos en esta etapa. Prueba otra o consulta el historial.",
      schemesBridgeTitle: "¿Listo para armar un pago?",
      schemesBridgeDescription:
        "Si aún no hay operadores por pagar, verifica que tengan tarifa asignada y sueldo configurado en Empleados.",
      schemesBridgeAction: "Ir a Tarifas",
    },
    readiness: {
      title: "Antes de armar un pago, verifica que la configuración esté completa.",
      ariaLabel: "Prerrequisitos para pagar a operadores",
      chipsAriaLabel: "Estado de configuración de pagos a operadores",
      operatorsSalaryLabel: "operadores activos (sueldo en ficha)",
      templatesActiveLabel: "tarifas activas",
      assignmentsActiveLabel: "operadores asignados a una tarifa",
      tripsCompletedLabel: "viajes completados",
      relatedConfigDescription:
        "Tarifas y asignación de operadores",
      cta: {
        operatorsSalary: "Ir a Empleados",
        templatesActive: "Ir a Tarifas",
        assignmentsActive: "Ir a Tarifas → Operadores",
        tripsCompleted: "Ir a Viajes",
        generic: "Revisar",
      },
    },
  },
  actions: {
    createSettlement: "Armar pago",
    createAdvance: "Registrar anticipo",
    createAgreement: "Nueva tarifa",
    manageAgreements: "Tarifas",
    calculatePreview: "Calcular vista previa del pago",
    approve: "Autorizar",
    reject: "Rechazar",
    disburse: "Registrar pago al operador",
    awaitingTreasuryDisburse:
      "Autorizado: falta que tesorería registre el pago.",
    saveDraft: "Guardar como borrador",
    submitApproval: "Enviar a autorización",
    pedirVobo: "Enviar a autorización",
    makerExecuteForbidden:
      "Quien armó el pago no puede registrarlo; pide a otro usuario con permiso de tesorería que lo registre.",
    cancelSettlement: "Cancelar pago…",
    cancel: "Cancelar",
    confirm: "Confirmar",
    backToList: "Volver a por pagar",
    backToWorkbench: "Volver a por pagar",
    backToPendingApproval: "Volver a por autorizar",
    backToRegistry: "Volver al historial",
    backToAdvances: "Volver a anticipos",
    backToApprovals: "Volver a aprobaciones",
    viewDetail: "Ver detalle",
    viewDetails: "Ver detalles",
    exportCsv: "Exportar CSV",
    sendToApproval: "Enviar a autorización",
    authorizeAdvance: "Autorizar anticipo",
    rejectAdvance: "Rechazar anticipo",
    recordAdvanceDisbursement: "Registrar entrega / pago",
    viewDriverFile: "Ver expediente chofer",
    viewTripPrefix: "Ver viaje",
    openActionsMenuSr: "Abrir menú de acciones",
  },
  status: {
    draft: "Borrador",
    pending_approval: "Por autorizar",
    approved: "Autorizado",
    disbursed: "Pagado",
    rejected: "Rechazado",
    cancelled: "Cancelado",
  },
  advanceStatus: {
    draft: "Borrador",
    pending_approval: "Por autorizar",
    pending_disbursement: "Autorizado (pendiente entrega)",
    disbursed: "Entregado (abierto)",
    partially_applied: "Parcialmente descontado",
    fully_applied: "Descontado al 100%",
    rejected: "Rechazado",
    cancelled: "Cancelado",
  },
  fields: {
    employee: "Operador",
    period: "Período de pago",
    periodStart: "Fecha inicio",
    periodEnd: "Fecha fin",
    settlementNumber: "Folio de pago",
    folio: "Folio de anticipo",
    amount: "Monto entregado",
    netAmount: "A pagar",
    grossAmount: "Lo ganado",
    totalDeductions: "Deducciones totales",
    totalCommissions: "Pago por viajes realizados",
    totalReimbursements: "Gastos y casetas por reembolsar",
    totalDiscounts: "Descuentos",
    totalBonuses: "Bonos e incentivos",
    tripsCount: "Viajes realizados",
    calculationType: "Regla de pago",
    baseRate: "Tarifa fija por viaje",
    ratePerKm: "Tarifa por km recorrido",
    percentageRate: "% sobre flete facturado",
    helperDailyRate: "Tarifa diaria ayudante",
    paymentMethod: "Método de entrega",
    bankReference: "Referencia de pago (transferencia o folio)",
    notes: "Observaciones / Notas",
    category: "Categoría de anticipo",
    balanceRemaining: "Saldo por descontar",
    tripCode: "Viaje",
    route: "Ruta del viaje",
    distance: "Distancia (km)",
    freightRevenue: "Flete facturado",
    status: "Estado",
    action: "Acción",
    deliveryDate: "Fecha de entrega",
    validity: "Vigencia",
    rateFormula: "Tarifa / Fórmula",
    schemeSalary: "Esquema / Sueldo",
    commissionRules: "Reglas de comisión",
    noFixedSalary: "Sin sueldo base",
    compositeScheme: "Sueldo + pago por viajes",
    noCommission: "Sin comisión",
    minGuaranteedPrefix: "mín.",
    salaryOnly: "Solo sueldo base",
    fromPrefix: "Desde",
    toPrefix: "hasta",
    allStatuses: "Todos los estados",
    activeStatus: "Activo",
    inactiveStatus: "Inactivo",
    overlapConflictStatus: "Conflicto de vigencia",
    searchPlaceholder: "Buscar por operador, folio o viaje...",
    pendingConcept: "Concepto pendiente",
    estimatedAmount: "A pagar (est.)",
  },
  toasts: {
    dataRefreshed: "Datos actualizados",
    exportSettlementsSuccess: "Archivo CSV de pagos generado",
    exportAdvancesSuccess: "Archivo CSV de anticipos generado",
    noSettlementsToExport: "No hay pagos para exportar",
    noAdvancesToExport: "No hay anticipos para exportar",
    approveSettlementSuccess: "Pago autorizado correctamente",
    approveSettlementError: "Error al autorizar el pago",
    rejectSettlementSuccess: "Pago rechazado",
    rejectSettlementError: "Error al rechazar el pago",
    rejectSettlementReasonRequired: "Especifica el motivo del rechazo",
    submitSettlementSuccess: "Pago enviado a autorización",
    submitSettlementError: "Error al enviar el pago a autorización",
    cancelSettlementSuccess: "Pago cancelado",
    cancelSettlementError: "Error al cancelar el pago",
    submitAdvanceSuccess: "Anticipo enviado a autorización",
    submitAdvanceError: "Error al enviar anticipo",
    approveAdvanceSuccess: "Anticipo autorizado correctamente",
    approveAdvanceError: "Error al autorizar anticipo",
    rejectAdvanceSuccess: "Anticipo rechazado",
    rejectAdvanceError: "Error al rechazar anticipo",
    rejectAdvanceReasonRequired: "Especifica el motivo del rechazo",
    disburseAdvanceSuccess: "Anticipo entregado correctamente",
    disburseAdvanceError: "Error al registrar entrega de anticipo",
    settingsUnavailable:
      "No pudimos leer la regla de autorización de liquidaciones; recarga la página antes de mover dinero.",
    selfDisburseRejected:
      "No puedes registrar este pago: lo registraste tú y hay otro usuario activo que puede hacerlo.",
  },
  actionDialogs: {
    approveSettlement: {
      title: "¿Autorizar pago?",
      descriptionPart1: "Estás por autorizar el folio",
      descriptionPart2: "del operador",
      descriptionPart3: "por un monto neto de",
      descriptionPart4:
        ". Una vez autorizado, quedará listo para que tesorería registre el pago al operador.",
      confirm: "Sí, autorizar pago",
      pending: "Autorizando...",
      cancel: "Cancelar",
    },
    cancelSettlement: {
      draftTitle: "¿Cancelar pago?",
      draftBody: (folio: string) =>
        `Se cancelará el folio ${folio} en borrador. Los anticipos descontados (si los hay) se restaurarán. Esta acción no se puede deshacer.`,
      title: (folio: string) => `Cancelar pago ${folio}`,
      body: "Indica el motivo (mínimo 5 caracteres). Quedará en el historial de autorización.",
      /** ADR-0085 E11 punto 10 (literal). */
      approvedWarningTitle: "Si ya entregaste el efectivo, no canceles.",
      approvedWarning:
        "Se anula la autorización y los anticipos descontados vuelven a quedar por descontar. Para pagarle al operador tendrás que armar un pago nuevo, que pedirá autorización otra vez.",
      approvedConfirmLabel:
        "Confirmo que este pago no se ha entregado al operador, ni en efectivo ni por transferencia, y que el operador no ha firmado el recibo.",
      pendingWarning:
        "Se cierra la solicitud de autorización en curso y los anticipos descontados vuelven a quedar por descontar.",
      reasonLabel: "Motivo",
      reasonPlaceholder: "Ej. Período equivocado; se arma de nuevo con las fechas correctas",
      reasonTooShort: "El motivo debe tener al menos 5 caracteres",
      reasonTooLong: "El motivo no puede pasar de 500 caracteres",
      confirm: "Sí, cancelar pago",
      pending: "Cancelando...",
      cancel: "Volver",
    },
    rejectSettlement: {
      title: "Rechazar pago",
      descriptionPrefix: "Especifica el motivo por el cual no se autoriza el folio",
      reasonLabel: "Motivo de rechazo *",
      reasonPlaceholder: "Ej. Falta comprobante de casetas o ajuste en km...",
      confirm: "Confirmar rechazo",
      pending: "Rechazando...",
      cancel: "Cancelar",
    },
    rejectAdvance: {
      title: "Rechazar anticipo",
      descriptionPrefix: "Especifica el motivo por el cual no se autoriza el anticipo",
      reasonLabel: "Motivo de rechazo *",
      reasonPlaceholder: "Ej. Excede el tope semanal de dieta o viaje cancelado...",
      confirm: "Confirmar rechazo",
      pending: "Rechazando...",
      cancel: "Cancelar",
    },
    disburseAdvance: {
      title: "Registrar entrega de anticipo",
      descriptionPart1: "Confirma la entrega o transferencia de",
      descriptionPart2: "al operador",
      bankRefLabel: "Referencia / Folio SPEI",
      bankRefPlaceholder: "Ej. SPEI-992811",
      bankRefOptionalHint: "Opcional en pagos en efectivo.",
      paymentMethodLabel: "Método de pago *",
      paymentMethodPlaceholder: "Seleccionar método",
      methodDiffersFromAuthorized: (authorizedLabel: string) =>
        `El método es distinto al autorizado (${authorizedLabel}).`,
      methodChangedToCash: (authorizedLabel: string) =>
        `Se autorizó por ${authorizedLabel} y vas a registrar la entrega en efectivo. Confirma que el operador recibió el dinero en mano.`,
      methodChangeAudit: "El cambio de método queda registrado en el historial de autorización.",
      errorAlertTitle: "No se pudo registrar la entrega",
      invalidPayload:
        "Los datos de la entrega no son válidos. Revisa el método de pago y la referencia.",
      confirm: "Confirmar entrega",
      pending: "Registrando...",
      cancel: "Cancelar",
    },
    deactivateAgreement: {
      title: "¿Desactivar tarifa?",
      description:
        "La tarifa dejará de aplicarse en pagos futuros. El pago ya registrado no cambia.",
      confirm: "Desactivar tarifa",
      pending: "Desactivando...",
      cancel: "Cancelar",
    },
    closeAgreementValidity: {
      title: "Cerrar vigencia de tarifa",
      description:
        "Define la fecha fin de vigencia. A partir del día siguiente dejará de ser elegible para pagos nuevos.",
      dateLabel: "Fin de vigencia *",
      confirm: "Cerrar vigencia",
      pending: "Guardando...",
      cancel: "Cancelar",
    },
    deleteAgreement: {
      title: "¿Eliminar tarifa?",
      description:
        "Esta acción es permanente. Solo elimina tarifas que no hayan sido usadas en pagos. Si ya se pagó con esta tarifa, desactívala o cierra su vigencia.",
      confirm: "Eliminar tarifa",
      pending: "Eliminando...",
      cancel: "Cancelar",
    },
  },
  agreementGovernance: {
    overlapCreateTitle: "Hay otra tarifa activa con vigencia traslapada",
    overlapCreateDescription:
      "Este operador ya tiene tarifa(s) activa(s) que cubren parte del rango que estás creando. Para evitar ambigüedad al armar el pago, cierra la anterior o desactívala después de guardar.",
    overlapCreateClosePreviousLabel:
      "Cerrar la(s) tarifa(s) anterior(es) al día previo del inicio de esta",
    settlementAmbiguityTitle: "Varias asignaciones vigentes en la fecha fin del período",
    settlementAmbiguityDescriptionPrefix:
      "El cálculo del pago aplica la asignación más reciente por vigencia (desde",
    settlementAmbiguityDescriptionSuffix:
      "). Revisa las asignaciones del operador en Tarifas.",
    reviewAgreementsAction: "Revisar tarifas",
    actions: {
      deactivate: "Desactivar tarifa",
      closeValidity: "Cerrar vigencia…",
      delete: "Eliminar tarifa",
    },
    toasts: {
      deactivateSuccess: "Tarifa desactivada",
      deactivateError: "Error al desactivar tarifa",
      closeValiditySuccess: "Vigencia cerrada",
      closeValidityError: "Error al cerrar vigencia",
      deleteSuccess: "Tarifa eliminada",
      deleteError: "Error al eliminar tarifa",
      closePreviousOnCreateError: "No se pudo cerrar la tarifa anterior",
    },
  },
  confirmSubmitDialog: {
    title: "¿Enviar pago para autorización?",
    description: "Revisa el monto a pagar antes de enviarlo a Por autorizar.",
    confirmAction: "Confirmar y enviar",
  },
  registry: {
    title: "Historial",
    description: "Pagos registrados de operadores.",
    entityLabelPlural: "pagos",
  },
  empty: {
    settlements: "No hay pagos registrados en este período.",
    advances:
      "Un anticipo es efectivo adelantado al operador; se descuenta en el pago. Usa Registrar anticipo para capturarlo. No lo dupliques como gasto del viaje en Costos.",
    agreements:
      "Ningún operador tiene una tarifa asignada. Usa asignación masiva para vincular operadores.",
    trips: "No se encontraron viajes completados pendientes de pago para este operador en las fechas seleccionadas.",
    selectOperatorPrompt: "Selecciona un operador y un rango de fechas para calcular el pago automáticamente.",
    settlementsTitle: "No hay pagos registrados",
    advancesTitle: "Sin anticipos abiertos",
    agreementsTitle: "Sin asignaciones de tarifa",
  },
  agreementsPage: {
    title: "Tarifas de operadores",
    description:
      "Configura sueldos base y comisiones por clase de ruta para cada operador.",
  },
  detailPage: {
    balanceStrip: {
      grossEarnings: "Lo ganado",
      grossEarningsSubtext: "Sueldo, viajes, prestaciones y reembolsos",
      tripsCount: (count: number) => (count === 1 ? "1 viaje" : `${count} viajes`),
      discounts: "Descuentos",
      discountsBreakdown: (advances: string, otherDeductions: string) =>
        `Anticipos ${advances} · Otros descuentos ${otherDeductions}`,
      discountsAdvancesOnly: "Anticipos descontados en este pago",
      discountsOtherOnly: "Deducciones y ajustes en contra",
      discountsNone: "Sin descuentos en este pago",
      netToPay: "A pagar",
      netSubtext: "Lo que recibe el operador",
      netShortfall: (excess: string, zero: string) =>
        `Los descuentos superan lo ganado por ${excess}; a pagar queda en ${zero}.`,
    },
    workflow: {
      title: "Progreso del pago",
      step1: "Elaboró",
      step2: "Autorizó",
      step3: "Pagó",
      pendingManagement: "Pendiente de gerencia",
      pendingDisbursement: "Pendiente de pago",
      notDisbursed: "Sin pago",
      notApproved: "Sin autorizar",
      selfSegregatedApproval: "Autorizado en modo un solo responsable",
      selfSegregatedApprovalCount: (count: number) =>
        `Autorizado en modo un solo responsable (${count} autorizador al momento)`,
      selfSegregatedDisbursement: "Pago registrado en modo un solo responsable",
      selfSegregatedDisbursementCount: (count: number) =>
        `Pago registrado en modo un solo responsable (${count} ejecutor al momento)`,
    },
    paymentInfo: {
      title: "Pago registrado",
      method: "Método",
      reference: "Referencia",
      disbursedAt: "Fecha",
    },
    tariff: {
      title: "Cómo se calculó este pago",
      subtitle: "Tarifa aplicada al momento del cálculo.",
      expandLabel: "Ver tarifa aplicada",
      collapseLabel: "Ocultar tarifa",
      disclaimer: "Registrado al calcular este pago; no cambia si editas tarifas después.",
      scheme: "Tarifa:",
      fixedSalary: "Sueldo base:",
      routesTitle: "Pago por tipo de ruta:",
      ratePerKm: "Tarifa por kilómetro:",
      percentageRate: "% sobre flete:",
      fixedPerTrip: "Tarifa fija por viaje:",
      helperDailyRate: "Tarifa diaria ayudante:",
      compositeLabel: "Sueldo + pago por viajes",
    },
    items: {
      title: "Desglose",
      subtitle: "Conceptos de lo ganado y descuentos aplicados.",
      expandLabel: "Ver desglose",
      collapseLabel: "Ocultar desglose",
      earningsTitle: "1. Ingresos del período (+)",
      earningsSubtitle: "Sueldo base, viajes, prestaciones, bonos y reembolsos.",
      deductionsTitle: "2. Descuentos (−)",
      deductionsSubtitle: "Anticipos y otras deducciones que se restan de lo ganado.",
      subtotalEarnings: "Subtotal ingresos:",
      subtotalAdvances: "Anticipos:",
      subtotalOtherDeductions: "Otros descuentos:",
      subtotalDeductions: "Subtotal descuentos:",
      emptyEarnings: "No hay ingresos desglosados en este pago.",
      emptyDeductions: "No hay descuentos en este pago.",
      earningsTableAriaLabel: "Desglose de ingresos",
      deductionsTableAriaLabel: "Desglose de descuentos",
      headerConcept: "Concepto",
      headerCategory: "Categoría",
      headerTripReference: "Viaje / Referencia",
      headerReference: "Referencia",
      headerQuantity: "Cantidad",
      headerUnitRate: "Tarifa unit.",
      headerAmount: "Importe",
      headerDeductedAmount: "Monto descontado",
      countConceptSingular: "concepto",
      countConceptPlural: "conceptos",
      countDeductionSingular: "descuento",
      countDeductionPlural: "descuentos",
      viewTripFallback: "Ver viaje",
      linkedAdvanceFallback: "Anticipo vinculado",
      guaranteedBaseSalary: "Sueldo base garantizado",
      tripCommissionTitle: "Pago por viaje",
      reimbursementPrefix: "Reembolso",
      advanceDeductionTitle: "Descuento de anticipo",
      receiptPrefix: "Comprobante",
      templateDeductionCategory: "Deducción de tarifa",
      templateDeductionSubtitle: "De la tarifa del operador",
      fixedAllowanceCategory: "Prestación fija",
    },
    rejection: {
      title: "Pago rechazado por gerencia",
      reasonLabel: "Motivo:",
      reopenDraftBtn: "Armar pago nuevo con este periodo",
    },
    notes: {
      title: "Observaciones y notas de patio",
      noNotes: "Sin observaciones registradas.",
    },
    receipt: {
      documentTitle: "Pago a operador — Período",
      documentSubtitle: "Comprobante operativo de pago a operador del período",
      folioLabel: "FOLIO:",
      statusLabel: "Estado:",
      issueDateLabel: "Emisión:",
      driverLabel: "Operador / Conductor:",
      settledPeriodLabel: "Período pagado:",
      paymentMethodLabel: "Método de pago:",
      bankRefLabel: "Ref. de pago:",
      earningsTitle: "1. Ingresos del Período (Sueldo, Viajes y Reembolsos) (+)",
      earningsTable: {
        concept: "Concepto / Detalle",
        type: "Tipo",
        trip: "Viaje",
        quantity: "Cant.",
        rate: "Tarifa",
        amount: "Importe",
        empty: "Sin ingresos ni viajes registrados en este período",
        subtotal: "Subtotal Ingresos (+):",
      },
      /** ADR-0085 E11 — viajes cerrados en este pago sin comisión. */
      zeroTripsTitle: "Viajes incluidos sin comisión",
      zeroTripsHint: "Estos viajes quedan cerrados en este pago con $0 y no se pagarán en otro.",
      zeroTripsTable: {
        trip: "Viaje",
        reason: "Motivo",
      },
      zeroTripsReasons: {
        scheme: "La tarifa no paga comisión en este viaje",
        zero_km: "Pago por km sin distancia registrada",
        no_rule: "La tarifa no tiene regla para este tipo de ruta",
      },
      zeroTripsReasonFallback: "Sin comisión",
      deductionsTitle: "2. Descuentos (−)",
      deductionsTable: {
        concept: "Concepto",
        type: "Tipo",
        reference: "Folio / Referencia",
        amount: "Monto Descontado",
        empty: "Sin deducciones ni anticipos aplicados",
        subtotal: "Total Descuentos (−):",
      },
      balance: {
        totalEarningsLabel: "(+) Total Ingresos",
        totalDeductionsLabel: "(−) Total Descuentos",
        netToPayLabel: "(=) NETO A PAGAR AL OPERADOR",
      },
      notesTitle: "Observaciones / Acuerdos del pago:",
      signatures: {
        driverTitle: "Firma de Conformidad del Operador",
        driverDisclaimer:
          "Recibí a mi entera satisfacción la cantidad neta indicada por concepto de mis servicios y viajes del período.",
        approverTitle: "Revisado y Autorizado / Empresa",
        approverDefaultName: "Tesorería / Operaciones",
        approverDisclaimerDisbursed: "Pago revisado y registrado por administración.",
        approverDisclaimerPending: "Pago autorizado, pendiente de registrar.",
        pendingPaymentBanner: "PENDIENTE DE PAGO",
        finalReceiptBanner: "Recibo de pago",
        disbursedOnPrefix: "Pagado el",
      },
      /** D28: borrador, por autorizar, rechazada y cancelada no se firman. */
      reviewWatermark: "NO VÁLIDO PARA FIRMA",
      reviewSignaturesNotice:
        "Documento de revisión. No firmar: puede cambiar antes de autorizarse.",
      lastModified: (dateTime: string) => `Última modificación: ${dateTime}`,
      previewDialogDescription: "Vista previa para revisión; no es un documento para firma.",
    },
  },
  createPage: {
    header: {
      title: "Armar pago",
      subtitle: "Calcula lo ganado por viajes y descuenta anticipos entregados.",
    },
    sections: {
      filtersTitle: "1. Operador y período",
      filtersDescription: "Selecciona el operador y el rango de fechas para consultar viajes y anticipos abiertos.",
      agreementActiveLabel: "Tarifa de pago aplicada",
      templateAppliedValue: (name: string, version?: number) =>
        version != null ? `${name} versión ${version}` : name,
      agreementProfileSalaryHint:
        "El sueldo base se toma de la ficha del empleado al armar el pago; asigna una tarifa si aún no tiene una.",
      agreementProfileSalaryHintLink: "Abrir ficha del empleado para configurar sueldo base",
      tripsTitle: "2. Viajes del período",
      tripsDescription:
        "Viajes finalizados con pago calculado según la tarifa del operador.",
      tripsShowCalcDetail: "Ver detalle de cálculo",
      tripsHideCalcDetail: "Ocultar detalle de cálculo",
      advancesTitle: "3. Anticipos por descontar",
      advancesDescription: "Elige qué anticipos descontar de este pago y ajusta montos si hace falta.",
      notesTitle: "4. Observaciones",
      notesPlaceholder: "Instrucciones para tesorería, cuentas o acuerdos especiales...",
    },
    summary: {
      cardTitle: "Resumen a pagar",
      cardSubtitle: "Cálculo en vivo",
      earnedLabel: "Lo ganado",
      advancesLabel: "Anticipos",
      netTotalLabel: "A pagar",
      netTotalSubtext: "Lo que recibirá el operador",
      earnedBreakdownTitle: "Detalle de lo ganado",
      fixedSalaryLabel: "Sueldo base",
      fixedSalaryLabelWithPeriod: (periodLabel: string) =>
        `Sueldo base (${periodLabel.toLowerCase()})`,
      fixedAllowancesLabel: "Prestaciones fijas",
      fixedAllowancesLabelWithPeriod: (periodLabel: string) =>
        `Prestaciones fijas (${periodLabel.toLowerCase()})`,
      deductionsLabel: "Deducciones de tarifa",
      commissionsLabel: "Pago por viajes",
      reimbursementsLabel: "Reembolsos",
      submitApprovalBtn: "Enviar a autorización",
      pedirVoboBtn: "Enviar a autorización",
      submitApprovalSegregationHint:
        "Otro usuario con permiso debe autorizarlo en Por autorizar (también puedes verlo en Aprobaciones).",
      submitApprovalSegregationHintSingle:
        "Como eres el único autorizador activo, podrás autorizar este pago tú mismo; quedará marcado como autoaprobado.",
      bypassDraftHint: (thresholdLabel: string) =>
        `El neto es menor a ${thresholdLabel} (monto mínimo para pedir autorización) y no hay correcciones manuales: se guarda en borrador. Debe registrar el pago otra persona; pídeselo a un contador o administrador.`,
      bypassDraftHintSingle: (thresholdLabel: string) =>
        `El neto es menor a ${thresholdLabel} (monto mínimo para pedir autorización) y no hay correcciones manuales: se guarda en borrador. Como eres el único usuario que puede registrar pagos, podrás hacerlo tú mismo; quedará marcado en el historial.`,
      bypassDraftHintNoAmount:
        "La regla no pide autorización por monto y no hay correcciones manuales: se guarda en borrador. Debe registrar el pago otra persona; pídeselo a un contador o administrador.",
      bypassDraftHintNoAmountSingle:
        "La regla no pide autorización por monto y no hay correcciones manuales: se guarda en borrador. Como eres el único usuario que puede registrar pagos, podrás hacerlo tú mismo; quedará marcado en el historial.",
      commercialFreightHint:
        "El % sobre flete usa el monto comercial al completar el viaje, no el monto de la factura timbrada.",
      reservedAdvanceHint: "Reservado en un pago pendiente; se aplica al registrar el pago.",
      reservedElsewhereHint: (folio: string) =>
        `Reservado en ${folio}. Se libera cuando ese pago se pague o se cancele.`,
      saveDraftBtn: "Guardar borrador",
      cancelBtn: "Cancelar",
      noItemsToSettle: "No hay viajes ni sueldo base para pagar en este período.",
      actionsBlockedUntilReady:
        "Configura una tarifa válida para guardar o enviar. Para pagar solo reembolsos, arma un pago de reembolsos.",
      /** F1 tres bolsillos: franja corta bajo el neto (sin cambiar tabs/pasos). */
      channelsTeachingAriaLabel: "Tres bolsillos del pago a operadores",
      channelsTeachingIntro: "Tres bolsillos — no registres el mismo dinero dos veces:",
      channelsTeachingExpense:
        "Gasto del viaje en Costos → reembolso aquí (+); no lo registres otra vez como anticipo",
      channelsTeachingAdvance: "Anticipo → descuento (−)",
      channelsTeachingFixed: "Pago fijo de tarifa → bruto (+ 1× por período)",
      periodMismatchAlertTitle: "El rango excede un período de pago",
      periodMismatchAlertDescription: (periodLabel: string, amount: string) =>
        `El sueldo base y las prestaciones fijas cubren 1 período ${periodLabel.toLowerCase()} (${amount}). Si necesitas pagar varias ${periodLabel === "Semanal" ? "semanas" : periodLabel === "Quincenal" ? "quincenas" : "meses"}, arma un pago por ${periodLabel === "Semanal" ? "semana" : periodLabel === "Quincenal" ? "quincena" : "mes"}.`,
    },
    advances: {
      selectAll: "Descontar todo",
      clearAll: "Quitar descuentos",
      amountAriaLabel: "Monto a descontar del anticipo",
      emptyAdvances: "El operador no tiene anticipos pendientes de descontar.",
    },
    trips: {
      coveredBySalary: "Cubierto por sueldo base",
      emptyTrips: "No hay viajes completados pendientes de pago para este operador en las fechas seleccionadas.",
      supportParticipationBadge: "Apoyo",
      corridorBadgePrefix: "Corredor",
      corridorBadgeLabel: "Corredor",
      multipleOperatorsBadge: "Varios operadores",
      multipleOperatorsBadgeTitle:
        "Participaron varios operadores. Cada uno recibe el 100 % de la comisión según su regla.",
      falseTripBadge: "Viaje en falso",
      revenueSplitBadge: "Prorrateo",
      revenueSplitBadgeTitle: "Flete prorrateado",
      distanceOdometerSuffix: "por odómetro",
      distanceUnavailableLabel: "Sin km usable",
      distanceGapHint:
        "Este viaje no tiene tramos con llegada ni odómetro; la comisión por km queda en $0.",
      tripCol: "Viaje",
      routeCol: "Ruta / Tipo",
      payCol: "A pagar",
      reimbursementsCol: "Reembolsos",
      ruleCol: "Regla de pago",
      opsDetailCol: "Detalle",
    },
    zeroKmGate: {
      alertTitle: "Viajes sin distancia usable",
      alertDescription: (count: number) =>
        `Hay ${count} viaje(s) con tarifa por km y sin distancia usable. Corrige tramos u odómetro en el viaje, o confirma el pago en $0.`,
      ackLabel: (count: number) =>
        `Confirmo pago en $0 en ${count} viaje(s) sin km`,
      submitBlockedHint: "No se puede enviar: hay viajes por km sin distancia",
    },
    /** ADR-0085 E11 — por qué un viaje entra en $0. */
    zeroReason: {
      scheme: "$0 por tarifa",
      zero_km: "Sin km",
      no_rule: "Sin regla de pago",
      schemeTitle: "La regla de la tarifa da $0 en este viaje. Entra a este pago sin comisión.",
      noRuleTitle:
        "La tarifa no tiene regla para este tipo de ruta. Si lo incluyes, entra en $0 y no se vuelve a pagar.",
    },
    /** ADR-0085 E11 — viajes sin regla de pago: se confirman antes de guardar o enviar. */
    noRuleGate: {
      dialogTitle: "¿Incluir viajes sin regla de pago?",
      dialogDescription: (count: number) =>
        count === 1
          ? "La tarifa del operador no tiene regla para 1 viaje. Si lo incluyes, entra a este pago en $0 y ya no aparecerá en Por pagar."
          : `La tarifa del operador no tiene regla para ${count} viajes. Si los incluyes, entran a este pago en $0 y ya no aparecerán en Por pagar.`,
      fixHint:
        "Si deben pagarse, regresa y agrega la regla en Tarifas. Después de guardar, solo se corrige cancelando el pago.",
      confirmAction: "Incluir en $0",
      cancelAction: "Regresar",
    },
    /** ADR-0085 E11 — sueldo, prestaciones y deducciones van una vez por período. */
    periodicBlock: {
      containedTitle: "El sueldo de este período ya está en otro pago",
      containedDescription: (folio: string, status: string, period: string) =>
        `${folio} (${status}, ${period}) ya trae el sueldo base, las prestaciones fijas y las deducciones de la tarifa, así que aquí no se vuelven a sumar. Este pago lleva solo viajes, reembolsos y anticipos.`,
      partialTitle: "El período se cruza con otro pago",
      partialDescription: (folio: string, status: string, period: string) =>
        `${folio} (${status}) ya cubre ${period}. El sueldo se paga por período completo y no se divide por días: mueve el inicio de este pago al día siguiente para no pagarlo dos veces.`,
      partialDescriptionNoSuggestion: (folio: string, status: string, period: string) =>
        `${folio} (${status}) ya cubre ${period}. Ajusta las fechas para que este pago no incluya esos días.`,
      startOnAction: (date: string) => `Mover inicio al ${date}`,
      viewSettlementAction: (folio: string) => `Ver ${folio}`,
      submitBlockedHint: "Para guardar, mueve la fecha de inicio.",
      submitBlockedHintNoSuggestion: "Para guardar, ajusta las fechas.",
    },
    conflicts: {
      tripInActiveSettlementTitle: "Algunos viajes ya están en otro pago",
      tripInActiveSettlementLinePrefix: (tripCode: string) => `${tripCode} está en `,
      tripInActiveSettlementLineStatus: (status: string) => ` (${status})`,
      tripInActiveSettlementHint:
        "Se recalculó el pago sin esos viajes. Revisa el total y vuelve a guardar.",
    },
    dialog: {
      title: "¿Confirmar y enviar?",
      voboTitle: "¿Enviar a autorización?",
      description: "Revisa el monto a pagar antes de enviar a autorización.",
      voboDescription:
        "Se reserva el saldo de anticipos y el pago pasa a Por autorizar. Quien lo envía no puede autorizarlo.",
      driverLabel: "Operador",
      periodLabel: "Período",
      netLabel: "A pagar",
      confirmAction: "Confirmar y enviar",
      cancelAction: "Regresar a editar",
    },
    empty: {
      selectOperatorTitle: "Selecciona un operador",
      selectOperatorDescription: "Elige operador y fechas para calcular el pago automáticamente.",
      calculatingTitle: "Calculando el pago…",
      calculatingDescription: "Consultando viajes concluidos y anticipos abiertos.",
      previewErrorTitle: "No se pudo calcular el pago",
      noAgreementTitle: "Sin tarifa asignada",
      noAgreementDescription:
        "No hay una tarifa asignada para este operador en el período seleccionado. Asigna una tarifa antes de armar el pago.",
      missingSchemeTitle: "Sin tarifa asignada",
      missingSchemeDescription:
        "Este operador no tiene una tarifa vigente para el período. Crea o asígnale una en Tarifas para poder calcular sueldo, pago por viajes y prestaciones.",
      /** api#59 V5 — 422 `MISSING_COMPENSATION_SCHEME` con `details.reason`. */
      deactivatedSchemeTitle: "Tarifa desactivada",
      deactivatedSchemeDescription: (template: string) =>
        `${template} fue desactivada y no se usa para calcular pagos. Reasigna al operador o corrige la vigencia en Esquemas de compensación.`,
      deactivatedSchemeUnnamed: "La tarifa asignada",
      draftSchemeTitle: "Tarifa en borrador",
      draftSchemeDescription: (template: string) =>
        `${template} está en borrador y no se usa para calcular pagos. Actívala o reasigna al operador en Esquemas de compensación.`,
      draftSchemeUnnamed: "La tarifa asignada",
      schemeWithVersion: (name: string, version: number) => `${name} versión ${version}`,
      incompleteAgreementTitle: "Tarifa incompleta",
      incompleteAgreementDescription:
        "Hay una tarifa asignada, pero no genera montos pagables en este período. Completa reglas o prestaciones en Tarifas. Si la tarifa usa sueldo base, configúralo en la ficha del empleado.",
      configureAgreementAction: "Ir a Tarifas",
      configureCompensationAction: "Ir a Tarifas",
      configureIncompleteCompensationAction: "Completar tarifa",
      configureEmployeeSalaryAction: "Configurar sueldo en empleado",
    },
    toasts: {
      missingRequiredParams: "Completa los datos del operador y rango de fechas",
      submitSuccess: "Pago enviado para autorización",
      draftSuccess: "Pago guardado como borrador",
      submitDegradedToDraft: "Pago guardado como borrador",
      submitDegradedToDraftHint:
        "El neto quedó debajo del monto mínimo para pedir autorización, así que no la requiere: quedó listo para que otro usuario registre el pago.",
      createError: "Error al generar el pago",
      agreementRequired: "Asigna una tarifa para armar el pago",
    },
  },
  /** ADR-0085 E11-F3 — reembolsos de gastos que pagó el operador (handoff PRD 04 §B). */
  reimbursements: {
    kindLabel: "Pago de reembolsos",
    createAction: "Armar pago de reembolsos",
    tripLineSettledIn: (tripCode: string, folio: string) =>
      `Viaje ${tripCode} · comisión en ${folio}`,
    tripLineNotSettled: (tripCode: string) =>
      `Viaje ${tripCode} · sin comisión en pagos de este operador`,
    manualPayeeLine: "Asignado a este operador por cambio de conductor",
    table: {
      trip: "Viaje",
      concept: "Concepto",
      reason: "Motivo",
      approvedAt: "Aprobado el",
      amount: "Monto",
      total: "Total",
      driverReassigned: "Cambio de conductor",
    },
    /** E11 punto 10: el texto de `approved` es literal del ADR más la frase que aprobó el CEO. */
    lateAlert: {
      title: "Hay reembolsos nuevos para este operador",
      approvedBody: (amount: string) =>
        `Después de autorizar este pago se aprobaron gastos pagados por el operador por ${amount}. No forman parte de este pago. Puedes registrarlo tal como está y pagar los reembolsos en un pago aparte. Si no armas un pago aparte, se sumarán al siguiente pago del operador.`,
      draftBody: (amount: string) =>
        `Después de armar este pago se aprobaron gastos pagados por el operador por ${amount}. No forman parte de este pago y no se agregan a él. Puedes pagarlos en un pago aparte o dejarlos para el siguiente pago del operador.`,
      viewExpenses: "Ver gastos",
    },
    lateSheet: {
      title: "Reembolsos nuevos",
      description: "Gastos pagados por el operador que se aprobaron después de este pago.",
      empty: "Estos gastos ya se incluyeron en otro pago.",
    },
    cancelled: {
      title: "Pago cancelado",
      body: "Sus viajes, sueldo y reembolsos quedaron libres para armar un pago nuevo.",
      rebuildAction: "Armar pago nuevo con este período",
    },
    detail: {
      subtitle: (date: string) => `Pago de reembolsos · creado el ${date}`,
      grossSubtext: "Reembolsos y partidas manuales",
    },
    lateSection: {
      title: (count: number) => `Reembolsos de viajes ya incluidos en otro pago (${count})`,
      description: "Gastos aprobados después de que su viaje entró en otro pago. Se pagan en este.",
    },
    payeeSection: {
      title: (count: number) => `Requiere definir a quién se reembolsa (${count})`,
      description: (operator: string) =>
        `Al viaje le cambiaron de conductor. Marca solo los gastos que pagó ${operator}; los que no marques quedan pendientes para el conductor que corresponda.`,
      checkboxLabel: (operator: string, amount: string, tripCode: string) =>
        `Reembolsar a ${operator} el gasto de ${amount} del viaje ${tripCode}`,
      footer: "Lo que marques queda registrado con tu nombre y la fecha.",
      operatorFallback: "este operador",
    },
    createPage: {
      title: "Pago de reembolsos",
      subtitle: "Paga al operador los gastos de viaje que cubrió con su dinero. No lleva viajes ni sueldo.",
      operatorLabel: "Operador",
      readyTitle: (count: number) => `1. Reembolsos a pagar (${count})`,
      readyDescription:
        "Gastos aprobados que pagó el operador. Entran completos; si alguno está mal, corrígelo en Costos del viaje.",
      readyEmpty: "Sin reembolsos listos. Revisa los gastos por definir abajo.",
      payeePrefix: "2.",
      advancesTitle: (count: number) => `3. Anticipos por descontar (${count})`,
      notesTitle: "4. Observaciones",
      backToFolio: (folio: string) => `Volver a ${folio}`,
      backToFolioFallback: "Volver al pago",
      backToPending: "Volver a por pagar",
      noEmployeeTitle: "Elige al operador desde Por pagar",
      noEmployeeAction: "Ir a Por pagar",
      loadingTitle: "Buscando reembolsos pendientes…",
      emptyTitle: "Este operador no tiene reembolsos pendientes",
      emptyDescription: "Aparecen aquí cuando se aprueba en Costos un gasto que pagó el operador.",
      emptyAction: "Volver",
      requiresExpensesError:
        "Marca al menos un gasto. Un pago de reembolsos necesita al menos un reembolso.",
      dialogKindLabel: "Tipo",
    },
    errors: {
      requiresExpensesTitle: "No hay reembolsos para pagar",
      requiresExpensesBody: "Otro usuario pudo haberlos incluido en otro pago. Se actualizó la lista.",
      payeeNotDriverTitle: (tripCode: string) => `Este operador no manejó el viaje ${tripCode}`,
      payeeNotDriverTitleFallback: "Este operador no manejó el viaje",
      payeeNotDriverBody:
        "Solo se puede reembolsar a un conductor que haya tenido asignado ese viaje. Se quitó la marca de ese gasto.",
      payeeNotDriverRow: "Este operador no tuvo asignado el viaje.",
      notEligibleTitle: "Un gasto ya no se puede reembolsar aquí",
      notEligibleBody: (tripCode: string) =>
        `El gasto del viaje ${tripCode} cambió o ya está en otro pago. Se actualizó la lista.`,
      notEligibleBodyFallback: "Un gasto cambió o ya está en otro pago. Se actualizó la lista.",
      notEligibleRow: "Este gasto ya no se puede reembolsar aquí.",
      inActiveSettlementTitle: "Algunos reembolsos ya están en otro pago",
      inActiveSettlementLinePrefix: (tripCode: string, amount: string | null) =>
        amount ? `Viaje ${tripCode} · ${amount} está en ` : `Viaje ${tripCode} está en `,
      inActiveSettlementLineStatus: (status: string) => ` (${status})`,
      inActiveSettlementFallback: "Otro pago tomó estos reembolsos mientras armabas este.",
      inActiveSettlementHint: "Se recalculó el pago sin ellos. Revisa el total y vuelve a guardar.",
      alreadyPaidTitle: "No se pudo registrar el pago",
      alreadyPaidBody: (folio: string) =>
        `Un reembolso de este pago ya se pagó en ${folio}. Para no pagarlo dos veces, cancela este pago y ármalo de nuevo sin ese gasto.`,
      alreadyPaidBodyNoFolio:
        "Un reembolso de este pago ya se pagó en otro pago. Para no pagarlo dos veces, cancela este pago y ármalo de nuevo sin ese gasto.",
    },
    backlog: {
      rowType: "Solo reembolsos",
      periodNotApplicable: "No aplica",
      periodTooltip: "Un pago de reembolsos no lleva período.",
      payeeRequiredBadge: (count: number) => `Requiere definir a quién se reembolsa · ${count}`,
      payeeRequiredTooltip:
        "Al viaje le cambiaron de conductor. Al armar el pago, marca los gastos que pagó este operador.",
    },
    receipt: {
      documentTitle: "Pago de reembolsos a operador",
      documentSubtitle: "Comprobante operativo de reembolso de gastos de viaje",
      dateLabel: "Fecha:",
      earningsTitle: "1. Reembolsos de gastos de viaje (+)",
      driverDisclaimer:
        "Recibí a mi entera satisfacción la cantidad neta indicada por concepto de reembolso de gastos de viaje que pagué.",
    },
  },
  agreementsDialog: {
    title: "Configurar tarifa de operador",
    description: "Define el sueldo base recurrente y las comisiones por clase de ruta para este operador.",
    employeeLabel: "Operador / Conductor *",
    employeePlaceholder: "Seleccionar operador",
    fixedSalarySectionTitle: "Sueldo base recurrente",
    fixedSalarySectionDescription: "Ingreso fijo periódico garantizado al chofer independientemente de los viajes.",
    fixedSalarySuggestedNotice: "Monto y frecuencia sugeridos según la ficha laboral del operador.",
    fixedSalaryAmountLabel: "Monto de sueldo base ($)",
    fixedSalaryPeriodLabel: "Frecuencia de pago",
    fixedSalaryGuaranteedLabel: "Sueldo 100% garantizado (se paga íntegro aunque no haya viajes en el período)",
    routesSectionTitle: "Comisiones por clase de ruta",
    routesSectionDescription:
      "Cada clase de ruta puede tener su propia regla de pago. Debe coincidir con la clase elegida al despachar el viaje (Foráneo, Local o Transfer / Patio).",
    addRuleButton: "Agregar condición de ruta",
    routeTypeLabel: "Clase de ruta",
    calculationTypeLabel: "Tipo de comisión",
    calculationTypePlaceholder: "Seleccionar tipo de comisión",
    ratePerKmLabel: "Tarifa por kilómetro ($/km)",
    percentageRateLabel: "% de comisión sobre flete",
    baseRateLabel: "Tarifa fija por viaje ($)",
    helperDailyRateLabel: "Tarifa diaria / ayudante ($/día)",
    minimumGuaranteedLabel: "Garantía mínima por viaje ($)",
    localCoveredNote:
      "Esta clase de ruta queda cubierta íntegramente por el sueldo base recurrente (sin comisión adicional).",
    effectiveFromLabel: "Inicio de vigencia *",
    effectiveToLabel: "Fin de vigencia (opcional)",
    notesLabel: "Observaciones / Acuerdos adicionales",
    notesPlaceholder: "Detalles sobre acuerdos de viáticos, bono de rendimiento o condiciones especiales...",
    saving: "Guardando tarifa...",
    save: "Guardar tarifa de operador",
    toastSuccess: "Tarifa de operador guardada exitosamente",
    toastErrorTitle: "Error al registrar tarifa",
  },
  advancesDialog: {
    title: "Registrar anticipo a operador",
    description:
      "Efectivo adelantado al operador: se reserva al autorizar o entregar y se descuenta en el pago. No registres el mismo desembolso otra vez como gasto del viaje en Costos.",
    employeeLabel: "Operador / Empleado *",
    employeePlaceholder: "Seleccionar operador",
    amountLabel: "Monto ($) *",
    categoryLabel: "Categoría *",
    categoryPlaceholder: "Categoría",
    paymentMethodLabel: "Método de entrega *",
    paymentMethodPlaceholder: "Método",
    tripLabel: "Viaje (opcional)",
    tripNone: "Sin viaje (cuenta del operador)",
    tripNoDriver:
      "Este empleado no tiene rol de operador; no se puede etiquetar un viaje.",
    bankReferenceLabel: "Referencia bancaria / Folio",
    bankReferencePlaceholder: "Ej. SPEI 889922",
    notesLabel: "Notas / Justificación",
    notesPlaceholder: "Detalles del viaje o motivo de la entrega...",
    saving: "Guardando...",
    save: "Registrar anticipo",
    toastSuccess: "Anticipo registrado exitosamente",
    toastErrorTitle: "Error al registrar anticipo",
  },
  /** ADR-0099 F6b (handoff 07 D15–D20): corregir, editar, nota y cancelar anticipos. */
  advanceFlow: {
    menu: {
      edit: "Editar anticipo…",
      correctAndResubmit: "Corregir y reenviar",
      resubmitUnchanged: "Reenviar sin cambios",
      addNote: "Agregar nota…",
      cancel: "Cancelar anticipo…",
      returnForCorrection: "Devolver para corregir",
      history: "Ver historial",
    },
    editSheet: {
      title: (folio: string) => `Editar anticipo ${folio}`,
      correctTitle: (folio: string) => `Corregir anticipo ${folio}`,
      description: "Los cambios quedan en el historial de autorización.",
      operatorHint: "Para cambiar al operador, cancela este anticipo y crea otro.",
      materialHintSigned: (field: string, name: string, role: string | null, date: string) =>
        `Cambiar ${field} anula la autorización de ${name}${role ? ` (${role})` : ""} del ${date}.`,
      materialHintRestart: (field: string) => `Cambiar ${field} reinicia la autorización.`,
      materialFields: "monto, categoría, método o viaje",
      save: "Guardar cambios",
      saveAndResubmit: "Guardar y reenviar",
      saving: "Guardando…",
      cancel: "Cancelar",
      validationTitle: "Revisa los campos marcados",
      saveErrorTitle: "No se pudo guardar el anticipo",
    },
    staleAlert: {
      title: "Cambió de estado mientras lo editabas",
      body: "Recarga para ver cómo está ahora.",
      lostChanges: "Los cambios sin guardar se perderán.",
      action: "Cerrar y recargar",
    },
    confirmMaterial: {
      title: "¿Guardar y volver a autorización?",
      restart: "La autorización empieza de nuevo con la regla vigente.",
      signatureVoided: (name: string) => `Se anula la firma de ${name} (paso 1).`,
      authorizationLost: (name: string, role: string | null, date: string) =>
        `Pierde la autorización de ${name}${role ? ` (${role})` : ""} del ${date} y vuelve a autorización.`,
      authorizationLostUnknown: "Pierde la autorización vigente y vuelve a autorización.",
      requesterWarning: "Quedarás como solicitante: no podrás autorizar este cambio.",
      confirm: "Guardar y volver a autorización",
      back: "Seguir editando",
    },
    fieldLabels: {
      employeeId: "Operador",
      amount: "Monto",
      category: "Categoría",
      paymentMethod: "Método de pago",
      tripId: "Viaje",
    } as Record<string, string>,
    toasts: {
      updated: "Anticipo actualizado",
      flowRestarted: "Anticipo actualizado; la autorización empezó de nuevo",
      reapprovalRequired: "Anticipo actualizado; requiere nueva autorización",
      resubmitted: "Anticipo reenviado a autorización",
      noteAdded: "Nota agregada",
      noteError: "No se pudo agregar la nota",
      cancelled: "Anticipo cancelado",
      cancelError: "No se pudo cancelar el anticipo",
      returned: "Anticipo devuelto para corregir",
      returnError: "No se pudo devolver el anticipo",
    },
    noteDialog: {
      title: "Agregar nota",
      currentLabel: "Nota actual",
      currentEmpty: "Sin nota.",
      additionalLabel: "Nota adicional",
      additionalPlaceholder: "Ej. El operador devolvió $500 en efectivo.",
      hint: "La nota anterior no se modifica.",
      required: "Escribe la nota adicional",
      tooLong: "La nota completa no puede pasar de 500 caracteres.",
      save: "Agregar nota",
      saving: "Guardando…",
      cancel: "Cancelar",
    },
    cancelDialog: {
      draftTitle: "¿Cancelar este borrador?",
      draftBody: "No se podrá recuperar.",
      title: (folio: string) => `Cancelar anticipo ${folio}`,
      body: "Indica el motivo (mínimo 5 caracteres).",
      authorizedWarning: "Se anula la autorización vigente.",
      reasonLabel: "Motivo",
      reasonTooShort: "El motivo debe tener al menos 5 caracteres",
      reasonTooLong: "El motivo no puede pasar de 500 caracteres",
      confirm: "Cancelar anticipo",
      pending: "Cancelando…",
      back: "Volver",
    },
  },
  /** ADR-0099 F6c + ADR-0085 E10 (handoff 07 D21–D28): corregir, devolver y recibo. */
  settlementFlow: {
    header: {
      correct: "Corregir",
      returnForCorrection: "Devolver para corregir",
      previewReceipt: "Vista previa del recibo",
      printReceipt: "Imprimir recibo",
      history: "Ver historial completo",
      menuHistory: "Ver historial",
      moreActionsSr: "Más acciones",
    },
    returnedAlert: {
      correctAndResubmit: "Corregir y reenviar",
      resubmitUnchanged: "Reenviar sin cambios",
    },
    returnedChip: "Devuelto",
    returnVsRejectHint:
      "Si solo hay un error corregible, devuelve el pago; rechazar lo cierra.",
    sheet: {
      title: (folio: string) => `Corregir pago ${folio}`,
      description: "Los cambios quedan en el historial de autorización.",
      calculatedTitle: "Lo calcula el sistema",
      calculatedHint:
        "Se calculó con la tarifa guardada al crearla. Para cambiar viajes, periodo u operador hay que cancelar este pago y crear otro.",
      operatorLabel: "Operador",
      periodLabel: "Periodo",
      tripsLabel: "Viajes",
      tripsCount: (count: number) => (count === 1 ? "1 viaje" : `${count} viajes`),
      calculatedSubtotalLabel: "Subtotal calculado",
      advancesTitle: "Anticipos aplicados",
      advancesDraftHint: "Elige qué anticipos descontar y ajusta el monto si hace falta.",
      advancesLockedHint:
        "Los anticipos solo se cambian en borrador. Si hay un error, devuélvelo para corregir.",
      advancesDeductedAtCreate:
        "Estos anticipos se descontaron al crear el pago y no se cambian aquí.",
      advancesReserved:
        "Estos anticipos ya están reservados para este pago y no se cambian aquí.",
      advancesLoading: "Cargando anticipos del operador…",
      advancesLoadError: "No se pudieron cargar los anticipos del operador.",
      advancesEmpty: "Sin anticipos aplicados.",
      advanceBalance: (amount: string) => `Saldo disponible: ${amount}`,
      advanceAmountLabel: (folio: string) => `Monto a descontar de ${folio}`,
      notesTitle: "Notas",
      notesPlaceholder: "Instrucciones para tesorería o acuerdos especiales…",
      authorizerHint:
        "¿Prefieres que quien lo capturó lo corrija? Usa Devolver para corregir.",
      footerTotals: (a: string, a2: string, b: string, b2: string, c: string, c2: string) =>
        `Percepciones ${a} → ${a2} · Deducciones ${b} → ${b2} · Neto ${c} → ${c2}`,
      perceptionsLabel: "Percepciones",
      deductionsLabel: "Deducciones",
      netLabel: "Neto",
      consequence: {
        draft: "Sigue en borrador.",
        pending_approval:
          "La autorización empieza de nuevo con la regla vigente. Quedarás como solicitante.",
        approved:
          "Pierde la autorización vigente y vuelve a autorización aunque el neto quede debajo del monto mínimo. Quedarás como solicitante.",
      },
      save: "Guardar",
      saveCorrection: "Guardar corrección",
      saveAndResubmit: "Guardar y reenviar",
      saveDraft: "Guardar borrador",
      saving: "Guardando…",
      cancel: "Cancelar",
      validationTitle: "Revisa los campos marcados",
      saveErrorTitle: "No se pudo guardar la corrección",
    },
    manualItems: {
      title: "Partidas manuales",
      description: "Bonos, penalizaciones, retenciones o ajustes capturados a mano.",
      empty: "Sin partidas manuales.",
      add: "Agregar partida",
      remove: "Quitar partida",
      typeLabel: "Tipo",
      typePlaceholder: "Tipo de partida",
      types: {
        bonus: "Bono",
        penalty_deduction: "Penalización",
        tax_deduction: "Retención de impuestos",
        adjustment: "Ajuste",
      },
      directionLabel: "Sentido",
      directionPlaceholder: "Elige el sentido",
      directionAdd: "Suma al pago",
      directionSubtract: "Resta al pago",
      descriptionLabel: "Descripción",
      descriptionPlaceholder: "Ej. Bono por puntualidad",
      amountLabel: "Monto",
      tripLabel: "Viaje (opcional)",
      tripNone: "Sin viaje",
      signAdds: (amount: string) => `+${amount} al pago`,
      signSubtracts: (amount: string) => `−${amount} al pago`,
      rowLabel: (index: number) => `Partida ${index}`,
    },
    confirm: {
      title: "¿Guardar y volver a autorización?",
      itemsTitle: "Partidas manuales",
      added: (label: string) => `Nueva: ${label}`,
      removed: (label: string) => `Se quita: ${label}`,
      changed: (from: string, to: string) => `${from} → ${to}`,
      notesChanged: "Notas: cambian",
      netLine: (from: string, to: string) => `Neto: ${from} → ${to}`,
      requesterWarning: "Quedarás como solicitante: no podrás autorizar este cambio.",
      confirm: "Guardar y volver a autorización",
      back: "Seguir editando",
    },
    staleAlert: {
      title: "Cambió de estado mientras lo editabas",
      body: "Recarga para ver cómo está ahora.",
      lostChanges: "Los cambios sin guardar se perderán.",
      action: "Cerrar y recargar",
    },
    disburse: {
      revisionChangedTitle: "El pago cambió",
      revisionChanged:
        "El pago cambió desde que lo abriste. Revisa el neto antes de registrar el pago.",
      reload: "Recargar",
      successTitle: "Pago registrado correctamente",
      dialogDescriptionPrefix:
        "Captura la referencia bancaria o folio de la transferencia efectuada para registrar el folio",
    },
    toasts: {
      updated: "Pago actualizado",
      flowRestarted: "Pago actualizado; la autorización empezó de nuevo",
      reapprovalRequired: "Pago corregido; vuelve a autorización",
      resubmitted: "Pago reenviado a autorización",
      returned: "Pago devuelto para corregir",
      returnError: "No se pudo devolver el pago",
    },
    create: {
      manualItemsHint: "Las correcciones manuales siempre piden autorización.",
      manualItemsLabel: "Partidas manuales",
      manualAdditionsLabel: "Bonos y ajustes a favor",
      manualDeductionsLabel: "Penalizaciones y ajustes en contra",
    },
    /** Tope de descuentos: bruto → tarifa → manuales en contra → anticipos. */
    deductionsCap: {
      advancesExceed: (max: string) =>
        `Los anticipos superan lo que cabe en este pago (máximo ${max}). El resto queda pendiente en el anticipo para el siguiente corte.`,
      manualExceed: "Los descuentos manuales superan lo que ganó el operador en este corte.",
      fitMaxAction: "Descontar el máximo posible",
      maxDeductibleHint: (max: string) => `Máximo a descontar en este pago: ${max}`,
      pendingNextCut: (amount: string) => `Quedan ${amount} pendientes para el siguiente corte.`,
      templateOmitted: (amount: string) => `No aplicado ${amount} por ingreso insuficiente`,
      templateOmittedLine: (label: string, amount: string) =>
        `${label}: no aplicado ${amount} por ingreso insuficiente`,
      uncoveredLabel: "Descuento no cubierto",
      uncoveredHint: "Descuentos que superaron lo ganado; no se cobran en este pago.",
      actionErrorTitle: "Los descuentos superan lo ganado",
    },
  },
  periodStepper: {
    label: "Período de pago",
    weekPrefix: (weekNum: number) => `Sem ${weekNum}`,
    prevAriaLabel: "Período anterior",
    nextAriaLabel: "Período siguiente",
  },
} as const;
