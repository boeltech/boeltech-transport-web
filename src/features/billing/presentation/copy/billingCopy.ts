export const billingCopy = {
  page: {
    sectionTitle: "Tu plan",
    title: "Tu plan",
    description:
      "Cobro por motriz, bolsa de timbres del mes y si hay algo por pagar. Sin fee de plataforma ni mínimo de cuenta.",
  },
  /** Aviso único de la parte superior: se muestra solo el primero que aplique. */
  notices: {
    noPlan: {
      title: "Tu empresa no tiene un plan activo",
      description:
        "Sin un plan activo no puedes crear viajes ni facturar. Escríbenos para activarlo; entretanto puedes entrar y consultar esta página.",
    },
    accessDenied: {
      title: "No puedes ver tu plan",
      description:
        "Tu usuario no tiene permiso para consultar el plan de la empresa. Si necesitas ese acceso, pide ayuda a un administrador.",
    },
    blocked: {
      title: "Tu plan está pausado o cancelado",
      description:
        "Mientras esté en este estado no puedes crear viajes ni facturar. Escríbenos para reactivarlo.",
    },
    /** @deprecated Surfacer de saldo = BillingArrearsCard (D3); copy retenido por compat de tests históricos. */
    arrears: {
      title: "Saldo pendiente",
      description: (args: {
        totalLabel: string;
        periodsLabel: string;
        dueOrOverdueLabel: string;
      }) =>
        `Tienes un saldo de ${args.totalLabel} por mes(es) ${args.periodsLabel}. ${args.dueOrOverdueLabel} Puedes seguir operando y facturando con normalidad; contacta a Boeltech para regularizar.`,
      dueOn: (dateLabel: string) =>
        dateLabel
          ? `Vence el ${dateLabel}.`
          : "Consulta la fecha de vencimiento abajo.",
      overdueBy: (days: number) =>
        days === 1
          ? "Venció hace 1 día."
          : `Venció hace ${days} días.`,
    },
    pastDue: {
      title: "Pago pendiente",
      description: (deadlineLabel: string) =>
        deadlineLabel
          ? `Puedes seguir operando y facturando con normalidad. Regulariza el pago con Boeltech antes del ${deadlineLabel}.`
          : "Puedes seguir operando y facturando con normalidad. Contacta a Boeltech para regularizar el pago.",
      softCapNote:
        "Si agotas los timbres del plan, puedes seguir emitiendo; el excedente se suma al estimado del mes.",
    },
    trialExhausted: {
      title: "Se acabaron los timbres de tu prueba",
      description: (included: number) =>
        included === 1
          ? "Usaste el único timbre de la prueba. Ya no puedes facturar hasta activar tu plan."
          : `Usaste los ${included} timbres de la prueba. Ya no puedes facturar hasta activar tu plan.`,
    },
    trialEnded: {
      title: "Tu prueba llegó a su fecha de fin",
      description: (date: string) =>
        `La fecha de fin registrada es ${date}. El timbrado puede quedar bloqueado; escríbenos para activar tu plan y evitar perder el acceso operativo.`,
    },
    stampsExhausted: {
      title: "Se acabaron los timbres del mes",
      description: (runOutSentence: string) =>
        runOutSentence ||
        "Escríbenos para saber cómo seguir facturando este mes.",
    },
    stampsLow: {
      title: "Te quedan pocos timbres este mes",
      description: (remaining: number) =>
        remaining === 1
          ? "Te queda 1 timbre en la bolsa del mes."
          : `Te quedan ${remaining} timbres en la bolsa del mes.`,
    },
    /**
     * ADR-0095 OVER_LIMIT — operar OK; no crear/invitar/alta hasta ajustar.
     * Un solo aviso cubre users, branches o ambos.
     */
    capacityOverQuota: {
      title: {
        users: "Usuarios por encima de tu cupo",
        branches: "Sucursales por encima de tu cupo",
        both: "Cupo de usuarios y sucursales excedido",
      },
      description: {
        users:
          "Puedes seguir operando con lo que ya tienes. No puedes crear ni invitar usuarios hasta desactivar a alguien o ajustar el cupo con Boeltech.",
        branches:
          "Puedes seguir operando con lo que ya tienes. No puedes dar de alta sucursales hasta desactivar alguna o ajustar el cupo con Boeltech.",
        both:
          "Puedes seguir operando con lo que ya tienes. No puedes crear usuarios ni dar de alta sucursales hasta desactivar recursos o ajustar el cupo con Boeltech.",
      },
      goUsers: "Ir a usuarios",
      goBranches: "Ir a sucursales",
    },
    contactCta: "Escribir a Boeltech",
  },
  stamps: {
    title: "Bolsa de timbres del mes",
    description:
      "Cada factura o complemento de pago usa un timbre de la bolsa (30 por motriz).",
    periodLabel: (period: string) => `Mes en curso: ${period}`,
    loading: "Cargando consumo…",
    unavailable: "No pudimos mostrar tu consumo de timbres.",
    summary: (used: number, included: number) =>
      `${used} de ${included} timbres usados`,
    bolsaHint: (stampsPerMotriz: number, qFact: number) =>
      qFact === 1
        ? `Bolsa = ${stampsPerMotriz} × 1 motriz`
        : `Bolsa = ${stampsPerMotriz} × ${qFact} motrizes`,
    remaining: (count: number) =>
      count === 1
        ? "Te queda 1 timbre en la bolsa este mes"
        : `Te quedan ${count} timbres en la bolsa este mes`,
    prepaidRemaining: (count: number) =>
      count === 1
        ? "Además tienes 1 timbre comprado aparte, sin fecha de vencimiento."
        : `Además tienes ${count} timbres comprados aparte, sin fecha de vencimiento.`,
    usedPercent: (percent: number) => `${percent}% usado`,
    /** Qué pasa al agotar el paquete del plan, en una sola frase. */
    runOut: {
      soft_cap:
        "Si se acaba la bolsa, puedes seguir facturando y se cobra cada timbre extra.",
      hard_cap:
        "Si se acaba la bolsa, la facturación se detiene hasta el siguiente mes.",
    } as Record<string, string>,
    overageTitle: "Timbres extra (fuera de bolsa)",
    overage: (stamps: number, amount: string) =>
      stamps === 1
        ? `1 timbre extra este mes · ${amount} estimado`
        : `${stamps} timbres extra este mes · ${amount} estimado`,
    overageUnit: (unitPrice: string) =>
      `Tarifa de tu banda: ${unitPrice} por timbre extra`,
    history: {
      showLabel: "Ver meses anteriores",
      hideLabel: "Ocultar meses anteriores",
      columns: {
        period: "Mes",
        used: "Timbres usados",
        overage: "Extra",
      },
      none: "Sin extra",
      empty: "Aún no hay meses cerrados con consumo.",
      mobileUsed: (used: number) =>
        used === 1 ? "1 timbre usado" : `${used} timbres usados`,
      mobileOverage: (count: number) =>
        count === 1 ? "1 extra" : `${count} extra`,
    },
  },
  /** Above-the-fold: plan + estado (D1). Detalle en BillingPlanCard. */
  planStatusStrip: {
    loading: "Cargando plan…",
    periodUntil: (endLabel: string) => `Periodo hasta ${endLabel}`,
    charged: "Cobrado",
    chargedPeriod: (period: string) => `Cobrado · ${period}`,
  },
  plan: {
    title: "Tu cobro por motriz",
    description:
      "Pagás por motriz. Tu banda incluye usuarios, sucursales e historial consultable en listados. Sin fee ni mínimo de cuenta.",
    /** SoT §2 — micro-pitch con N/M/H de la banda granted. */
    capacityPitch: (users: string, branches: string, history: string) =>
      `Tu banda incluye ${users} usuarios, ${branches} sucursales y ${history} de historial consultable en listados. Si te pasas de cupo tras un downgrade, sigues operando lo existente; no puedes crecer hasta ajustar.`,
    pendingBandHint:
      "Cambio de cupo programado el 1.º del próximo mes (ciclo CDMX).",
    loading: "Cargando plan…",
    empty: {
      title: "Tu empresa no tiene un plan activo",
      description:
        "Cuando Boeltech active tu plan verás aquí el precio por motriz y tu bolsa.",
      contactCta: "Escribir a Boeltech",
    },
    planFallback: "Plan comercial",
    pricePerMotriz: (amount: string) => `${amount} / motriz / mes`,
    pricePerMotrizQuote: "Cotización por flota",
    pricePerMotrizQuoteHint:
      "Flotas de más de 100 motrizes se cotizan deal a deal.",
    noFeeNote: "Sin fee de plataforma ni mínimo de cuenta.",
    bandLabels: {
      micro: "Micro",
      pequena: "Pequeña",
      mediana: "Mediana",
      grande: "Grande (cotización)",
    } as Record<string, string>,
    fields: {
      band: "Banda",
      /** Glosa humana; la fórmula 30×Q vive en Bolsa de timbres. */
      qFact: "Motrizes cobrables",
      bolsa: "Bolsa de timbres",
      overageUnit: "Timbre extra",
      users: "Usuarios",
      branches: "Sucursales",
      historyConsultable: "Historial consultable",
      trial: "Fin de la prueba",
      notes: "Notas de tu acuerdo",
      legacyMonthly: "Precio mensual del plan",
    },
    /** usage / granted; granted null → ilimitado. */
    usageGranted: (usage: number, grantedLabel: string) =>
      `${usage} / ${grantedLabel}`,
    overLimitHint: "Por encima del cupo — no puedes crecer hasta ajustar.",
    bandRange: (range: string) => `${range} motrizes`,
    qFactValue: (q: number) =>
      q === 1 ? "1 motriz este periodo" : `${q} motrizes este periodo`,
    qFactPending: "Aún no hay conteo de motrizes para este periodo.",
    /** Cupo en claro; el desglose 30× vive en Bolsa de timbres. */
    bolsaValue: (bolsa: number, _stampsPer?: number, _q?: number | null) =>
      `${bolsa} timbres`,
    overageUnitValue: (amount: string) => `${amount} / timbre`,
    cargoEstimate: (q: number, unit: string, total: string) =>
      q === 1
        ? `1 motriz × ${unit} = ${total}`
        : `${q} motrizes × ${unit} = ${total}`,
    statusLabels: {
      trialing: "En prueba",
      active: "Activa",
      past_due: "Pago pendiente",
      paused: "Pausada",
      canceled: "Cancelada",
    } as Record<string, string>,
    cycleLabels: {
      monthly: "cada mes",
      annual: "cada año",
    } as Record<string, string>,
    trialQuotaHint: (included: number) =>
      included === 1
        ? "Durante la prueba tienes 1 timbre; al activar tu plan se restaura la bolsa completa."
        : `Durante la prueba tienes ${included} timbres; al activar tu plan se restaura la bolsa completa.`,
    trialEndedHint:
      "La fecha de fin de prueba ya pasó. Activa tu plan para seguir facturando.",
    unlimited: "Sin límite",
    historyMonths: (months: number) =>
      months === 1 ? "1 mes" : `${months} meses`,
    /** SoT: historial = consultable en listados (nunca “retención SAT”). */
    historyMonthsConsultable: (months: number) =>
      months === 1
        ? "1 mes consultable en listados"
        : `${months} meses consultables en listados`,
    periodRange: (start: string, end: string) => `${start} — ${end}`,
  },
  costs: {
    title: "Este mes",
    description:
      "Estimación del mes en curso (motrizes × precio de banda + extras).",
    periodLabel: (period: string) => `Mes en curso: ${period}`,
    loading: "Cargando el estimado…",
    unavailable: "No pudimos mostrar el estimado de tu mes.",
    totalLabel: "Estimado a pagar",
    totalHint: "Incluye impuestos",
    cycleHint: (cycle: string) => `Se cobra ${cycle}`,
    rows: {
      plan: "Precio del plan",
      motrizCargo: "Cargo por motrizes",
      motrizQuote: "Cargo por motrizes (cotización)",
      modules: "Módulos adicionales",
      overage: "Timbres extra (fuera de bolsa)",
      subtotal: "Subtotal",
      iva: "Impuestos",
    },
    motrizCargoHint: (q: number, unit: string) =>
      q === 1 ? `1 motriz × ${unit}` : `${q} motrizes × ${unit}`,
    quotePending: "Pendiente de cotización Boeltech",
    breakdownToggle: {
      show: "Ver desglose",
      hide: "Ocultar desglose",
    },
    disclaimer:
      "Es una estimación. Boeltech te envía la factura del mes por correo.",
  },
  arrears: {
    title: "Saldo pendiente",
    description:
      "Todavía debes cargos de suscripción de meses anteriores. Puedes seguir operando; paga con tu método guardado o escríbenos.",
    /** Orientación de gracia (misma idea que notice past_due; solo en la card). */
    graceOperate: (deadlineLabel: string) =>
      deadlineLabel
        ? `Puedes seguir operando y facturando con normalidad. Regulariza el pago antes del ${deadlineLabel}.`
        : "Puedes seguir operando y facturando con normalidad. Contacta a Boeltech para regularizar el pago.",
    loading: "Cargando saldo…",
    openCount: (count: number) =>
      count === 1 ? "1 cargo pendiente" : `${count} cargos pendientes`,
    totalLabel: "Total por pagar",
    columns: {
      period: "Mes",
      amount: "Monto",
      dueDate: "Vencimiento",
      daysOverdue: "Atraso",
    },
    /** Estado de un cobro open que aún no vence (nunca «Al corriente»). */
    pendingPayment: "Por pagar",
    daysOverdue: (days: number) =>
      days === 1 ? "1 día de atraso" : `${days} días de atraso`,
    dueOn: (dateLabel: string) => `Vence el ${dateLabel}`,
    overdueOn: (dateLabel: string) => `Venció el ${dateLabel}`,
    /** CTA cargo SaaS (ADR-0076) — no confundir con pagar factura CFDI del viaje. */
    payNow: "Pagar ahora",
    paying: "Procesando cargo…",
    paySuccess: "Cargo de suscripción registrado",
    payRequiresAction: "Confirma la autenticación de tu tarjeta para completar el cargo.",
    payFailed: "No se pudo completar el cargo de suscripción.",
    payNeedsCard:
      "Guarda un método de pago abajo para pagar el cargo de suscripción desde aquí.",
    autoChargeFailed: "No se pudo cobrar la tarjeta",
    autoChargeFailedHint:
      "El cargo de suscripción Tlamx sigue pendiente. Usa Pagar ahora o transfiere.",
    autoChargeRequiresAction: "Tu banco pide confirmación",
    autoChargeRequiresActionHint:
      "Pulsa Pagar ahora para confirmar el cargo de suscripción Tlamx.",
    footer:
      "Estos cargos son de tu suscripción Boeltech (SaaS), no de facturas CFDI de flete. El estimado del mes actual está más abajo, en Este mes.",
    contactCta: "Escribir a Boeltech",
  },
  paymentMethods: {
    title: "Métodos de pago",
    description:
      "Tarjeta para cargos de tu suscripción Boeltech. No se usa para pagar facturas CFDI de viajes.",
    loading: "Cargando métodos de pago…",
    empty: "Aún no hay una tarjeta guardada para la suscripción.",
    autoChargeHint:
      "Esta tarjeta se usa para el cargo mensual de Tlamx. Puedes seguir pagando por transferencia.",
    brandFallback: "Tarjeta",
    cardLabel: (brand: string, last4: string) => `${brand} •••• ${last4}`,
    expires: (month: string, year: string) => `Vence ${month}/${year}`,
    defaultBadge: "Predeterminada",
    setDefault: "Usar por defecto",
    defaultSuccess: "Método de pago predeterminado actualizado",
    delete: "Eliminar",
    deleteTitle: "¿Eliminar este método de pago?",
    deleteDescription: (label: string) =>
      `Se quitará ${label} de los cargos de suscripción. Puedes agregar otra tarjeta después.`,
    deleteSuccess: "Método de pago eliminado",
    addCard: "Agregar tarjeta",
    startingSetup: "Preparando…",
    saveCard: "Guardar tarjeta",
    saving: "Guardando…",
    cancel: "Cancelar",
    setupSuccess: "Método de pago guardado para la suscripción",
    setupError: "No se pudo guardar la tarjeta. Revisa los datos e inténtalo de nuevo.",
    elementsHint:
      "Los datos de la tarjeta los procesa Stripe; no se almacenan en Boeltech.",
    readOnlyHint:
      "Solo puedes consultar los métodos guardados. Pide a un administrador si necesitas agregar o cambiar la tarjeta.",
    gatewayUnavailable:
      "El cobro con tarjeta no está disponible en este momento. Contacta a Boeltech o usa transferencia.",
  },
  modules: {
    title: "Extras contratados",
    description:
      "Lo que contrataste además de los módulos de operación de tu plan.",
    loading: "Cargando extras…",
    empty: {
      title: "Sin extras contratados",
      description: (planName: string) =>
        planName
          ? `Tu plan ${planName} incluye los módulos de operación. Aquí aparecerán los que contrates después.`
          : "Tu plan incluye los módulos de operación. Aquí aparecerán los que contrates después.",
    },
    eaBadge: "Versión anticipada",
    pricePerMonth: (amount: string) => `${amount}/mes`,
    includesMembers: (count: number) =>
      count === 1 ? "Incluye 1 módulo" : `Incluye ${count} módulos`,
    activatedAt: (date: string) => `Activo desde ${date}`,
    level: {
      label: "Análisis de rentabilidad",
      profitabilityLink: "Ver rentabilidad de tus viajes",
    },
  },
  contact: {
    title: "¿Necesitas ajustar tu flota o banda?",
    description:
      "Escríbenos para revisar motrizes cobrables, módulos adicionales o dudas de cobro. El precio es por motriz; sin fee ni mínimo.",
    cta: "Contactar a Boeltech",
    email: "billing@boeltech.com",
  },
} as const;
