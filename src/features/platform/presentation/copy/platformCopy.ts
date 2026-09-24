import { BRAND } from "@shared/ui/brand";

export const platformCopy = {
  brand: {
    name: BRAND.platformName,
    subtitle: BRAND.platformSubtitle,
    company: BRAND.companyName,
    /** Producto tenant (tlamx); no usar como nombre de esta consola. */
    tenantProduct: BRAND.productName,
  },
  shell: {
    headerContext: "Consola de plataforma",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    collapseSidebar: "Colapsar",
    readOnlyHint: "solo lectura",
    guestRole: "Operador",
    userMenu: "Menú de cuenta",
    authLoading: "Cargando sesión…",
  },
  login: {
    title: BRAND.platformName,
    description: `Inicia sesión con tu cuenta de operador ${BRAND.companyName}. Este acceso es distinto al login de empresas en ${BRAND.productName}.`,
    emailLabel: "Correo",
    passwordLabel: "Contraseña",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    validationSummaryTitle: "Revisa tus credenciales",
    submit: "Entrar a plataforma",
    submitting: "Iniciando sesión…",
    tenantLink: `¿Usas ${BRAND.productName} en tu empresa?`,
    tenantLinkAction: `Ir al login de ${BRAND.productName}`,
    errors: {
      invalidCredentials: "Credenciales inválidas. Verifica tu correo y contraseña.",
      sessionExpired: "Tu sesión de plataforma expiró. Inicia sesión de nuevo.",
    },
    mfa: {
      title: "Verificación en dos pasos",
      description:
        "Ingresa el código de tu app autenticadora o un código de recuperación.",
      codeLabel: "Código",
      validationSummaryTitle: "Revisa el código",
      submit: "Verificar y entrar",
      submitting: "Verificando…",
      back: "Volver al login",
      invalidCode: "Código MFA inválido. Inténtalo de nuevo.",
    },
  },
  security: {
    title: "Seguridad",
    description:
      "Protege la consola de plataforma con autenticación en dos pasos (TOTP).",
    mfaRequiredBanner:
      "Los propietarios de plataforma deben activar MFA antes de continuar.",
    statusEnabled: "MFA activo",
    statusDisabled: "MFA inactivo",
    setup: "Configurar MFA",
    confirm: "Confirmar código",
    disable: "Desactivar MFA",
    secretHint: "Guarda este secreto o escanea el QR en tu app autenticadora.",
    qrAlt: "Código QR para configurar MFA de plataforma",
    qrError: "No se pudo generar el QR. Usa el secreto manual.",
    qrLoading: "Generando código QR…",
    recoveryTitle: "Códigos de recuperación",
    recoveryHint:
      "Guárdalos en un lugar seguro. Cada código solo se puede usar una vez.",
    passwordLabel: "Contraseña actual",
    codeLabel: "Código TOTP",
    enabledAt: (iso: string) => `Activado el ${iso}`,
    enabledToast: "MFA activado",
    disabledToast: "MFA desactivado",
  },
  nav: {
    dashboard: "Pulso",
    tenants: "Empresas",
    ar: "Cobros",
    catalogs: "Catálogos globales",
    audit: "Historial",
    security: "Seguridad",
    logout: "Cerrar sesión",
    erpLink: `Ir a ${BRAND.productName}`,
  },
  pulse: {
    title: "Pulso",
    description:
      "Cola de atención y KPIs del parque. Prioriza empresas en riesgo o trial por vencer.",
    generatedAt: (iso: string) => `Generado ${iso}`,
    healthAsOf: (iso: string) => `Health actualizado ${iso}`,
    healthPending: "Health pendiente de primer refresh",
    kpis: {
      mrr: "MRR",
      mrrHint: "Ingreso recurrente mensual estimado",
      mrrAria: "Ver empresas",
      cxcOverdue: "CxC vencida",
      cxcOverdueHint: "Saldo abierto vencido",
      cxcOverdueAria: "Ver CxC vencida",
      atRisk: "En riesgo",
      atRiskHint: "Empresas at-risk o score < 40",
      atRiskAria: "Ver empresas en riesgo",
      trials: "Trials activos",
      trialsHint: "Suscripciones en prueba",
      trialsAria: "Ver trials activos",
    },
    queue: {
      title: "Cola de atención",
      description: "Empresas que requieren revisión hoy.",
      empty: {
        title: "Sin pendientes",
        description: "No hay empresas en la cola de atención.",
      },
      columns: {
        tenant: "Empresa",
        stage: "Etapa",
        health: "Health",
        reasons: "Motivos",
      },
    },
    reasonCodes: {
      health_below_threshold: "Health bajo",
      cxc_overdue: "CxC vencida",
      past_due: "Cobro pendiente",
      trial_ending: "Trial por vencer",
      suspended: "Suspendida",
    } as Record<string, string>,
    error: {
      title: "No se pudo cargar el Pulso",
      description:
        "Revisa la conexión con la API de plataforma e intenta recargar la página.",
    },
  },
  lifecycle: {
    labels: {
      prospect: "Prospecto",
      provisioning: "Aprovisionando",
      trialing: "En prueba",
      onboarding: "Onboarding",
      active: "Activa",
      at_risk: "En riesgo",
      suspended: "Suspendida",
      churned: "Baja",
      archived: "Archivada",
    } as Record<string, string>,
  },
  health: {
    nullLabel: "—",
    scoreLabel: (score: number) => String(score),
    breakdownTitle: "Salud de la empresa",
    breakdownDescription: "Señales ponderadas del último refresh (solo lectura).",
    asOf: (iso: string) => `Actualizado ${iso}`,
    pending: "Sin score aún (primer refresh pendiente).",
    signals: {
      fiscal: "Fiscal",
      payment: "Pago",
      adoption: "Adopción",
      fleet: "Flota",
      engagement: "Engagement",
    },
    tone: {
      healthy: "Saludable",
      watch: "Vigilancia",
      risk: "En riesgo",
      unknown: "Sin dato",
    },
  },
  dashboard: {
    title: "Panel de plataforma",
    description: `Indicadores del parque de clientes ${BRAND.productName}.`,
    cards: {
      totalTenants: "Empresas registradas",
      totalTenantsHint: "Empresas dadas de alta en plataforma",
      activeTenants: "Empresas activas",
      activeTenantsHint: "Sin suspensión de acceso",
      suspendedTenants: "Empresas suspendidas",
      suspendedTenantsHint: "Requieren revisión o reactivación",
      totalUsers: "Usuarios activos",
      totalUsersHint: "Suma en todas las empresas",
      newTenants: "Altas últimos 30 días",
      newTenantsHint: "Nuevas empresas en los últimos 30 días",
    },
    plans: {
      title: "Distribución por plan",
      description: "Cuántas empresas tiene asignado cada plan comercial.",
      columns: {
        plan: "Plan",
        tenants: "Empresas",
        share: "Participación",
      },
      tenantCount: (count: number) =>
        count === 1 ? "1 empresa" : `${count} empresas`,
      empty: {
        title: "Sin empresas con plan",
        description: "Aún no hay empresas con plan comercial asignado.",
      },
    },
    quickLinks: {
      title: "Accesos rápidos",
      description: "Tareas frecuentes de la consola.",
      tenants: {
        label: "Empresas",
        description: "Lista, alta y detalle.",
      },
      audit: {
        label: "Historial",
        description: "Cambios de operadores y del sistema.",
      },
      catalogs: {
        label: "Catálogos globales",
        description: "Catálogos compartidos del ecosistema.",
      },
    },
    error: {
      title: "No se pudieron cargar las métricas",
      description:
        "Revisa la conexión con la API de plataforma e intenta recargar la página.",
    },
  },
  tenants: {
    list: {
      title: "Empresas",
      description: "Consulta acceso, suscripción, etapa y health de cada empresa.",
      entityLabelPlural: "empresas",
      searchPlaceholder: "Buscar por nombre o identificador…",
      create: "Nueva empresa",
      readOnlyHint:
        "Tu rol es de soporte: puedes consultar empresas, pero no crear ni cambiar su estado.",
      readOnlyTitle: "Solo lectura",
      filters: {
        access: "Acceso",
        commercial: "Suscripción",
        plan: "Plan",
        stage: "Etapa",
        atRisk: "En riesgo",
        health: "Health",
        allAccess: "Todos",
        allCommercial: "Todas las suscripciones",
        allPlans: "Todos los planes",
        allStages: "Todas las etapas",
        allHealth: "Cualquier health",
        atRiskOnly: "Solo en riesgo",
        allRisk: "Todas",
        healthHealthy: "Saludable (≥ 70)",
        healthWatch: "Vigilancia (40–69)",
        healthRisk: "Crítico (< 40)",
        accessChip: (label: string) => `Acceso: ${label}`,
        commercialChip: (label: string) => `Suscripción: ${label}`,
        planChip: (label: string) => `Plan: ${label}`,
        stageChip: (label: string) => `Etapa: ${label}`,
        atRiskChip: "En riesgo",
        healthChip: (label: string) => `Health: ${label}`,
      },
      columns: {
        name: "Empresa",
        plan: "Plan",
        health: "Health",
        stage: "Etapa",
        access: "Acceso",
        commercial: "Suscripción",
      },
      commercialEmpty: "Sin suscripción",
      openTenantAria: (name: string) => `Abrir empresa ${name}`,
      empty: {
        title: "Sin empresas",
        description: "Crea la primera empresa desde aquí.",
        searchTitle: "Sin coincidencias",
        searchDescription:
          "No hay empresas que coincidan con la búsqueda o filtros actuales.",
      },
      refreshSuccess: "Lista actualizada",
    },
    detail: {
      title: "Detalle de empresa",
      back: "Volver a empresas",
      notFound: {
        title: "Empresa no encontrada",
        description: "La empresa no existe o fue eliminada.",
      },
      tabs: {
        summary: "Resumen",
        commercial: "Comercial",
        operation: "Operación",
        activity: "Actividad",
      },
      activity: {
        title: "Actividad reciente",
        description: "Eventos de auditoría de esta empresa.",
        empty: {
          title: "Sin eventos",
          description: "Aún no hay actividad registrada para esta empresa.",
        },
        error: {
          title: "No se pudo cargar la actividad",
          description: "Intenta recargar o abre el historial completo.",
        },
        viewAll: "Ver en historial",
        columns: {
          date: "Fecha",
          operator: "Quién",
          action: "Qué",
          details: "Detalle",
        },
      },
      sections: {
        thisMonth: "Este mes",
        thisMonthDescription:
          "Plan, consumo de timbres y total estimado del periodo.",
        planFallback: "Plan comercial",
        overview: "Datos de alta",
        usage: "Capacidad",
        operation: "Capacidad de la empresa",
        /** usage · branches; con granted (ADR-0095) muestra usage/granted. */
        capacitySummary: (
          users: number,
          branches: number,
          granted?: {
            users: number | null;
            branches: number | null;
          },
        ) => {
          if (!granted) {
            return `${users} usuarios · ${branches} sucursales`;
          }
          const usersGranted =
            granted.users == null ? "Ilimitado" : String(granted.users);
          const branchesGranted =
            granted.branches == null ? "Ilimitado" : String(granted.branches);
          return `${users} / ${usersGranted} usuarios · ${branches} / ${branchesGranted} sucursales`;
        },
        plan: "Plan comercial",
        subscription: "Detalle del plan",
        stampUsage: "Consumo de timbres",
        governance: "Estado de la empresa",
        advanced: "Más detalle",
        advancedShow: "Ver detalle del plan",
        advancedHide: "Ocultar detalle del plan",
        breakdownShow: "Ver desglose",
        breakdownHide: "Ocultar desglose",
        adminActivation: "Activación del administrador",
      },
      adminActivation: {
        title: "Activación del administrador",
        description:
          "Estado del enlace enviado al admin inicial. La contraseña se entrega aparte; el correo solo activa el acceso.",
        fields: {
          status: "Estado",
          email: "Correo",
          expiresAt: "Vence",
          lastSentAt: "Último envío",
          sendAttempts: "Intentos de envío",
          lastSendError: "Último error de envío",
        },
        statusLabels: {
          pending: "Pendiente",
          email_failed: "Email falló",
          expired: "Expirada",
          activated: "Activado",
          none: "Sin activación",
        } as Record<string, string>,
        statusHints: {
          pending: "El administrador aún no activó el acceso.",
          email_failed:
            "La empresa quedó creada, pero el email no se envió. Reenvía la invitación.",
          expired: "El enlace venció. Reenvía para emitir uno nuevo.",
          activated: "El administrador ya activó su acceso.",
          none: "Empresa anterior al flujo de activación; sin fila de invite.",
        } as Record<string, string>,
        resend: "Reenviar invitación",
        resending: "Reenviando…",
        resendSuccess: "Invitación de activación reenviada",
        resendError: "No se pudo reenviar la invitación",
        rotate: "Rotar contraseña",
        rotateDialog: {
          title: "Rotar contraseña del administrador",
          description:
            "Define una nueva contraseña sin activar la cuenta. Entrégala por un canal seguro; no se envía en el correo.",
          passwordLabel: "Nueva contraseña",
          resendLabel: "Reenviar enlace de activación",
          submit: "Guardar contraseña",
          submitting: "Guardando…",
          success: "Contraseña actualizada",
          successWithResend: "Contraseña actualizada y activación reenviada",
          error: "No se pudo actualizar la contraseña",
          cancel: "Cancelar",
        },
        readOnlyHint: "Solo el propietario puede reenviar o rotar credenciales.",
      },
      /**
       * First-paint strip in tenant detail header (all tabs).
       * Acceso = tenants.status; Suscripción = subscription.status; lifecycle = secondary.
       */
      commercialStrip: {
        accessLabel: "Acceso",
        subscriptionLabel: "Suscripción",
        planLabel: "Plan",
        planMissing: "Sin plan",
        subscriptionMissing: "Sin suscripción",
        pastDueOperating: "Sigue operando · cobro pendiente",
        graceRef: (deadlineLabel: string) =>
          `Referencia de gracia: ${deadlineLabel}`,
        graceMissing: "Referencia de gracia no disponible",
        trialEnds: (dateLabel: string) => `Fin de prueba: ${dateLabel}`,
        lifecycleLabel: "Etapa",
        lifecycleTooltip: (stageLabel: string) =>
          `Etapa del ciclo de vida: ${stageLabel}. Síntesis secundaria; no sustituye Acceso ni Suscripción.`,
      },
      governance: {
        title: "Estado de la empresa",
        helpLabel: "¿Por qué hay dos estados?",
        helpHide: "Ocultar explicación",
        helpBody:
          "Acceso controla si pueden iniciar sesión. Suscripción controla si pueden operar. Puedes cerrar el acceso sin cambiar el plan, o pausar la operación dejando el acceso abierto.",
        accessTitle: "Acceso",
        accessEffect: {
          active: "Pueden iniciar sesión.",
          suspended: "No pueden iniciar sesión.",
          cancelled: "Cuenta cancelada: no pueden iniciar sesión.",
        },
        commercialTitle: "Suscripción",
        commercialEffect: {
          trialing: "Puede operar en periodo de prueba.",
          active: "Puede operar con el plan contratado.",
          past_due: "Sigue operando · cobro pendiente.",
          paused: "No puede operar.",
          canceled: "No puede operar.",
          missing: "Sin suscripción: no puede operar.",
        },
        commercialLoading: "Cargando suscripción…",
        declaredFleetLabel: "Flota declarada",
        declaredFleetNone: "Sin declarar",
        declaredFleetValue: (bandLabel: string, units?: number | null) =>
          units != null ? `${bandLabel} · ${units}` : bandLabel,
        grace: {
          title: "Cobro pendiente — acción manual",
          orientation: (deadlineLabel: string) =>
            `Referencia de gracia: ${deadlineLabel}. No hay corte automático; decide Pausada o Activa según el cobro.`,
          orientationMissing:
            "Referencia de gracia no disponible. Decide Pausada o Activa según el cobro.",
          itemNotes: "Anotar cobro o acuerdo en las notas de la suscripción",
          itemPause: "Si venció la gracia → marcar suscripción como Pausada",
          itemActive: "Si pagó → volver suscripción a Activa",
          openSubscription: "Gestionar suscripción",
          readOnlyHint: "Solo el propietario puede cambiar el estado comercial.",
        },
      },
      metrics: {
        monthlyPrice: "Precio del plan",
        monthlyPriceHint: "Precio de lista mensual",
        stampsUsed: "Timbres usados",
        stampsHint: (period: string) => `Periodo ${period}`,
        estimatedTotal: "Total estimado",
        estimatedTotalHint: "Con IVA · periodo actual",
        activeModules: "Módulos contratados",
        activeModulesHint: "Complementos activos",
      },
      /** SoT v5 — hero/fila de precio (Q×P, pending Q, cotización, legacy). */
      planPrice: {
        quote: "Cotización por flota",
        quoteHint:
          "Banda Grande / SOW: sin P de lista; el cargo se acuerda deal a deal.",
        pendingQ: "Sin Q facturable aún",
        pricePerMotriz: (amount: string) => `${amount} / motriz / mes`,
        cargoHint: (unit: string, q: number) =>
          q === 1
            ? `${unit}/motriz · 1 motriz`
            : `${unit}/motriz · ${q} motrizes`,
        bolsaHint: (stampsPer: number, q: number) =>
          `Bolsa: ${stampsPer} × ${q}`,
        labelCargo: "Cargo por motrizes",
        labelUnit: "Precio por motriz",
        labelQuote: "Precio",
        labelLegacy: "Precio de lista",
      },
      usage: {
        users: "Usuarios activos",
        branches: "Sucursales activas",
        trips: "Viajes registrados",
        createdAt: "Alta",
        suspendedAt: "Suspensión",
      },
      subscription: {
        loading: "Cargando plan…",
        unavailable: "Sin suscripción comercial registrada.",
        description:
          "Límites del plan, periodo, notas internas e indicador de margen.",
        levelBadge: (level: string) => `Indicador ${level}`,
        trialQuotaHint:
          "En prueba: cupo de 15 timbres. Al pasar a Activa se restaura el paquete del plan.",
        trialExhaustedTitle: "Cupo de prueba agotado",
        trialExhaustedDescription:
          "La empresa usó los 15 timbres de prueba. El timbrado está bloqueado hasta reactivar el plan.",
        trialExpiredTitle: "Periodo de prueba vencido",
        trialExpiredDescription:
          "La fecha de fin de prueba ya pasó. El timbrado está bloqueado hasta reactivar el plan.",
        unlimited: "Ilimitado",
        historyMonths: (months: number) =>
          months === 1 ? "1 mes" : `${months} meses`,
        /** SoT ADR-0095: historial = consultable en listados (nunca “retención SAT”). */
        historyMonthsConsultable: (months: number) =>
          months === 1
            ? "1 mes consultable en listados"
            : `${months} meses consultables en listados`,
        /** usage / granted; granted null → ilimitado. */
        usageGranted: (usage: number, grantedLabel: string) =>
          `${usage} / ${grantedLabel}`,
        /** Operador platform: exceso visible; operar OK, no crecer. */
        overLimitHint:
          "OVER_LIMIT — por encima del cupo: puede operar; no puede crecer.",
        pendingBandHint:
          "Cupo baja el 1.º del próximo mes (ciclo CDMX).",
        fields: {
          plan: "Plan comercial",
          status: "Estado",
          cycle: "Ciclo de facturación",
          price: "Precio de lista",
          period: "Periodo actual",
          profitabilityLevel: "Indicador interno de margen",
          users: "Usuarios",
          branches: "Sucursales",
          historyConsultable: "Historial consultable",
          /** @deprecated alias — usar historyConsultable (ADR-0095). */
          historyRetention: "Historial consultable",
          trial: "Fin de prueba",
          notes: "Notas del acuerdo",
        },
        statusLabels: {
          trialing: "En prueba",
          active: "Activa",
          past_due: "Cobro pendiente",
          paused: "Pausada",
          canceled: "Cancelada",
        },
        cycleLabels: {
          monthly: "Mensual",
          annual: "Anual",
        },
      },
      stampUsage: {
        loading: "Cargando consumo…",
        unavailable: "Consumo de timbres no disponible.",
        description: "Timbres usados al facturar en el periodo actual.",
        summary: (used: number, included: number) =>
          `${used} de ${included} timbres`,
        remaining: (count: number) =>
          count === 1 ? "1 timbre disponible" : `${count} timbres disponibles`,
        prepaidRemaining: (count: number) =>
          count === 1
            ? "1 timbre prepago disponible"
            : `${count} timbres prepago disponibles`,
        usedPercent: (percent: number) => `${percent}% del paquete usado`,
        period: "Periodo",
        quotaPolicy: "Política de excedente",
        quotaPolicyLabels: {
          soft_cap: "Permite excedente",
          hard_cap: "Corta al límite",
        } as Record<string, string>,
        quotaPolicyDescriptions: {
          soft_cap:
            "Puede superar el paquete incluido; el excedente se cobra por timbre adicional.",
          hard_cap:
            "Al agotar el paquete, el timbrado se detiene hasta el siguiente periodo.",
        } as Record<string, string>,
        overageTitle: "Excedente del periodo",
        overage: (stamps: number, amount: string) =>
          `${stamps} timbre${stamps === 1 ? "" : "s"} fuera del paquete (${amount} estimado)`,
        usageAlerts: {
          watch: {
            title: "Consumo en seguimiento (70%)",
            description: (remaining: number) =>
              remaining <= 0
                ? "La empresa alcanzó el umbral de seguimiento del paquete incluido."
                : `≥70% del paquete. Quedan ${remaining} timbre${remaining === 1 ? "" : "s"} en el periodo.`,
          },
          warning: {
            title: "Paquete casi agotado (80%)",
            description: (remaining: number) =>
              remaining <= 0
                ? "La empresa agotó el paquete incluido. Revisa la política de excedente o contacta a facturación."
                : `Quedan ${remaining} timbre${remaining === 1 ? "" : "s"} del paquete incluido.`,
          },
          exhausted: {
            title: "Paquete agotado (100%)",
            description:
              "La empresa consumió el 100% de los timbres incluidos. Si permite excedente, puede seguir timbrando; el excedente se cobra por timbre adicional.",
          },
        },
        exportCsv: "Descargar estimado",
        exportSuccess: "Estimado descargado",
        exportError: "No se pudo descargar el estimado",
        exportEstimateHint:
          "Estimado con precios y módulos actuales (no es snapshot histórico del periodo). No usar para CFDI ni para Nuevo cobro.",
      },
      actions: {
        manageSubscription: "Gestionar suscripción",
        manageEntitlements: "Módulos",
        grantStampPack: "Acreditar timbres",
        viewHistory: "Historial",
        moreActions: "Más acciones",
        suspend: "Suspender",
        reactivate: "Reactivar",
        cancel: "Cancelar cuenta",
      },
      suspendedAt: (date: string) => `Suspendida el ${date}`,
    },
    stampPacks: {
      title: "Acreditar timbres prepago",
      description:
        "Asigna un pack del catálogo (50 / 150 / 500). Sin caducidad; se consume antes del excedente. No aplica en periodo de prueba.",
      balanceTitle: "Saldo prepago actual",
      balanceSummary: (remaining: number) =>
        remaining === 1
          ? "1 timbre prepago disponible"
          : `${remaining} timbres prepago disponibles`,
      fields: {
        pack: "Pack prepago",
        notes: "Notas (opcional)",
      },
      placeholders: {
        pack: "Selecciona un pack",
        notes: "Ej. transferencia SPEI, folio comercial…",
      },
      selectedHint: (stamps: number, price: string) =>
        `Se acreditarán ${stamps} timbres (${price}).`,
      cancel: "Cancelar",
      submit: "Acreditar pack",
      submitting: "Acreditando…",
      success: "Prepago acreditado",
      error: "No se pudo acreditar el prepago",
      remainingLabel: "Prepago disponible",
      remaining: (count: number) =>
        count === 1 ? "1 timbre" : `${count} timbres`,
    },
    create: {
      title: "Nueva empresa",
      description: "Alta con administrador inicial y plan comercial.",
      back: "Volver a empresas",
      sections: {
        company: "Empresa",
        companyDescription:
          "Datos que identifican a la empresa en la consola y en el sistema.",
        admin: "Administrador inicial",
        adminDescription:
          "Usuario administrador que recibirá acceso al entorno recién creado.",
        plan: "Plan comercial",
        planDescription:
          "Define capacidad y paquete de timbres desde el primer día. La flota es orientativa: puedes elegir otro plan.",
      },
      fields: {
        companyName: "Nombre comercial",
        subdomain: "Identificador (subdominio)",
        adminEmail: "Correo del administrador",
        adminPassword: "Contraseña inicial",
        adminFirstName: "Nombre",
        adminLastName: "Apellido",
        fleetBand: "¿Cuántas unidades opera la empresa?",
        fleetBandPlaceholder: "Opcional — tip de plan",
        fleetBandNone: "Sin declarar (default Micro)",
        plan: "Plan comercial",
        planPlaceholder: "Selecciona un plan",
        recommendedBadge: "Recomendado",
      },
      fleetBands: {
        "1_10": "1–10 unidades",
        "11_30": "11–30 unidades",
        "31_100": "31–100 unidades",
        "100_plus": "Más de 100 unidades",
      } as Record<string, string>,
      hints: {
        subdomain:
          "Solo minúsculas, números y guiones (sin guión al inicio o final). Mínimo 3 caracteres.",
        subdomainPreview: (value: string) =>
          value
            ? `Identificador: ${value}`
            : "El identificador aparecerá aquí al escribirlo.",
        adminPassword:
          "Entre 8 y 128 caracteres, con mayúscula, minúscula y número. Genera una segura, cópiala y entrégala por un canal seguro: la contraseña no se envía por correo.",
        adminEmail:
          "Será el usuario con el que el administrador inicia sesión tras activar el acceso.",
        fleetBand:
          "Rangos orientativos del catálogo comercial. No bloquean un plan distinto.",
        planOverride:
          "Puedes elegir otro plan distinto al sugerido según flota.",
      },
      passwordActions: {
        show: "Mostrar contraseña",
        hide: "Ocultar contraseña",
        generate: "Generar segura",
        copy: "Copiar contraseña",
        copied: "Contraseña copiada",
        copyError: "No se pudo copiar la contraseña",
      },
      plansLoading: "Cargando planes comerciales…",
      plansEmpty:
        "No hay planes comerciales disponibles. Intenta de nuevo más tarde.",
      planPreview: {
        title: "Resumen del plan seleccionado",
        price: "Precio de lista",
        pricePerMotriz: (amount: string) => `${amount} / motriz / mes`,
        users: "Usuarios incluidos",
        branches: "Sucursales incluidas",
        stamps: "Timbres incluidos",
        unlimited: "Ilimitado",
        stampsPerMonth: (count: number) => `${count} timbres/mes`,
        stampsPerMotriz: (count: number) => `${count} timbres / motriz`,
      },
      notice: {
        title: "Qué ocurre al crear",
        description:
          "Se crea la empresa y se envía un enlace de activación al administrador. La contraseña no va en el correo: cópiala y entrégala por un canal seguro. El admin activa el acceso con el enlace y luego inicia sesión en el ERP.",
      },
      validation: {
        companyNameRequired: "El nombre comercial es requerido",
        companyNameMax: "Máximo 255 caracteres",
        subdomainMin: "Mínimo 3 caracteres",
        subdomainMax: "Máximo 50 caracteres",
        subdomainFormat:
          "Solo minúsculas, números y guiones; sin guión al inicio o final",
        adminEmailInvalid: "Correo inválido",
        adminPasswordMin: "La contraseña debe tener al menos 8 caracteres",
        adminPasswordMax: "Máximo 128 caracteres",
        adminPasswordComplexity:
          "Debe contener mayúscula, minúscula y número",
        adminFirstNameRequired: "Nombre requerido",
        adminFirstNameMax: "Máximo 100 caracteres",
        adminLastNameRequired: "Apellido requerido",
        adminLastNameMax: "Máximo 100 caracteres",
        planRequired: "Selecciona un plan",
        summaryTitle: "Revisa los datos de la empresa",
      },
      cancel: "Cancelar",
      submit: "Crear empresa",
      submitting: "Creando empresa…",
      success: "Empresa creada correctamente",
      successPending:
        "Empresa creada. Se envió la invitación de activación al administrador.",
      successEmailFailed:
        "Empresa creada, pero no se pudo enviar el email de activación.",
      successEmailFailedHint:
        "Reenvía la invitación desde el detalle de la empresa.",
      error: "No se pudo crear la empresa",
      accessDenied: "No tienes permiso para crear empresas.",
    },
    manageSubscription: {
      title: "Gestionar suscripción",
      description: "Cambia el plan y cómo puede operar esta empresa.",
      fleetHint: (bandLabel: string, planName: string) =>
        `Con flota ${bandLabel}, suele encajar ${planName}. Puedes elegir otro.`,
      fields: {
        plan: "Plan",
        status: "Estado",
        cycle: "Ciclo",
        trial: "Fin de prueba",
        notes: "Notas internas",
      },
      placeholders: {
        plan: "Selecciona un plan",
        notes: "Ej. acuerdo de pago del 12/ago; pendiente de confirmar…",
      },
      notesHint: "Opcional. Referencia de acuerdo o cobro para el equipo.",
      statusEffects: {
        trialing: "Puede operar en periodo de prueba.",
        active: "Puede operar con el plan.",
        past_due: "Sigue operando · cobro pendiente.",
        paused: "No puede operar.",
        canceled: "No puede operar.",
      },
      sectionPlan: "Plan",
      sectionStatus: "Cómo opera",
      sectionNotes: "Notas (opcional)",
      cancel: "Cancelar",
      submit: "Guardar",
      submitting: "Guardando…",
      success: "Cambios guardados",
      error: "No se pudieron guardar los cambios",
    },
    entitlements: {
      title: "Módulos contratados",
      description:
        "Activa o revoca complementos y packs. Los packs expanden sus módulos incluidos automáticamente.",
      loading: "Cargando catálogo…",
      empty: "No hay módulos en el catálogo comercial.",
      packBadge: "Pack",
      includesMembers: (count: number) =>
        count === 1 ? "Incluye 1 módulo" : `Incluye ${count} módulos`,
      levelBadge: (level: string) => `Indicador ${level}`,
      effectiveCount: (count: number) =>
        count === 1 ? "1 módulo efectivo" : `${count} módulos efectivos`,
      success: "Módulos actualizados",
      error: "No se pudo actualizar el módulo",
      readOnlyHint: "Tu rol es de soporte: solo lectura de módulos.",
      previewPrice: (amount: string, tier: "ea" | "ga") =>
        tier === "ea"
          ? `Precio al activar: ${amount} (acceso anticipado)`
          : `Precio al activar: ${amount}`,
      lockedPrice: (amount: string) => `Precio bloqueado: ${amount}/mes`,
    },
    commercial: {
      title: "Módulos contratados",
      description: "Complementos activos y desglose del total estimado.",
      loading: "Cargando desglose…",
      unavailable: "Desglose no disponible.",
      manageCta: "Gestionar módulos",
      noModules: {
        title: "Sin complementos adicionales",
        description:
          "El plan base incluye la operación. Los complementos contratados aparecerán aquí.",
      },
      totalsSection: "Desglose del mes",
      eaBadge: "Acceso anticipado",
      perMonth: "/mes",
      kindLabels: {
        addon: "Complemento",
        pack: "Pack",
        minipack: "Mini-pack",
      } as Record<string, string>,
      totals: {
        plan: "Plan",
        modules: "Complementos",
        overage: "Excedente de timbres",
        subtotal: "Subtotal estimado",
        iva: "IVA (16%)",
        estimatedTotal: "Total estimado (con IVA)",
      },
      disclaimer:
        "Precios de lista mensuales sin IVA en líneas; el total incluye IVA. El cobro y la factura los gestiona Boeltech fuera del producto.",
    },
    suspend: {
      suspendTitle: "Suspender acceso",
      reactivateTitle: "Reactivar acceso",
      cancelTitle: "Cancelar cuenta (acceso)",
      suspendDescription:
        "Bloquea el inicio de sesión de todos los usuarios hasta reactivar. No cambia la suscripción ni los módulos.",
      reactivateDescription:
        "Restaura el inicio de sesión. Si la suscripción está pausada o cancelada, la empresa podría seguir sin poder operar.",
      cancelDescription:
        "Baja definitiva de acceso. No cancela la suscripción ni revoca módulos; usa Gestionar suscripción para el eje comercial.",
      reasonLabel: "Motivo (opcional)",
      reasonPlaceholder: "Ej. impago, solicitud del cliente…",
      cancel: "Cancelar",
      confirmSuspend: "Suspender acceso",
      confirmReactivate: "Reactivar acceso",
      confirmCancel: "Confirmar cancelación de acceso",
      success: "Acceso actualizado",
      error: "No se pudo actualizar el acceso",
    },
  },
  catalogs: {
    title: "Catálogos globales",
    description:
      "Actualiza las tablas oficiales SAT que usan todas las empresas (release kit).",
    entityLabelPlural: "catálogos",
    search: {
      placeholder: "Buscar por nombre o código…",
    },
    groups: {
      geography: {
        title: "Geografía",
        description:
          "Carga en este orden: estados → municipios → localidades/colonias → códigos postales.",
      },
      cartaPorte: {
        title: "Carta Porte",
        description:
          "Claves de mercancía, equipo y figuras para el complemento.",
      },
      cfdi: {
        title: "CFDI",
        description: "Formas de pago, usos CFDI, regímenes, monedas y afines.",
      },
      other: {
        title: "Otros",
        description: "Catálogos SAT que no encajan en los grupos anteriores.",
      },
    },
    table: {
      columns: {
        catalog: "Catálogo",
        version: "Versión",
        items: "Ítems",
        action: "Acción",
      },
      versionEmpty: "—",
      itemsEmpty: "—",
    },
    import: "Actualizar",
    readOnlyHint:
      "Tu rol es de soporte: puedes consultar catálogos, pero no actualizarlos.",
    readOnlyTitle: "Solo lectura",
    csvTypeMismatchHint:
      "El archivo no coincide con el catálogo seleccionado. Descarga la plantilla del tipo correcto o elige otro catálogo.",
    empty: {
      title: "Sin catálogos",
      description: "No hay catálogos disponibles para actualizar.",
      searchTitle: "Sin coincidencias",
      searchDescription: "Prueba con otro nombre o código.",
    },
    error: {
      title: "No se pudieron cargar los catálogos",
      description:
        "Revisa la conexión con la API de plataforma e intenta recargar la página.",
    },
  },
  audit: {
    title: "Historial",
    description: "Cambios de operadores y del sistema.",
    entityLabelPlural: "eventos",
    tenantFilter: {
      title: "Filtrando por empresa",
      description: (tenantName: string) =>
        `Mostrando solo eventos de ${tenantName}.`,
      clear: "Ver todos los eventos",
    },
    refreshSuccess: "Historial actualizado",
    filters: {
      action: "Acción",
      allActions: "Todas las acciones",
      dateFrom: "Desde",
      dateTo: "Hasta",
      applyDates: "Aplicar fechas",
      tenantChip: (label: string) => `Empresa: ${label}`,
      actionChip: (label: string) => `Acción: ${label}`,
      dateFromChip: (label: string) => `Desde: ${label}`,
      dateToChip: (label: string) => `Hasta: ${label}`,
    },
    columns: {
      date: "Fecha",
      operator: "Quién",
      action: "Qué",
      tenant: "Empresa",
      details: "Detalle",
    },
    actions: {
      tenant_created: "Empresa creada",
      tenant_status_changed: "Acceso de empresa",
      tenant_plan_assigned: "Plan asignado",
      tenant_fleet_declared: "Flota declarada",
      tenant_self_serve_registered: "Alta pública",
      tenant_admin_activation_sent: "Activación enviada",
      tenant_admin_activation_resent: "Activación reenviada",
      tenant_admin_activated: "Admin activado",
      tenant_admin_credentials_rotated: "Credenciales rotadas",
      trial_auto_cut: "Corte automático de prueba",
      catalog_import: "Catálogo actualizado",
      subscription_assigned: "Suscripción asignada",
      module_entitled: "Módulo activado",
      module_revoked: "Módulo revocado",
      stamp_pack_granted: "Prepago acreditado",
      saas_invoice_issued: "Cobro emitido",
      saas_invoice_paid: "Cobro pagado",
      saas_invoice_voided: "Cobro anulado",
      subscription_past_due_auto: "Suscripción → past_due (auto)",
      subscription_active_restored_auto: "Suscripción → active (auto)",
    },
    systemOperator: "Sistema",
    selfServeOperator: "Alta pública",
    unknownTenant: "Empresa desconocida",
    noDetail: "Sin detalle",
    viewTenantAudit: "Historial",
    openTenantAria: (name: string) => `Abrir empresa ${name}`,
    empty: {
      title: "Sin eventos",
      description: "No hay registros con los filtros actuales.",
      searchTitle: "Sin coincidencias",
      searchDescription:
        "Prueba ampliando el rango de fechas o quitando filtros.",
    },
    error: {
      title: "No se pudo cargar el historial",
      description:
        "Revisa la conexión con la API de plataforma e intenta recargar.",
    },
    metadata: {
      statusChanged: (
        previousStatus: string,
        status: string,
        reason?: string | null,
      ) =>
        reason
          ? `${previousStatus} → ${status} · ${reason}`
          : `${previousStatus} → ${status}`,
      planAssigned: (planCode: string) => `Plan: ${planCode}`,
      tenantCreated: (subdomain: string, planCode?: string | null) =>
        planCode ? `${subdomain} · ${planCode}` : subdomain,
      catalogImport: (typeCode?: string | null, version?: string | null) =>
        typeCode
          ? version
            ? `${typeCode} v${version}`
            : typeCode
          : "Catálogo actualizado",
      subscriptionAssigned: (planCode: string, status?: string | null) =>
        status ? `Plan: ${planCode} · ${status}` : `Plan: ${planCode}`,
      moduleEntitled: (moduleCode: string) => `Módulo: ${moduleCode}`,
      moduleRevoked: (moduleCode: string) => `Módulo: ${moduleCode}`,
      fleetDeclared: (band?: string | null, units?: number | null) =>
        band
          ? units != null
            ? `Banda ${band} · ${units} unidades`
            : `Banda ${band}`
          : "Flota declarada",
      stampPackGranted: (catalogCode?: string | null) =>
        catalogCode ? `Pack: ${catalogCode}` : "Prepago acreditado",
      selfServeRegistered: (subdomain: string, planCode?: string | null) =>
        planCode
          ? `${subdomain} · ${planCode} · en prueba`
          : `${subdomain} · en prueba`,
      trialAutoCut: (reason?: string | null, planCode?: string | null) => {
        const parts = ["→ Cancelada"];
        if (reason) parts.unshift(reason);
        if (planCode) parts.push(planCode);
        return parts.join(" · ");
      },
      activationSent: (email?: string | null, sendFailed?: boolean) => {
        const base = email ? `Email: ${email}` : "Activación enviada";
        return sendFailed ? `${base} · envío fallido` : base;
      },
      activationResent: (email?: string | null, sendFailed?: boolean) => {
        const base = email ? `Reenviado a ${email}` : "Activación reenviada";
        return sendFailed ? `${base} · envío fallido` : base;
      },
      adminActivated: (email?: string | null) =>
        email ? `Activó: ${email}` : "Admin activado",
      credentialsRotated: (
        email?: string | null,
        resendActivation?: boolean | null,
      ) => {
        const base = email ? `Rotadas · ${email}` : "Credenciales rotadas";
        return resendActivation ? `${base} · reenvío` : base;
      },
      saasInvoiceIssued: (
        periodKey?: string | null,
        totalLabel?: string | null,
      ) => {
        const parts: string[] = [];
        if (periodKey) parts.push(periodKey);
        if (totalLabel) parts.push(totalLabel);
        return parts.length > 0 ? parts.join(" · ") : "Cobro emitido";
      },
      saasInvoicePaid: (
        totalLabel?: string | null,
        method?: string | null,
      ) => {
        const parts: string[] = [];
        if (totalLabel) parts.push(totalLabel);
        if (method) parts.push(method);
        return parts.length > 0 ? parts.join(" · ") : "Cobro pagado";
      },
      saasInvoiceVoided: (reason?: string | null) =>
        reason ? `Anulado · ${reason}` : "Cobro anulado",
      subscriptionPastDueAuto: (overdueCount?: number | null) =>
        overdueCount != null
          ? `past_due · ${overdueCount} cobro(s) vencido(s)`
          : "Suscripción → past_due",
      subscriptionActiveRestoredAuto: () => "Suscripción → active",
    },
  },
  ar: {
    title: "Cobros",
    description: "Quién debe, de qué mes y si está atrasado.",
    entityLabelPlural: "cobros",
    navHint: "Cobros",
    columns: {
      tenant: "Empresa",
      period: "Mes",
      status: "Estado",
      total: "Monto",
      dueDate: "Vence",
      daysOverdue: "Atraso",
      dueAndOverdue: "Vence / atraso",
      actions: "Acciones",
    },
    status: {
      draft: "Borrador",
      open: "Pendiente",
      paid: "Pagado",
      void: "Anulado",
    },
    views: {
      pending: "Pendientes",
      overdue: "Atrasados",
      all: "Todos",
      exceptions: "Excepciones",
      ariaLabel: "Vista de cobros",
      chipWithCount: (label: string, count: number) => `${label} ${count}`,
      chipAria: (label: string, count: number) => `${label}, ${count}`,
    },
    origin: {
      auto: "Auto-emitido",
      autoHint: "Emitido solo al cerrar el mes",
    },
    skipReasons: {
      NOT_CUSTOMER: "No es una empresa de clientes",
      SUB_NOT_ELIGIBLE:
        "La suscripción no se cobra (prueba, pausada o cancelada)",
      NO_CUT: "No hay corte de este mes",
      CUT_NO_FLEET: "Sin flota cobrable en ese mes",
      CUT_QUOTE: "El plan exige cotización",
      CUT_ERROR: "El corte de ese mes falló",
      CUT_NOT_BILLABLE: "El corte no está listo para emitir",
      MISSING_PLAN_CODE: "Falta el plan en el corte",
      MODULES_SNAPSHOT_NULL: "El corte no congeló los módulos",
      TOTAL_ZERO: "El monto del mes quedó en cero",
      VOID_HOLD: "Hay un cobro anulado de este mes",
      ISSUE_FAILED: "La emisión automática no creó el cobro",
    },
    closeRun: {
      periodLabel: (period: string) => `Mes ${period}`,
      ranAt: (when: string) => `Corrida ${when}`,
      notYetTitle: "El mes cerrado aún no se emite",
      notYetDescription: "La corrida corre sola al día siguiente del cierre.",
      zeroTitle: "Mes cerrado emitido · 0 excepciones",
      zeroDescription: "Pasa a Pendientes y cobra.",
      actionableTitle: (count: number) =>
        count === 1
          ? "Mes cerrado emitido · 1 excepción"
          : `Mes cerrado emitido · ${count} excepciones`,
      actionableDescription:
        "Hay excepciones que no se emitieron solas.",
      actionableOnExceptions: "Estas filas no se emitieron solas.",
      viewExceptions: "Ver excepciones",
      csvCaption: "El CSV es para el CFDI fuera.",
      loading: "Consultando el cierre del mes…",
      errorTitle: "No se pudo cargar el cierre del mes",
      errorDescription: "Intenta recargar. Los cobros de abajo siguen disponibles.",
    },
    chargeRun: {
      ranAt: (when: string) => `Corrida ${when}`,
      notYetTitle: "Aún no corre el cobro automático",
      notYetDescription:
        "Si hay cargo pendiente y tarjeta, Tlamx intenta cobrar solo.",
      ranTitle: "Cobro automático",
      countsLine: (counts: {
        charged: number;
        noPaymentMethod: number;
        failed: number;
        requiresAction: number;
        processing: number;
      }) => {
        const parts: string[] = [
          counts.charged === 1 ? "1 cobrado" : `${counts.charged} cobrados`,
        ];
        if (counts.noPaymentMethod > 0) {
          parts.push(
            counts.noPaymentMethod === 1
              ? "1 sin tarjeta"
              : `${counts.noPaymentMethod} sin tarjeta`,
          );
        }
        if (counts.failed > 0) {
          parts.push(
            counts.failed === 1 ? "1 falló" : `${counts.failed} fallaron`,
          );
        }
        if (counts.requiresAction > 0) {
          parts.push(
            counts.requiresAction === 1
              ? "1 por confirmar"
              : `${counts.requiresAction} por confirmar`,
          );
        }
        if (counts.processing > 0) {
          parts.push(
            counts.processing === 1
              ? "1 procesando"
              : `${counts.processing} procesando`,
          );
        }
        return parts.join(" · ");
      },
      attentionDescription:
        "Hay cargos que no se cobraron solos. Revisa Pendientes.",
      attentionOnPending:
        "Cobra a mano o espera el siguiente intento automático.",
      zeroDescription: "La última corrida no dejó cargos por atender.",
      viewPending: "Ver pendientes",
      loading: "Consultando la última corrida de cobro…",
      errorTitle: "No se pudo cargar la corrida de cobro",
      errorDescription:
        "Intenta recargar. Los cobros de abajo siguen disponibles.",
    },
    chargeChip: {
      charged: "Cobrado",
      noPaymentMethod: "Sin tarjeta",
      failed: "Falló",
      requiresAction: "Confirmar tarjeta",
      processing: "Procesando",
    },
    exceptions: {
      emptyNotRanTitle: "Aún no corre la emisión",
      emptyNotRanDescription:
        "Cuando corra el job verás aquí solo las excepciones accionables.",
      emptyZeroTitle: "Sin excepciones",
      emptyZeroDescription:
        "El mes cerrado ya se emitió. Ve a Pendientes para cobrar.",
      emptyTitle: "Sin excepciones",
      emptyDescription: "No hay excepciones accionables con los filtros actuales.",
      columns: {
        tenant: "Empresa",
        reason: "Motivo",
        amount: "Monto",
        actions: "Acciones",
      },
    },
    filters: {
      status: "Estado",
      statusAll: "Todos",
      periodKey: "Mes de cobro",
      periodKeyPlaceholder: "Elegir mes",
      minDaysOverdue: "Días de atraso mín.",
      overdueNone: "Sin mínimo",
      tenant: "Empresa",
      tenantPlaceholder: "Buscar empresa…",
      tenantEmpty: "No hay empresas con ese nombre",
      tenantClear: "Quitar filtro de empresa",
      tenantSearching: "Buscando…",
    },
    actions: {
      issue: "Nuevo cobro",
      issueDraft: "Emitir",
      issueDraftSubmitting: "Emitiendo…",
      issueDraftSuccess: "Cobro emitido",
      issueDraftError: "No se pudo emitir el cobro",
      markPaid: "Registrar pago",
      chargeStripe: "Cobrar con Stripe",
      void: "Anular",
      viewTenant: "Ver empresa",
      viewAr: "Ver en Cobros",
      menuAria: "Acciones del cobro",
    },
    empty: {
      title: "Sin cobros",
      description: "No hay cobros con los filtros actuales.",
    },
    error: {
      title: "No se pudieron cargar los cobros",
      description: "Intenta recargar en un momento.",
    },
    readOnlyAlert:
      "Tu rol es de solo lectura: puedes consultar los cobros, pero no emitir ni cobrar.",
    refreshToast: "Cobros actualizados",
    refreshAria: "Actualizar lista",
    card: {
      title: "Cobros",
      description: "Cargos de servicio de esta empresa pendientes o saldados.",
      loading: "Cargando…",
      emptyTitle: "Sin cobros",
      empty: "Aún no hay cobros emitidos.",
      openBadge: (n: number) =>
        n === 1 ? "1 cobro pendiente" : `${n} cobros pendientes`,
      daysOverdue: (n: number) =>
        n === 1 ? "1 día de atraso" : `${n} días de atraso`,
      closeExportTitle: "Cierre del mes",
      closeExportDescription:
        "CSV del periodo cerrado para el CFDI fuera. El cobro del mes se emite solo.",
      skipBannerTitle: "Este mes no se emitió solo",
      skipBannerPolicy:
        "No se emite cobro por política. El 1:1 tampoco aplica.",
      closePeriodLabel: "Mes de cierre",
      closePeriodPlaceholder: "2026-07",
      exportClose: "Exportar cierre",
      exportCloseSuccess: "Cierre descargado",
      exportCloseError: "No se pudo exportar el cierre",
      exportCloseNotClosed:
        "Solo periodos cerrados. El mes en curso es estimado (card Este mes).",
      exportCloseInvalidPeriod: "Usa el formato AAAA-MM (ej. 2026-07).",
      /** Badge tarjeta SaaS (ADR-0076) — no CFDI de flete. */
      cardOnFile: (last4: string) => `Tarjeta ••${last4}`,
      cardMissing: "Sin tarjeta",
      cardLoading: "Tarjeta…",
      chargeNeedsCard:
        "La empresa no tiene tarjeta guardada para cargos de suscripción. Pídele que la agregue en Ajustes → Suscripción.",
    },
    chargeStripe: {
      title: "Cobrar con Stripe",
      description:
        "Cargo de suscripción SaaS Boeltech a la tarjeta guardada de la empresa. No es un cobro de flete ni CFDI de viaje.",
      amountLabel: "Monto a cobrar",
      amountHint: "Igual al saldo pendiente del cobro (no editable).",
      cardLabel: "Tarjeta",
      cardMissing:
        "Sin tarjeta predeterminada. No se puede cobrar hasta que la empresa guarde un método de pago.",
      cancel: "Cancelar",
      submit: "Confirmar cobro",
      submitting: "Cobrando…",
      authenticating: "Confirmando autenticación…",
      success: "Cargo de suscripción registrado",
      requiresAction:
        "Confirma la autenticación de la tarjeta para completar el cargo.",
      failed: "No se pudo completar el cargo de suscripción.",
      error: "No se pudo cobrar con Stripe",
      gatewayUnavailable:
        "Cobro con Stripe no está configurado en este entorno.",
    },
    closeHint:
      "El cobro del mes cerrado se emite solo. El CSV sigue siendo para el CFDI fuera.",
    issue: {
      title: "Nuevo cobro del mes",
      description:
        "Se calcula el monto del mes cerrado y se crea el cobro pendiente.",
      periodKey: "Mes a emitir",
      periodPlaceholder: "2026-07",
      periodKeyClosedOnly:
        "Solo meses cerrados. El mes en curso es estimado (card Este mes).",
      initialStatus: "Estado inicial",
      statusOpen: "Emitida (pendiente de cobro)",
      statusDraft: "Borrador",
      statusDraftHint:
        "El borrador no aparece como pendiente de cobro hasta que lo emitas.",
      notes: "Notas",
      dueDays: "Días para pagar",
      preview: "Monto del mes",
      previewLoading: "Calculando…",
      previewEmpty: "Sin datos de ese mes todavía.",
      previewHint: "Indica un mes cerrado para ver el monto.",
      subtotal: "Subtotal",
      iva: "Impuestos",
      total: "Total",
      cancel: "Cancelar",
      submit: "Emitir cobro",
      submitDraft: "Guardar borrador",
      submitting: "Emitiendo…",
      submittingDraft: "Guardando…",
      success: "Cobro emitido",
      successDraft: "Borrador guardado",
      error: "No se pudo emitir el cobro",
      errorDraft: "No se pudo guardar el borrador",
    },
    markPaid: {
      title: "Registrar pago",
      description: "Marca el cobro como pagado (pago completo).",
      paidAt: "Fecha de pago",
      method: "Forma de pago",
      methods: {
        manual: "Manual",
        spei: "Transferencia",
        card_external: "Tarjeta",
        other: "Otro",
      },
      reference: "Referencia",
      notes: "Notas",
      cancel: "Cancelar",
      submit: "Marcar pagado",
      submitting: "Guardando…",
      success: "Cobro marcado como pagado",
      error: "No se pudo registrar el pago",
    },
    void: {
      title: "Anular cobro",
      description:
        "El cobro anulado deja de contar como pendiente y podrás emitir otro del mismo mes.",
      reason: "Motivo (opcional)",
      cancel: "Cancelar",
      confirm: "Anular cobro",
      cancelling: "Anulando…",
      success: "Cobro anulado",
      error: "No se pudo anular el cobro",
    },
  },
  roles: {
    platform_owner: "Propietario plataforma",
    platform_support: "Soporte plataforma",
  },
} as const;
