/** Copy ES-MX consola ops v1 (PRD §F · AUDIT-D* · LID-D8) — superficie D4. */
export const opsCopy = {
  brand: "Boeltech Ops",
  /** Wordmark M4 — sustituye badge «Ops» + Shield. */
  wordmark: "boeltech/ops",
  monogram: "b/",
  envLabel: "Consola",
  theme: {
    trigger: "Tema de la consola",
    menuLabel: "Elegir tema",
    system: "Sistema",
    light: "Claro",
    dark: "Oscuro",
  },
  cmdk: {
    placeholder: "Buscar empresa, cobro o acción…",
    trigger: "Buscar…",
    empty: "Sin empresas que coincidan.",
    emptyHint: "Prueba otro nombre o identificador.",
    groupTenants: "Empresas",
    shortcutHint: "⌘K",
  },
  a11y: {
    cmdkTitle: "Buscar en Boeltech Ops",
    cmdkDescription: "Escribe para filtrar empresas y acciones. Escape cierra.",
  },

  nav: {
    hoy: "Hoy",
    empresas: "Empresas",
    cobranza: "Cobranza",
    catalogo: "Catálogo",
    uso: "Uso",
    auditoria: "Auditoría",
    seguridad: "Seguridad",
    designSystem: "Design System",
    logout: "Cerrar sesión",
    erpLink: "Ir al login de tlamx",
    openMenu: "Abrir menú",
  },
  designSystem: {
    brand: "Boeltech Ops",
    badge: "Design System",
    subtitle:
      "SoT visual craft A «Primer denso» × «Mando acero» (`--ops-*`). Hairline · status icon · pills · outline. Accent acero (≠ #0969DA) · light + dark aislado del ERP.",
    preview: {
      label: "Vista previa",
      light: "Claro",
      dark: "Oscuro",
      hint: "Local al showcase — no cambia el tema de la consola.",
    },
    groups: {
      foundations: "Foundations",
      components: "Components",
      patterns: "Patterns",
    },
    sections: {
      brand: "Marca",
      color: "Color",
      typography: "Tipografía",
      density: "Densidad / Espaciado",
      contrast: "Contraste",
      components: "Components",
      patterns: "Patterns",
    },
  },
  money: {
    currency: "MXN",
  },
  hoy: {
    title: "Hoy",
    description:
      "Mando operativo · métricas primero, luego la cola de atención.",
    queuesRule: "Colas",
    kpiAria: "Indicadores de Hoy",
    generatedAt: (iso: string) => `Actualizado ${iso}`,
    kpi: {
      mora: {
        label: "Mora abierta",
        caption: (n: number) =>
          n === 1
            ? "1 empresa · cobro pendiente"
            : `${n} empresas · cobro pendiente`,
      },
      suspended: {
        label: "Suspendidos",
        caption: "Acceso cortado",
      },
      activation: {
        label: "Activación",
        caption: "Admin pendiente",
      },
      trial: {
        label: "Trial",
        caption: "≤ 7 días restantes",
      },
    },
    chips: {
      activation: "Activar admin",
      trial: "Trial ≤7d",
      pastDue: "Cobro pendiente",
      suspended: "Suspendidos",
    },
    columns: {
      tenant: "Empresa",
      plan: "Plan",
      balance: "Saldo",
      days: "Señal",
      actions: "Acción",
    },
    empty: {
      title: "Cola vacía",
      description: "No hay empresas en esta cola ahora.",
    },
    error: {
      title: "No se pudo cargar Hoy",
      description: "No pudimos cargar Hoy. Intenta de nuevo.",
      retry: "Reintentar",
    },
    cta: {
      resend: "Reenviar activación",
      viewHub: "Ver empresa",
      registerPayment: "Registrar pago",
      reactivate: "Reactivar",
      suspend: "Suspender",
    },
    view: "Ver",
  },
  registerPayment: {
    title: "Registrar pago",
    description:
      "Elige un cobro SaaS abierto. Factura SaaS · no es CFDI de transporte.",
    empty: "No hay cobros abiertos para esta empresa.",
    emptyHint: "Emite un cobro desde Cobranza o revisa Cobranza.",
    loading: "Cargando cobros…",
    columns: {
      period: "Periodo",
      total: "Total",
      due: "Vence",
      action: "Acción",
    },
    select: "Registrar pago",
    close: "Cerrar",
    goCobranza: "Ver Cobranza",
  },
  hub: {
    back: "Empresas",
    saasBanner: "Factura SaaS · no es CFDI de transporte",
    statusRule: "Estado",
    kpiAria: "Indicadores de la empresa",
    kpi: {
      health: {
        label: "Salud",
        caption: "Score operativo",
        empty: "—",
      },
      openAr: {
        label: "CxC abierta",
        caption: (n: number) =>
          n === 1 ? "1 factura abierta" : `${n} facturas abiertas`,
      },
      access: {
        label: "Acceso",
        caption: "Estado de plataforma",
      },
      activation: {
        label: "Activación",
      },
      modules: {
        label: "Complementos",
        caption: (n: number) =>
          n === 1 ? "1 complemento activo" : `${n} complementos activos`,
        empty: "0",
      },
    },
    strip: {
      accessLabel: "Acceso",
      subscriptionLabel: "Suscripción",
      planLabel: "Plan",
      planMissing: "Sin plan",
      subscriptionMissing: "Sin suscripción",
      lifecycleLabel: "Etapa",
      viewAr: "Cobros",
      pastDueOperating: "Sigue operando · cobro pendiente",
    },
    tabs: {
      resumen: "Resumen",
      suscripcion: "Suscripción",
      uso: "Uso",
      cobranza: "Cobranza",
      activacion: "Activación",
      auditoria: "Auditoría",
    },
    semaphores: {
      acceso: "Acceso",
      cobranza: "Cobranza",
      capacidad: "Capacidad",
      timbres: "Timbres",
    },
    semaphoreTones: {
      ok: "En orden",
      warn: "Atención",
      danger: "Riesgo",
      unknown: "Sin dato",
    },
    primary: {
      continueOnboarding: "Continuar alta",
      resendActivation: "Reenviar activación",
      registerPayment: "Registrar pago",
      changePlan: "Cambiar plan",
      reactivate: "Reactivar empresa",
      attachAddon: "Adjuntar complemento",
    },
    overflow: {
      more: "Más",
      suspend: "Suspender empresa",
      rotate: "Rotar enlace",
      resend: "Reenviar activación",
      attachAddon: "Adjuntar complemento",
    },
    loadError: {
      title: "No se pudo cargar la empresa",
      description: "Intenta recargar o vuelve al listado.",
      retry: "Reintentar",
    },
    notFound: "Empresa no encontrada",
    modules: {
      title: "Complementos contratados",
      description:
        "Complementos y packs contratados directamente. Precio mensual congelado al activar, sin IVA.",
      add: "Agregar complemento",
      loading: "Cargando complementos…",
      error: {
        title: "No se pudieron cargar los complementos",
        description: "Intenta de nuevo en unos segundos.",
        retry: "Reintentar",
      },
      empty: {
        title: "Sin complementos",
        description:
          "La empresa opera solo con su plan. Los complementos contratados aparecerán aquí.",
      },
      columns: {
        module: "Complemento",
        kind: "Tipo",
        activatedAt: "Desde",
        price: "Precio mensual",
        actions: "Acción",
      },
      kindLabels: {
        addon: "Complemento",
        pack: "Pack",
        minipack: "Mini-pack",
      } as Record<string, string>,
      tierLabels: {
        ea: "Acceso anticipado",
        ga: "Disponibilidad general",
      },
      retired: "Retirado del catálogo",
      includes: (names: string) => `Incluye: ${names}`,
      total: "Total mensual de complementos",
      profitabilityLevel: "Indicador interno de margen",
      remove: "Quitar",
      removeAria: (name: string) => `Quitar ${name}`,
      removeDialog: {
        title: "Quitar complemento",
        description: (name: string) =>
          `Se quitará «${name}» de la empresa. Su ERP puede tardar hasta 2 minutos en reflejarlo.`,
        lockedPrice: "Precio mensual congelado",
        modulesLost: "Módulos que deja de tener",
        loadingPreview: "Calculando impacto…",
        previewFailedTitle: "No se pudo calcular el impacto",
        previewFailedHint:
          "Puedes quitarlo de todos modos; revisa Auditoría después.",
        cancel: "Cancelar",
        confirm: "Quitar complemento",
        confirming: "Quitando…",
        success: (name: string) => `Complemento quitado: ${name}`,
        error: "No se pudo quitar el complemento",
      },
    },
  },
  preview: {
    changePlanTitle: "Cambiar plan",
    changePlanDescription:
      "Revisa el impacto antes de aplicar. Factura SaaS · no es CFDI de transporte.",
    attachTitle: "Adjuntar complemento",
    attachDescription:
      "Revisa módulos ganados o perdidos. En v1 solo puedes cambiar plan o complemento del catálogo.",
    planLabel: "Plan destino",
    moduleLabel: "Complemento",
    reasonLabel: "Razón (auditoría)",
    reasonPlaceholder: "Ej. upgrade solicitado por deal desk…",
    reviewImpact: "Revisar impacto",
    apply: "Aplicar cambio",
    applyAddon: "Adjuntar",
    cancel: "Cancelar",
    loadingPreview: "Calculando impacto…",
    previewError: "No se pudo calcular el impacto",
    applySuccess: "Plan actualizado",
    applyAddonSuccess: (name: string) => `Complemento activado: ${name}`,
    moduleActive: "ya activo",
    moduleIncluded: "ya incluido",
    applyError: "No se pudo aplicar el cambio",
    currentPlan: "Plan actual",
    targetPlan: "Plan destino",
    modulesGained: "Módulos ganados",
    modulesLost: "Módulos perdidos",
    none: "Ninguno",
    capacity: {
      title: "Capacidad",
      maxUsers: "Usuarios",
      maxBranches: "Sucursales",
      historyMonths: "Meses de historial",
      includedStamps: "Timbres incluidos",
      stampsPerMotriz: "Timbres / motriz",
    },
    pricePending: "Lista pendiente de calibración",
    priceEstimate: (amount: string) => `Estimado mensual: ${amount}`,
    warnings: {
      PLAN_UNCHANGED: "El plan destino es el mismo que el actual",
      BRANCH_OVER_QUOTA_BLOCKS_PLAN_CHANGE:
        "Hay más sucursales activas que el tope del plan destino",
      MODULES_REQUIRE_OPERACION_PLAN:
        "Hay complementos que requieren plan Operación",
      MODULES_REQUIRE_OPERATIONAL_MOTRIZ:
        "Hay complementos que requieren suscripción operativa motriz",
      ADDONS_WILL_BE_REVOKED:
        "Se quitarán los complementos activos de esta empresa",
      PERIOD_IN_PROGRESS_BILLED_FULL:
        "El periodo en curso se cobra completo. A partir del siguiente ya no.",
      PLAN_PREREQUISITE_NOT_MET: "El plan actual no admite este complemento",
      ENTITLEMENT_ALREADY_ACTIVE: "El complemento ya está activo",
      ENTITLEMENT_NOT_FOUND: "El complemento no está activo",
    },
    periodBilledFull:
      "El periodo en curso se cobra completo. A partir del siguiente ya no.",
    modulesToRevoke: "Complementos que se quitan",
    effectiveAt: (iso: string) => `Efectivo: ${iso}`,
  },
  ar: {
    title: "Cobranza",
    description:
      "Cobros SaaS: quién debe, de qué mes y si está atrasado.",
    saasBanner: "Factura SaaS · no es CFDI de transporte",
    agingCurrent: "Al corriente",
    agingPage: "En esta página",
    chargeNotYetTitle: "Aún no corre el cobro automático",
    chargeNotYetDescription:
      "Si hay cargo pendiente y tarjeta, Ops intenta cobrar solo.",
  },
  catalog: {
    title: "Catálogo",
    description:
      "Planes, complementos y packs. Precios de lista: pendiente de calibración.",
    pricePending: "Lista pendiente de calibración",
    tabs: {
      plans: "Planes",
      modules: "Complementos",
      packs: "Packs de timbres",
    },
    columns: {
      name: "Nombre",
      code: "Código",
      capacity: "Capacidad",
      stamps: "Timbres",
      price: "Precio",
      activeTenants: "Empresas activas",
      action: "Acción",
    },
    useInTenant: "Usar en empresa…",
    activeTenantsLink: (count: number) =>
      count === 1 ? "1 empresa" : `${count} empresas`,
    activeTenantsEmpty: "Ninguna",
    empty: "No hay ítems en el catálogo.",
    loading: "Cargando catálogo…",
    error: "No se pudo cargar el catálogo",
    retry: "Reintentar",
    satLink: "Catálogos SAT (importación)",
    motrizBand: (min: number | null, max: number | null) => {
      if (min == null && max == null) return "—";
      if (min != null && max != null) return `${min}–${max} motrizes`;
      if (min != null) return `≥${min} motrizes`;
      return `≤${max} motrizes`;
    },
    packStamps: (n: number) => `${n} timbres`,
  },
  useInTenant: {
    title: "Usar en empresa",
    description: "Elige la empresa para abrir el Hub con vista previa.",
    searchPlaceholder: "Buscar por nombre o identificador…",
    empty: "Sin empresas que coincidan.",
    loading: "Buscando…",
    cancel: "Cancelar",
    open: "Abrir vista previa",
  },
  usage: {
    title: "Uso",
    description:
      "Motrizes activas y timbres del periodo (hora CDMX). Ábrelo en el Hub → Uso.",
    period: (key: string) => `Periodo ${key} (CDMX)`,
    motrizHelp:
      "Motriz activa: unidades del periodo (tracto, torton, rabón, pickup) con actividad.",
    columns: {
      tenant: "Empresa",
      plan: "Plan",
      stamps: "Timbres",
      overage: "Excedente",
      motrices: "Motrizes",
      action: "Acción",
    },
    selectTenant: "Selecciona una fila para ver motrizes activas.",
    motricesValue: (q: number | null | undefined) =>
      q == null || !Number.isFinite(q) ? "—" : String(q),
    stampsValue: (used: number, included: number) =>
      `${used} / ${included}`,
    openHub: "Ver en Hub",
    empty: "Sin filas de uso para este periodo.",
    loading: "Cargando uso…",
    error: "No se pudo cargar el uso",
    retry: "Reintentar",
  },
  audit: {
    title: "Auditoría",
    description:
      "Cambios hechos desde la consola (alta, plan, complemento, cobro, suspensión…). Sin acceso en nombre del cliente en v1.",
    columns: {
      date: "Fecha",
      operator: "Operador",
      action: "Acción",
      tenant: "Empresa",
      details: "Detalle",
    },
    empty: "Sin eventos de auditoría.",
    loading: "Cargando auditoría…",
    error: "No se pudo cargar la auditoría",
    retry: "Reintentar",
    clearTenant: "Quitar filtro de empresa",
    filterAction: "Acción",
    filterAll: "Todas",
  },
  tenants: {
    title: "Empresas",
    description: "Etapa y plan. Abre el Hub para salud y cobro.",
    create: "Crear empresa",
    searchPlaceholder: "Buscar por nombre o identificador…",
    columns: {
      name: "Empresa",
      plan: "Plan",
      stage: "Etapa",
      modules: "Complementos",
      date: "Fecha",
      action: "Acción",
      health: "Salud",
      access: "Acceso",
      commercial: "Comercial",
    },
    modulesEmpty: "—",
    modulesCell: (count: number, names: string) =>
      names ? `${count} · ${names}` : String(count),
    modulesMore: (extra: number) => ` +${extra}`,
    empty: "No hay empresas.",
    emptyFiltered: "Ninguna empresa coincide con el filtro.",
    loading: "Cargando empresas…",
    readOnly: "Solo lectura: no puedes crear ni mutar empresas.",
    filterAccess: "Acceso",
    filterModule: "Complemento",
    filterAll: "Todos",
    commercialEmpty: "Sin suscripción",
    viewAr: "Cobros",
    page: (page: number, totalPages: number) =>
      `Página ${page} de ${Math.max(1, totalPages)}`,
    prev: "Anterior",
    next: "Siguiente",
  },
  security: {
    title: "Seguridad",
    description: "Verificación en dos pasos del operador.",
    statusEnabled: "MFA activo",
    statusDisabled: "MFA inactivo",
  },
  ledger: {
    rule: "Salud",
  },
  quota: {
    stamps: "Timbres",
    unknown: "—",
  },
  secrets: {
    rule: "Códigos de recuperación",
    copy: "Copiar códigos",
    copied: "Copiado",
    example: "Códigos de ejemplo. No son de una cuenta.",
  },
  usagePanel: {
    overageStamps: (count: number) =>
      count === 1
        ? "1 timbre fuera del paquete"
        : `${count} timbres fuera del paquete`,
  },
  create: {
    title: "Crear empresa",
    description: "Alta SaaS + activación admin. Factura SaaS · no es CFDI.",
  },
} as const;
