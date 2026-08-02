export const billingCopy = {
  page: {
    sectionTitle: "Plan y consumo",
    title: "Plan y consumo",
    description:
      "Qué incluye tu plan, cuántas facturas puedes emitir este mes y cuánto se estima que pagarás.",
  },
  /** Aviso único de la parte superior: se muestra solo el primero que aplique. */
  notices: {
    noPlan: {
      title: "Tu empresa no tiene un plan activo",
      description:
        "Sin un plan activo no puedes crear viajes ni facturar. Escríbenos para activarlo; entretanto puedes entrar y consultar esta página.",
    },
    blocked: {
      title: "Tu plan está pausado",
      description:
        "Mientras esté pausado no puedes crear viajes ni facturar. Escríbenos para reactivarlo.",
    },
    trialExhausted: {
      title: "Se acabaron los timbres de tu prueba",
      description: (included: number) =>
        included === 1
          ? "Usaste el único timbre de la prueba. Para seguir facturando hay que activar tu plan."
          : `Usaste los ${included} timbres de la prueba. Para seguir facturando hay que activar tu plan.`,
    },
    trialEnded: {
      title: "Tu prueba llegó a su fecha de fin",
      description: (date: string) =>
        `La fecha de fin registrada es ${date}. Si ya no puedes facturar, escríbenos para activar tu plan.`,
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
    title: "Timbres para facturar",
    description: "Cada factura o complemento de pago que emites usa un timbre.",
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
        "Si se acaban, la facturación se detiene hasta el siguiente periodo.",
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
      period: "Periodo en curso",
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
    trialEndedHint: "La fecha de fin de prueba ya pasó.",
    unlimited: "Sin límite",
    historyMonths: (months: number) =>
      months === 1 ? "1 mes" : `${months} meses`,
    periodRange: (start: string, end: string) => `${start} — ${end}`,
  },
  costs: {
    title: "Cuánto pagarás este mes",
    description: "Estimación del periodo en curso.",
    loading: "Cargando el desglose…",
    unavailable: "No pudimos mostrar el desglose de tu mes.",
    totalLabel: "Estimado a pagar este mes",
    totalHint: "IVA incluido",
    cycleHint: (cycle: string) => `Se cobra ${cycle}`,
    rows: {
      plan: "Precio del plan",
      modules: "Módulos adicionales",
      overage: "Timbres extra",
      subtotal: "Subtotal",
      iva: "IVA (16%)",
    },
    disclaimer:
      "Es una estimación. Boeltech te enviará la factura del periodo.",
  },
  modules: {
    title: "Módulos adicionales",
    description:
      "Los módulos de operación vienen en tu plan. Aquí ves lo que contrataste además.",
    loading: "Cargando módulos…",
    empty: {
      title: "Sin módulos adicionales",
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
      badge: (code: string) => `Nivel ${code}`,
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
