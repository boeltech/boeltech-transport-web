export const billingCopy = {
  page: {
    sectionTitle: "Tu plan",
    title: "Tu plan",
    description:
      "Tu cupo para facturar, lo que incluye tu plan y si hay algo por pagar.",
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
          ? "Te queda 1 timbre del paquete de tu plan."
          : `Te quedan ${remaining} timbres del paquete de tu plan.`,
    },
    contactCta: "Escribir a Boeltech",
  },
  stamps: {
    title: "Facturación del mes",
    description: "Cada factura o complemento de pago que emites usa un timbre.",
    periodLabel: (period: string) => `Mes en curso: ${period}`,
    loading: "Cargando consumo…",
    unavailable: "No pudimos mostrar tu consumo de timbres.",
    summary: (used: number, included: number) =>
      `${used} de ${included} timbres usados`,
    remaining: (count: number) =>
      count === 1
        ? "Te queda 1 timbre este mes"
        : `Te quedan ${count} timbres este mes`,
    prepaidRemaining: (count: number) =>
      count === 1
        ? "Además tienes 1 timbre comprado aparte, sin fecha de vencimiento."
        : `Además tienes ${count} timbres comprados aparte, sin fecha de vencimiento.`,
    usedPercent: (percent: number) => `${percent}% usado`,
    /** Qué pasa al agotar el paquete del plan, en una sola frase. */
    runOut: {
      soft_cap:
        "Si se acaban, puedes seguir facturando y se cobra cada timbre extra.",
      hard_cap:
        "Si se acaban, la facturación se detiene hasta el siguiente mes.",
    } as Record<string, string>,
    overageTitle: "Timbres extra usados",
    overage: (stamps: number, amount: string) =>
      stamps === 1
        ? `1 timbre extra este mes · ${amount} estimado`
        : `${stamps} timbres extra este mes · ${amount} estimado`,
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
  plan: {
    title: "Qué incluye tu plan",
    description: "Capacidad y vigencia de tu plan actual.",
    loading: "Cargando plan…",
    empty: {
      title: "Tu empresa no tiene un plan activo",
      description:
        "Cuando Boeltech active tu plan verás aquí su capacidad y su vigencia.",
      contactCta: "Escribir a Boeltech",
    },
    planFallback: "Plan comercial",
    fields: {
      users: "Usuarios incluidos",
      branches: "Sucursales incluidas",
      historyRetention: "Historial disponible",
      trial: "Fin de la prueba",
      notes: "Notas de tu acuerdo",
    },
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
        ? "Durante la prueba tienes 1 timbre; al activar tu plan se restaura el paquete completo."
        : `Durante la prueba tienes ${included} timbres; al activar tu plan se restaura el paquete completo.`,
    trialEndedHint:
      "La fecha de fin de prueba ya pasó. Activa tu plan para seguir facturando.",
    unlimited: "Sin límite",
    historyMonths: (months: number) =>
      months === 1 ? "1 mes" : `${months} meses`,
    periodRange: (start: string, end: string) => `${start} — ${end}`,
  },
  costs: {
    title: "Este mes",
    description: "Estimación del mes en curso.",
    periodLabel: (period: string) => `Mes en curso: ${period}`,
    loading: "Cargando el estimado…",
    unavailable: "No pudimos mostrar el estimado de tu mes.",
    totalLabel: "Estimado a pagar",
    totalHint: "Incluye impuestos",
    cycleHint: (cycle: string) => `Se cobra ${cycle}`,
    rows: {
      plan: "Precio del plan",
      modules: "Módulos adicionales",
      overage: "Timbres extra",
      subtotal: "Subtotal",
      iva: "Impuestos",
    },
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
      "Todavía debes cobros de meses anteriores. Puedes seguir operando; escríbenos para regularizar el pago.",
    loading: "Cargando saldo…",
    openCount: (count: number) =>
      count === 1 ? "1 cobro pendiente" : `${count} cobros pendientes`,
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
    footer:
      "Para registrar el pago o aclarar un cobro, escríbenos. El estimado del mes actual está más abajo, en Este mes.",
    contactCta: "Escribir a Boeltech",
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
    title: "¿Necesitas cambiar de plan?",
    description:
      "Escríbenos para contratar módulos, ampliar tu paquete de timbres o resolver dudas de cobro.",
    cta: "Contactar a Boeltech",
    email: "billing@boeltech.com",
  },
} as const;
