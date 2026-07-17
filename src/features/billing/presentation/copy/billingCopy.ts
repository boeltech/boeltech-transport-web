export const billingCopy = {
  page: {
    sectionTitle: "Plan y consumo",
  },
  hero: {
    badge: "Tu suscripción",
    title: "Consulta tu plan, módulos y timbres",
    description:
      "Consulta el plan comercial activo de tu empresa, el consumo de timbres del periodo y los add-ons contratados.",
    planFallback: "Plan comercial",
    steps: [
      {
        title: "Plan y límites",
        description: "Precio de lista, periodo de facturación y capacidad incluida.",
      },
      {
        title: "Consumo de timbres",
        description: "Uso del paquete fiscal del periodo y excedentes estimados.",
      },
      {
        title: "Módulos contratados",
        description: "Add-ons o packs adicionales activos en tu empresa.",
      },
    ],
    stepPrefix: (step: number) => `${step}`,
  },
  plan: {
    title: "Detalle del plan",
    description: "Condiciones comerciales y límites operativos de tu suscripción.",
    loading: "Cargando plan…",
    empty: {
      title: "Sin suscripción activa",
      description:
        "No encontramos un plan comercial asociado a tu empresa. Contacta a soporte si crees que es un error.",
    },
    fields: {
      plan: "Plan comercial",
      status: "Estado",
      cycle: "Ciclo de facturación",
      price: "Precio de lista",
      period: "Periodo actual",
      profitabilityLevel: "Nivel de rentabilidad",
      users: "Usuarios incluidos",
      branches: "Sucursales incluidas",
      historyRetention: "Retención de historial",
      trial: "Fin de periodo de prueba",
      notes: "Notas comerciales",
    },
    statusLabels: {
      trialing: "En prueba",
      active: "Activa",
      past_due: "Vencida",
      paused: "Pausada",
      canceled: "Cancelada",
    } as Record<string, string>,
    cycleLabels: {
      monthly: "Mensual",
      annual: "Anual",
    } as Record<string, string>,
    profitabilityHint:
      "Indica el nivel de analítica de rentabilidad habilitado para tu tenant.",
    trialQuotaHint:
      "En periodo de prueba el cupo de timbres es 15, no el paquete completo del plan. Al activar la suscripción se restaura el cupo del plan.",
    trialExhaustedTitle: "Cupo de prueba agotado",
    trialExhaustedDescription:
      "Usaste los 15 timbres de la prueba. El timbrado está bloqueado hasta que se active tu plan comercial.",
    trialExpiredTitle: "Periodo de prueba vencido",
    trialExpiredDescription:
      "La fecha de fin de prueba ya pasó. El timbrado está bloqueado hasta que se active tu plan comercial.",
    unlimited: "Ilimitado",
    historyMonths: (months: number) =>
      months === 1 ? "1 mes" : `${months} meses`,
  },
  metrics: {
    monthlyPrice: "Precio de lista del plan",
    monthlyPriceHint: "Sin IVA · Solo el plan base",
    monthlyPriceTooltip:
      "Precio de lista mensual del plan comercial, sin add-ons, sin excedente de timbres y sin IVA.",
    estimatedTotal: "Total estimado del periodo",
    estimatedTotalHint: "Con IVA · Plan + módulos + excedente",
    estimatedTotalTooltip:
      "Estimación de lista del periodo actual (plan + add-ons + excedente de timbres + IVA). No sustituye tu CFDI; el cobro lo gestiona Boeltech.",
    estimatedTotalLink: "Ver desglose en el resumen comercial",
    users: "Usuarios incluidos",
    branches: "Sucursales incluidas",
    includedInPlan: "Incluidos en el plan",
  },
  stamps: {
    title: "Consumo de timbres",
    description:
      "Los timbres se consumen al timbrar CFDI (facturas, complementos Carta Porte, REP, etc.) durante el periodo de facturación.",
    loading: "Cargando consumo…",
    unavailable: "Consumo de timbres no disponible.",
    summary: (used: number, included: number) => `${used} de ${included} timbres`,
    remaining: (count: number) =>
      count === 1 ? "1 timbre disponible" : `${count} timbres disponibles`,
    prepaidRemaining: (count: number) =>
      count === 1
        ? "1 timbre prepago disponible (sin caducidad)"
        : `${count} timbres prepago disponibles (sin caducidad)`,
    usedPercent: (percent: number) => `${percent}% del paquete usado`,
    quotaPolicy: "Política de excedente",
    quotaPolicyLabels: {
      soft_cap: "Tope flexible",
      hard_cap: "Tope estricto",
    } as Record<string, string>,
    quotaPolicyDescriptions: {
      soft_cap:
        "Puedes superar el paquete incluido; el excedente se factura por timbre adicional.",
      hard_cap:
        "Al agotar el paquete incluido, el timbrado se detiene hasta el siguiente periodo.",
    } as Record<string, string>,
    overageTitle: "Excedente del periodo",
    overage: (stamps: number, amount: string) =>
      `${stamps} timbre${stamps === 1 ? "" : "s"} fuera del paquete (${amount} estimado)`,
    historyTitle: "Periodos recientes",
    historyDescription: "Consumo de timbres en los últimos ciclos de facturación.",
    historyColumns: {
      period: "Periodo",
      used: "Usados",
      overage: "Excedente",
    },
    historyNone: "Sin excedente",
    usageAlerts: {
      watch: {
        title: "Consumo en seguimiento (70%)",
        description: (remaining: number) =>
          remaining <= 0
            ? "Ya alcanzaste el umbral de seguimiento del paquete incluido."
            : `Llevas ≥70% del paquete. Te quedan ${remaining} timbre${remaining === 1 ? "" : "s"} en el periodo.`,
      },
      warning: {
        title: "Paquete casi agotado (80%)",
        description: (remaining: number) =>
          remaining <= 0
            ? "Agotaste el paquete incluido. Revisa la política de excedente o contacta a facturación."
            : `Te quedan ${remaining} timbre${remaining === 1 ? "" : "s"} del paquete incluido.`,
      },
      exhausted: {
        title: "Paquete agotado (100%)",
        description:
          "Consumiste el 100% de los timbres incluidos. Con tope flexible puedes seguir timbrando; el excedente se factura por timbre adicional.",
      },
    },
  },
  modules: {
    title: "Módulos contratados",
    description:
      "Add-ons y packs adicionales activos. Los módulos base de operación vienen incluidos en tu plan comercial.",
    loading: "Cargando módulos…",
    empty: {
      title: "Sin add-ons adicionales",
      description: (planName: string) =>
        planName
          ? `Tu plan ${planName} incluye los módulos operativos base. Aquí aparecerán los add-ons que contrates.`
          : "Tu plan incluye los módulos operativos base. Aquí aparecerán los add-ons que contrates.",
    },
    kindLabels: {
      addon: "Add-on",
      pack: "Paquete",
      minipack: "Mini-pack",
      module: "Módulo",
    } as Record<string, string>,
    pricePerMonth: (amount: string) => `${amount}/mes`,
    eaBadge: "Early Access",
    includesMembers: (count: number) =>
      count === 1 ? "Incluye 1 módulo" : `Incluye ${count} módulos`,
    activatedAt: (date: string) => `Activo desde ${date}`,
    statusLabels: {
      active: "Activo",
      inactive: "Inactivo",
    } as Record<string, string>,
  },
  commercial: {
    title: "Resumen comercial estimado",
    description:
      "Desglose del precio de lista: plan, módulos contratados, excedente de timbres e IVA del periodo actual.",
    disclaimer:
      "Montos de lista estimados. La facturación y el cobro los gestiona Boeltech; este resumen no sustituye tu CFDI.",
    totals: {
      plan: "Plan Operación",
      modules: "Add-ons y packs",
      overage: "Excedente de timbres",
      subtotal: "Subtotal estimado",
      iva: "IVA (16%)",
      estimatedTotal: "Total estimado (con IVA)",
    },
  },
  contact: {
    title: "¿Necesitas cambiar de plan?",
    description:
      "Para contratar módulos, ampliar tu paquete de timbres o resolver dudas de facturación, escribe a nuestro equipo comercial.",
    cta: "Contactar facturación",
    email: "billing@boeltech.com",
  },
} as const;
